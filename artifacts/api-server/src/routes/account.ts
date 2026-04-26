import { Router } from "express";
import { db, usersTable, userApiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { maybeResetMonthlyUsage } from "./check-email.js";
import { getPlanConfig } from "../lib/auth.js";

const router = Router();

router.get("/account/status", async (req, res) => {
  let userId: number | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);

    const [user] = await db
      .select({ id: usersTable.id, requestCount: usersTable.requestCount, plan: usersTable.plan, usagePeriodStart: usersTable.usagePeriodStart })
      .from(usersTable)
      .where(eq(usersTable.apiKey, apiKey))
      .limit(1);

    if (user) {
      await maybeResetMonthlyUsage(user.id, user.usagePeriodStart, user.requestCount);
      userId = user.id;
    } else {
      const [namedKey] = await db
        .select({ userId: userApiKeysTable.userId })
        .from(userApiKeysTable)
        .where(eq(userApiKeysTable.key, apiKey))
        .limit(1);
      if (namedKey) userId = namedKey.userId;
    }
  } else if (req.userId) {
    userId = req.userId;
  }

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({
      plan: usersTable.plan,
      requestCount: usersTable.requestCount,
      requestLimit: usersTable.requestLimit,
      usagePeriodStart: usersTable.usagePeriodStart,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const planConfig = await getPlanConfig(user.plan);

  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  res.json({
    plan: user.plan,
    requestsUsed: user.requestCount,
    requestLimit: user.requestLimit,
    resetDate: resetDate.toISOString(),
    features: {
      mxDetection: true,
      inboxCheck: true,
      bulkVerification: planConfig.hasBulkValidation,
      bulkEmailLimit: planConfig.bulkEmailLimit,
      dataLimit: planConfig.dataLimit,
      dnsblCheck: planConfig.hasAdvancedAnalytics,
      webhooks: planConfig.hasWebhooks,
      customBlocklist: planConfig.hasCustomBlocklist,
      maxUsers: planConfig.maxUsers,
      maxApiKeys: planConfig.maxApiKeys,
    },
  });
});

export default router;
