import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db, paymentSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { isDisposableDomain } from "../lib/domain-cache.js";
import { verifySmtp } from "../lib/smtp-verifier.js";
import {
  computeReputationScore,
  computeRiskLevel,
  buildTags,
  isRoleAccount,
  isFreeEmail,
} from "../lib/reputation.js";
import dns from "dns";

const dnsPromises = dns.promises;

async function checkMx(domain: string): Promise<boolean> {
  try {
    const records = await dnsPromises.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

const router = Router();

const MAX_RETRIES = 0;
const INITIAL_RETRY_DELAY_MS = 5000;
const RETRY_MULTIPLIER = 2;

// ── Free verify limit cache (avoid DB hit on every request) ─────────────────
let cachedFreeLimit: number | null = null;
let freeLimitCacheExpiry = 0;
const FREE_LIMIT_TTL_MS = 60_000; // 60 seconds

const FREE_VERIFY_COOKIE = "tempshield_free_verify";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface FreeSession {
  count: number;
  expiresAt: Date;
}

/** Cookie-keyed sessions — powers the "X of N used" counter in the UI */
const freeSessions = new Map<string, FreeSession>();

/**
 * IP-keyed sessions — the real abuse-prevention layer.
 * Clearing cookies does NOT reset this counter.
 */
const freeIpSessions = new Map<string, FreeSession>();

function pruneExpired() {
  const now = new Date();
  for (const [k, v] of freeSessions) {
    if (v.expiresAt < now) freeSessions.delete(k);
  }
  for (const [k, v] of freeIpSessions) {
    if (v.expiresAt < now) freeIpSessions.delete(k);
  }
}

async function getFreeVerifyLimit(): Promise<number> {
  const now = Date.now();
  if (cachedFreeLimit !== null && now < freeLimitCacheExpiry) {
    return cachedFreeLimit;
  }
  try {
    const [row] = await db
      .select({ freeVerifyLimit: paymentSettingsTable.freeVerifyLimit })
      .from(paymentSettingsTable)
      .where(eq(paymentSettingsTable.id, 1))
      .limit(1);
    cachedFreeLimit = row?.freeVerifyLimit ?? 5;
    freeLimitCacheExpiry = now + FREE_LIMIT_TTL_MS;
    return cachedFreeLimit as number;
  } catch {
    return cachedFreeLimit ?? 5;
  }
}

function getOrCreateSession(
  map: Map<string, FreeSession>,
  key: string | undefined,
  autoCreate = true,
): { key: string; session: FreeSession; isNew: boolean } {
  pruneExpired();
  if (key) {
    const existing = map.get(key);
    if (existing && existing.expiresAt > new Date()) {
      return { key, session: existing, isNew: false };
    }
  }
  if (!autoCreate) {
    const stub: FreeSession = { count: 0, expiresAt: new Date(Date.now() + SESSION_TTL_MS) };
    return { key: key ?? "__none__", session: stub, isNew: true };
  }
  const newKey = key && map !== freeSessions ? key : uuidv4();
  const session: FreeSession = { count: 0, expiresAt: new Date(Date.now() + SESSION_TTL_MS) };
  map.set(newKey, session);
  return { key: newKey, session, isNew: true };
}

/** Extract a stable client identifier from the request (IP). */
function clientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress ?? "unknown";
}

const freeVerifySchema = z.object({
  email: z.string().email(),
  captchaToken: z.string().min(1, "Captcha token is required"),
});

const prewarmSchema = z.object({
  email: z.string().email(),
});

// ── Exact-email SMTP result cache (5 min TTL) ─────────────────────────────────
interface CachedSmtp {
  result: Awaited<ReturnType<typeof verifySmtp>>;
  mxValid: boolean;
  expiresAt: number;
}
const smtpCache = new Map<string, CachedSmtp>();
const SMTP_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function pruneSmtpCache() {
  const now = Date.now();
  for (const [cacheKey, value] of smtpCache) {
    if (value.expiresAt < now) smtpCache.delete(cacheKey);
  }
}

async function cachedSmtpCheck(domain: string, email: string): Promise<{ smtpResult: Awaited<ReturnType<typeof verifySmtp>>; mxValid: boolean }> {
  pruneSmtpCache();
  const cacheKey = email.trim().toLowerCase();
  const hit = smtpCache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return { smtpResult: hit.result, mxValid: hit.mxValid };
  }
  const mxValid = await checkMx(domain);
  const smtpResult = {
    canConnect: false,
    mxAcceptsMail: false,
    isDeliverable: false,
    isCatchAll: false,
    hasInboxFull: false,
    isDisabled: false,
    mxRecords: [],
  };
  
  smtpCache.set(cacheKey, { result: smtpResult, mxValid, expiresAt: Date.now() + SMTP_CACHE_TTL_MS });
  return { smtpResult, mxValid };
}

// GET /api/verify/free/status — returns remaining checks for current session
router.get("/verify/free/status", async (req, res) => {
  const cookieId = req.cookies?.[FREE_VERIFY_COOKIE];
  const ip = clientIp(req);
  const limit = await getFreeVerifyLimit();

  const { key: sessionId, session: cookieSession, isNew: cookieIsNew } = getOrCreateSession(
    freeSessions,
    cookieId,
  );
  const { session: ipSession } = getOrCreateSession(freeIpSessions, ip);

  if (cookieIsNew) {
    res.cookie(FREE_VERIFY_COOKIE, sessionId, {
      httpOnly: true,
      maxAge: SESSION_TTL_MS,
      sameSite: "lax",
      path: "/",
    });
  }

  // Effective used count is the higher of the two trackers
  const used = Math.max(cookieSession.count, ipSession.count);
  const remaining = Math.max(0, limit - used);
  res.json({ used, limit, remaining, limitReached: remaining === 0 });
});

// POST /api/verify/prewarm — trigger MX/SMTP check without waiting for result or hitting quota
router.post("/verify/prewarm", async (req, res) => {
  const parsed = prewarmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  const { email } = parsed.data;
  const domainRaw = email.split("@")[1];
  const domain = domainRaw?.toLowerCase() ?? "";

  if (isDisposableDomain(domain)) {
    // No need to pre-warm SMTP for disposable 
    res.json({ message: "prewarmed (skipped)" });
    return;
  }

  // Start check in background, don't await
  cachedSmtpCheck(domain, email).catch(() => {});
  
  res.json({ message: "prewarming started" });
});

// POST /api/verify/free — public email check, session + IP rate-limited
router.post("/verify/free", async (req, res) => {
  const cookieId = req.cookies?.[FREE_VERIFY_COOKIE];
  const ip = clientIp(req);
  const limit = await getFreeVerifyLimit();

  const { key: sessionId, session: cookieSession, isNew: cookieIsNew } = getOrCreateSession(
    freeSessions,
    cookieId,
  );
  const { session: ipSession } = getOrCreateSession(freeIpSessions, ip);

  if (cookieIsNew || !cookieId) {
    res.cookie(FREE_VERIFY_COOKIE, sessionId, {
      httpOnly: true,
      maxAge: SESSION_TTL_MS,
      sameSite: "lax",
      path: "/",
    });
  }

  // Block if EITHER the cookie session OR the IP session is exhausted
  const effectiveUsed = Math.max(cookieSession.count, ipSession.count);
  const remaining = Math.max(0, limit - effectiveUsed);

  if (remaining === 0) {
    res.status(429).json({
      error: "You have used all your free checks. Sign up for a free account to get more.",
      used: effectiveUsed,
      limit,
      remaining: 0,
      limitReached: true,
    });
    return;
  }

  const parsed = freeVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email address or missing captcha." });
    return;
  }

  const { email, captchaToken } = parsed.data;

  // 🔒 reCAPTCHA verification — FAIL CLOSED (security best practice)
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: "Captcha not configured. Please contact support." });
    logger.error("RECAPTCHA_SECRET_KEY not configured in environment");
    return;
  }

  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}&remoteip=${ip}`;
    const captchaRes = await fetch(verifyUrl, { method: "POST" });
    const captchaVerify = await captchaRes.json() as { success: boolean; score?: number; action?: string; errors?: string[] };
    
    logger.debug({ captchaVerify, errors: captchaVerify.errors }, "reCAPTCHA response");
    
    if (!captchaVerify.success) {
      logger.warn({ errors: captchaVerify.errors }, "Captcha verification failed from Google");
      res.status(403).json({ error: "Captcha verification failed. Please try again." });
      return;
    }

    // Optional: Check score if using reCAPTCHA v3
    if (captchaVerify.score !== undefined && captchaVerify.score < 0.5) {
      res.status(403).json({ error: "Captcha score too low. Please try again." });
      return;
    }
  } catch (err) {
    logger.error({ err }, "Error verifying captcha");
    res.status(500).json({ error: "Error verifying captcha. Please try again." });
    return;
  }

  const [localPart, domainRaw] = email.split("@");
  const domain = domainRaw?.toLowerCase() ?? "";

  const disposable = isDisposableDomain(domain);
  const roleAccount = isRoleAccount(localPart ?? "");
  const isFree = isFreeEmail(domain);

  // Early-exit: skip SMTP entirely for known disposable domains
  let mxUsed: boolean;
  let smtpResult: Awaited<ReturnType<typeof verifySmtp>>;

  if (disposable) {
    mxUsed = false;
    smtpResult = {
      canConnect: false, mxAcceptsMail: false, isDeliverable: false,
      isCatchAll: false, hasInboxFull: false, isDisabled: false, mxRecords: [],
    };
  } else {
    // MX + SMTP run in parallel; result cached per domain for 5 min
    const checked = await cachedSmtpCheck(domain, email);
    mxUsed = checked.mxValid;
    smtpResult = checked.smtpResult;
  }

  const reputationScore = computeReputationScore({
    isDisposable: disposable,
    hasMx: mxUsed,
    hasInbox: smtpResult.isDeliverable,
    isAdmin: roleAccount,
    isFree,
    isDeliverable: smtpResult.isDeliverable,
    isCatchAll: smtpResult.isCatchAll,
    canConnect: smtpResult.canConnect,
    domain,
  });
  const riskLevel = computeRiskLevel(reputationScore);
  const tags = buildTags({
    isDisposable: disposable,
    roleAccount,
    freeProvider: isFree,
  });

  // Increment both trackers together
  cookieSession.count += 1;
  ipSession.count += 1;

  const newUsed = Math.max(cookieSession.count, ipSession.count);
  const newRemaining = Math.max(0, limit - newUsed);

  res.json({
    email,
    domain,
    isDisposable: disposable,
    reputationScore,
    riskLevel,
    tags,
    isValidSyntax: true,
    isFreeEmail: isFree,
    isRoleAccount: roleAccount,
    mxValid: mxUsed,
    inboxSupport: smtpResult.isDeliverable,
    canConnectSmtp: smtpResult.canConnect,
    mxAcceptsMail: smtpResult.mxAcceptsMail,
    mxRecords: smtpResult.mxRecords,
    isDeliverable: smtpResult.isDeliverable,
    isCatchAll: smtpResult.isCatchAll,
    isDisabled: smtpResult.isDisabled,
    hasInboxFull: smtpResult.hasInboxFull,
    used: newUsed,
    limit,
    remaining: newRemaining,
    limitReached: newRemaining === 0,
  });
});

export default router;
