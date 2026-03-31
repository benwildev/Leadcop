import React, { useState, useCallback, useEffect } from "react";
import { Shield, ShieldCheck, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isValidEmail, extractDomain, KNOWN_DISPOSABLE_DOMAINS } from "@/utils/email-validation";

interface Props {
  email: string;
  onEmailChange: (v: string) => void;
  apiUrl?: string;
}

export default function EmailCheckForm({ email, onEmailChange, apiUrl = "/api/check-email" }: Props) {
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    isDisposable: boolean;
    domain: string;
  } | null>(null);

  const runCheck = useCallback(async (emailValue: string) => {
    if (!isValidEmail(emailValue)) {
      setResult(null);
      return;
    }
    const domain = extractDomain(emailValue);
    if (KNOWN_DISPOSABLE_DOMAINS.has(domain)) {
      setResult({ isDisposable: true, domain });
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
        credentials: "omit",
      });
      const data = await res.json();
      if (typeof data.isDisposable === "boolean") {
        setResult({ isDisposable: data.isDisposable, domain });
      } else {
        setResult({ isDisposable: false, domain });
      }
    } catch {
      setResult({ isDisposable: false, domain });
    } finally {
      setChecking(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    setResult(null);
    setChecking(false);
    if (isValidEmail(email)) {
      runCheck(email);
    }
  }, [email, runCheck]);

  const showError = result?.isDisposable === true;
  const showSuccess = result?.isDisposable === false && isValidEmail(email);

  return (
    <div className="glass-card rounded-2xl p-8 w-full max-w-sm shadow-lg">
      <div className="mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-heading text-base font-semibold text-foreground">
          Create Account
        </h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                showError
                  ? "border-red-400 bg-red-500/5 focus:ring-red-400/30"
                  : showSuccess
                    ? "border-green-400 bg-green-500/5 focus:ring-green-400/30"
                    : "border-border bg-background focus:ring-primary/50"
              }`}
              placeholder="you@company.com"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" data-testid="checking-spinner" />
              )}
              {!checking && showSuccess && (
                <ShieldCheck className="h-4 w-4 text-green-500" data-testid="success-icon" />
              )}
              {!checking && showError && (
                <ShieldAlert className="h-4 w-4 text-red-500" data-testid="error-icon" />
              )}
            </div>
          </div>
          <AnimatePresence>
            {showError && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1.5 text-xs text-red-500 font-medium"
                role="alert"
              >
                Temporary email addresses are not allowed.
              </motion.p>
            )}
            {showSuccess && (
              <motion.p
                key="ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1.5 text-xs text-green-500 font-medium flex items-center gap-1"
                role="status"
              >
                <CheckCircle2 className="h-3 w-3" /> Valid email address
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button
          disabled={showError || !isValidEmail(email)}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sign Up
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Protected by TempShield
      </p>
    </div>
  );
}
