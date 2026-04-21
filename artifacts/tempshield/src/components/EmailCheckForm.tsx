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
    didYouMean: string | null;
  } | null>(null);

  const runCheck = useCallback(async (emailValue: string) => {
    if (!isValidEmail(emailValue)) {
      setResult(null);
      return;
    }
    const domain = extractDomain(emailValue);
    if (KNOWN_DISPOSABLE_DOMAINS.has(domain)) {
      setResult({ isDisposable: true, domain, didYouMean: null });
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
      setResult({ 
        isDisposable: !!data.isDisposable, 
        domain,
        didYouMean: data.didYouMean || null 
      });
    } catch {
      setResult({ isDisposable: false, domain, didYouMean: null });
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
  const showSuggestion = result?.didYouMean !== null;
  const showSuccess = result?.isDisposable === false && !showSuggestion && isValidEmail(email);

  const applySuggestion = () => {
    if (!result?.didYouMean) return;
    const [local] = email.split("@");
    onEmailChange(`${local}@${result.didYouMean}`);
  };

  return (
    <div className={`p-8 w-full max-w-sm rounded-[32px] border transition-all duration-300 ${
      showError ? "border-red-100 bg-red-50/30" : 
      showSuggestion ? "border-amber-100 bg-amber-50/30" :
      "border-primary/10 bg-white shadow-sm shadow-slate-100/50"
    }`}>
      <div className="mb-6 flex items-center gap-2">
        <Shield className={`h-5 w-5 ${showError ? "text-red-500" : showSuggestion ? "text-amber-500" : "text-primary"}`} />
        <h3 className="font-heading text-base font-bold text-slate-800">
          Create Account
        </h3>
      </div>
      <div className="space-y-4">
        {/* 👤 RESTORED: Full Name Field */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all font-medium ${
                showError
                  ? "border-red-200 bg-white focus:ring-red-100"
                  : showSuggestion
                    ? "border-amber-200 bg-white focus:ring-amber-100"
                    : showSuccess
                      ? "border-emerald-200 bg-white focus:ring-emerald-100"
                      : "border-slate-100 bg-white focus:ring-primary/10"
              }`}
              placeholder="you@company.com"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {checking && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              )}
              {!checking && showSuccess && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              {!checking && (showError || showSuggestion) && (
                <ShieldAlert className={`h-4 w-4 ${showError ? "text-red-500" : "text-amber-500"}`} />
              )}
            </div>
          </div>
          <AnimatePresence>
             {/* 🧠 Logic: Suggestions take priority over "Disposable" errors for domains like gamil.com */}
            {showSuggestion ? (
              <motion.div
                key="suggestion"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 pl-1"
              >
                 <p className="text-[11px] text-amber-600 font-bold">
                    Did you mean <button onClick={applySuggestion} className="underline decoration-amber-300 underline-offset-2 hover:text-amber-700 transition-colors">{result?.didYouMean}</button>?
                 </p>
              </motion.div>
            ) : showError ? (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 text-[11px] text-red-500 font-bold pl-1"
                role="alert"
              >
                Temporary email addresses are not allowed.
              </motion.p>
            ) : showSuccess ? (
              <motion.p
                key="ok"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 text-[11px] text-emerald-500 font-bold flex items-center gap-1.5 pl-1"
                role="status"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Fast Detection: Valid entry
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        
        {/* 🎨 BRAND COLOR: Switched back to Primary Purple/Indigo */}
        <button
          disabled={showError || !isValidEmail(email)}
          className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest mt-2 shadow-lg shadow-primary/20"
        >
          Sign Up
        </button>
      </div>
      <p className="mt-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Protected by LeadCop
      </p>
    </div>
  );
}
