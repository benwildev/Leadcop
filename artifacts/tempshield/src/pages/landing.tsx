import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Navbar, Footer } from "@/components/Layout";
import {
  Shield,
  Zap,
  Lock,
  Code2,
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  Download,
  Puzzle,
  ListChecks,
  Activity,
  Bell,
  Database,
  Users,
  UserX,
  DollarSign,
  Inbox,
  TrendingUp,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmailCheckForm from "@/components/EmailCheckForm";
import PremiumBentoGrid from "@/components/landing/PremiumBentoGrid";

const container: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0 } },
};

const item: any = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

const STATS = [
  { value: "100K+", label: "Fake Emails Blocked" },
  { value: "99.9%", label: "Detection Accuracy" },
  { value: "500+", label: "Businesses Protected" },
  { value: "2 min", label: "Avg. Setup Time" },
];

const PAIN_POINTS_COMPACT = [
  { icon: UserX, title: "Block Fake Signups" },
  { icon: DollarSign, title: "Save Ad Spend" },
  { icon: Inbox, title: "Clean CRM Leads" },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Block Every Fake Signup",
    desc: "Instantly identify and reject disposable email addresses before they ever reach your list, CRM, or database.",
  },
  {
    icon: Zap,
    title: "Zero Friction for Real Customers",
    desc: "Validation happens in real time as users type. Legitimate signups sail through; only fake ones are stopped.",
  },
  {
    icon: TrendingUp,
    title: "Cleaner Lists, Better ROI",
    desc: "Higher deliverability, lower bounce rates, and more revenue from every campaign — because every address is real.",
  },
  {
    icon: Lock,
    title: "Set It and Forget It",
    desc: "One script tag or WordPress plugin install protects every form on your site automatically. No ongoing maintenance.",
  },
  {
    icon: BarChart3,
    title: "See What's Being Blocked",
    desc: "A real-time dashboard shows every blocked attempt, which form triggered it, and how many fake signups you've stopped.",
  },
  {
    icon: Globe,
    title: "Works on Any Website or Platform",
    desc: "WordPress, Webflow, Shopify, custom HTML — one API key protects every form across all your properties.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Star,
    title: "Create Your Free Account",
    desc: "Sign up in seconds — no credit card required. Your API key is ready immediately.",
  },
  {
    step: "02",
    icon: Code2,
    title: "Add to Your Forms",
    desc: "Drop one script tag onto any website, or install the WordPress plugin. Protection is active in under two minutes.",
  },
  {
    step: "03",
    icon: Shield,
    title: "Fake Emails Blocked — Automatically",
    desc: "LeadCop silently detects and rejects disposable addresses on every submission. Your list stays clean while real customers get through.",
  },
];

const SCRIPT_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/temp-email-validator.js`
    : "https://yourdomain.com/temp-email-validator.js";

const API_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/check-email/demo`
    : "https://yourdomain.com/api/check-email/demo";

const CODE_TABS = [
  {
    id: "html",
    label: "HTML Script",
    icon: "🌐",
    code: `<!-- Add this just before the closing </body> tag -->
<script
  src="${SCRIPT_URL}"
  data-api-key="YOUR_API_KEY">
</script>

<!-- That's it! LeadCop auto-attaches to every
     email field on the page and validates in real time. -->`,
  },
  {
    id: "config",
    label: "Config Options",
    icon: "⚙️",
    code: `<!-- Customize the behavior with data attributes -->
<script
  src="${SCRIPT_URL}"
  data-api-key="YOUR_API_KEY"
  data-error-message="Please use a real email address."
  data-error-color="#ef4444"
  data-debounce="600">
</script>

<!-- All options:
  data-api-key      — Your API key (required for >demo use)
  data-api-url      — Override the API base URL
  data-error-message — Custom error text shown to the user
  data-error-color  — Error text color (any CSS color)
  data-error-border — Error border color
  data-debounce     — Debounce delay in ms (default: 600)
-->`,
  },
  {
    id: "wordpress",
    label: "WordPress Plugin",
    icon: "🔷",
    code: `<!-- One-Click Protection -->
1. Download LeadCop Plugin (.zip)
2. Upload to your WP Dashboard
3. Paste API Key: YOUR_API_KEY

<!-- Automated Integrations: -->
- WooCommerce, CF7, WPForms
- Gravity Forms, Elementor
- WP Registration & Comments`,
  },
  {
    id: "api",
    label: "Direct API",
    icon: "⚡",
    code: `// Server-side check — works in any language
const res = await fetch("${API_URL}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: "test@mailinator.com" }),
});

const data = await res.json();
// {
//   "isDisposable": true,
//   "domain": "mailinator.com",
//   "requestsRemaining": 998
// }

if (data.isDisposable) {
  // Reject the form submission
}`,
  },
];

const PLAN_STATIC: Record<
  string,
  {
    name: string;
    period: string;
    desc: string;
    staticFeatures: string[];
    cta: string;
    href: string;
    highlighted: boolean;
  }
> = {
  FREE: {
    name: "Free",
    period: "forever",
    desc: "Start protecting your forms today, no card needed",
    staticFeatures: [
      "Disposable email detection",
      "Standard response time",
      "Community support",
    ],
    cta: "Start for Free",
    href: "/signup",
    highlighted: false,
  },
  BASIC: {
    name: "Basic",
    period: "/month",
    desc: "Stop fake signups as your business grows",
    staticFeatures: [
      "Priority response time",
      "Usage analytics dashboard",
      "Email support",
      "Monthly reset",
    ],
    cta: "Get Started",
    href: "/upgrade",
    highlighted: false,
  },
  PRO: {
    name: "Pro",
    period: "/month",
    desc: "Enterprise-grade protection for high-volume forms",
    staticFeatures: [
      "Fastest response time",
      "Advanced analytics",
      "Priority support",
      "Monthly reset",
      "Custom integrations",
    ],
    cta: "Get Started",
    href: "/upgrade",
    highlighted: true,
  },
  ADVANCED: {
    name: "Advanced",
    period: "/month",
    desc: "Comprehensive protection for growing businesses",
    staticFeatures: [
      "Inlcudes everything in Pro",
      "Fastest response time",
      "Advanced analytics",
      "Priority support",
      "Monthly reset",
    ],
    cta: "Get Started",
    href: "/upgrade",
    highlighted: false,
  },
  MAX: {
    name: "Max",
    period: "/month",
    desc: "The ultimate protection suite for power users",
    staticFeatures: [
      "Includes everything in Advanced",
      "Fastest response time",
      "Dedicated account manager",
      "Custom integrations",
      "Unlimited history",
    ],
    cta: "Get Started",
    href: "/upgrade",
    highlighted: false,
  },
};

interface LandingPlanData {
  plan: string;
  price: number;
  requestLimit: number;
  websiteLimit: number;
  mxDetectionEnabled: boolean;
  inboxCheckEnabled: boolean;
}

function buildLandingFeatures(
  planKey: string,
  data: LandingPlanData,
): string[] {
  const features: string[] = [];
  const isFree = data.price === 0;
  if (data.requestLimit > 0) {
    features.push(
      isFree
        ? `${data.requestLimit.toLocaleString()} checks included`
        : `${data.requestLimit.toLocaleString()} checks/month`,
    );
  }
  if (!isFree && data.websiteLimit > 0) {
    features.push(
      `${data.websiteLimit} website${data.websiteLimit > 1 ? "s" : ""}`,
    );
  }
  if (data.mxDetectionEnabled) features.push("MX record verification");
  if (data.inboxCheckEnabled) features.push("Inbox detection");
  return [...features, ...(PLAN_STATIC[planKey]?.staticFeatures ?? [])];
}

// ── WordPress plugin section data ─────────────────────────────────────────────

const WP_FEATURES = [
  {
    icon: Puzzle,
    title: "10 Form Integrations",
    desc: "WooCommerce, CF7, WPForms, Gravity Forms, Elementor, Ninja Forms, Fluent Forms, and WordPress core forms — all covered out of the box.",
  },
  {
    icon: Database,
    title: "24-Hour Result Cache",
    desc: "API results are cached in WordPress transients for 24 hours. Repeat submissions are instant and don't consume your quota.",
  },
  {
    icon: ListChecks,
    title: "Allow / Block Lists",
    desc: "Manually allowlist your company domain or blocklist known bad actors — overrides the API for full local control.",
  },
  {
    icon: Activity,
    title: "Activity Log",
    desc: "Every email check is recorded with outcome, reason, and form name. The last 1,000 entries are kept and searchable.",
  },
  {
    icon: Bell,
    title: "Admin Notifications",
    desc: "Get an email alert the moment a form submission is blocked — so nothing slips through unnoticed.",
  },
  {
    icon: Code2,
    title: "WP REST API Endpoint",
    desc: "Use /wp-json/leadcop/v1/check from themes, page builders, or headless WordPress. Auth via your API key.",
  },
];

const WP_INTEGRATIONS = [
  { name: "WooCommerce", color: "#7f54b3" },
  { name: "Contact Form 7", color: "#e44b2b" },
  { name: "WPForms", color: "#e27730" },
  { name: "Gravity Forms", color: "#f7941d" },
  { name: "Elementor Pro", color: "#92003b" },
  { name: "Ninja Forms", color: "#dd3333" },
  { name: "Fluent Forms", color: "#1b6ef3" },
  { name: "WP Registration", color: "#2271b1" },
  { name: "WP Comments", color: "#3858e9" },
];

const WP_STEPS = [
  {
    step: "01",
    title: "Download & Upload",
    desc: "Download the plugin zip and upload it via Plugins → Add New → Upload Plugin in your WordPress admin.",
  },
  {
    step: "02",
    title: "Activate",
    desc: "Click Activate. LeadCop will appear in your admin sidebar. The log table is created automatically on first run.",
  },
  {
    step: "03",
    title: "Enter Your API Key",
    desc: "Go to LeadCop → General, paste your API key, and save. All 10 integrations are enabled and protecting forms immediately.",
  },
];

// WordPress logo SVG
function WpLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM3.952 12c0-1.244.265-2.428.736-3.5L8.47 20.18C5.8 18.74 3.952 15.577 3.952 12zm8.048 8.048c-.84 0-1.65-.12-2.41-.34l2.56-7.44 2.62 7.18c.017.043.038.083.06.12a8.1 8.1 0 01-2.83.48zm1.17-12.316l2.312 6.875-6.43-1.96.65-1.95 1.21.18c.56 0 1.02-.46 1.02-1.02 0-.56-.46-1.02-1.02-1.02l-1.63.04.1-.19 2.13-5.99c.3-.04.6-.06.91-.06.64 0 1.27.09 1.87.23-.01.01-.01.02-.01.03l-.94 1.88zm2.76 7.596l2.24-6.5 1.02 3.42c.19.64.37 1.38.37 1.84 0 .73-.1 1.4-.28 2.04a8.07 8.07 0 01-1.47.85c-.57-.22-1.05-.42-1.87-.65zm2.71-11.6c.28.55.46 1.19.46 1.93 0 .65-.12 1.3-.46 2.12l-1.3 3.74-2.33-6.78 1.28-3.8c.46.28.86.57 1.13 1.03-.01.18-.01.36-.01.55 0 .56.46.96 1.01.96.2 0 .38-.06.34 0l.1 2.24z" />
    </svg>
  );
}

const LOG_ENTRIES = [
  { email: "user@mailinator.com", outcome: "blocked" as const, reason: "disposable", form: "woo checkout", time: "14:23" },
  { email: "john@gmail.com", outcome: "warned" as const, reason: "free email", form: "contact form 7", time: "14:22" },
  { email: "alice@company.io", outcome: "allowed" as const, reason: "", form: "wp register", time: "14:20" },
  { email: "spam@tempmail.org", outcome: "blocked" as const, reason: "disposable", form: "wpforms", time: "14:18" },
];

const OUTCOME_COLORS = {
  blocked: { text: "#dc2626", bg: "#fef2f2", label: "blocked" },
  warned: { text: "#d97706", bg: "#fffbeb", label: "warned" },
  allowed: { text: "#16a34a", bg: "#f0fdf4", label: "allowed" },
};

const MOCK_TOGGLES = [
  { label: "WooCommerce Checkout", on: true },
  { label: "Contact Form 7", on: true },
  { label: "WPForms", on: true },
  { label: "Gravity Forms", on: false },
  { label: "Elementor Pro Forms", on: true },
  { label: "Ninja Forms", on: true },
];

function AdminPanelMockup() {
  const [activeTab, setActiveTab] = useState("integrations");
  const [visibleLog, setVisibleLog] = useState<number>(0);
  const [toggleStates, setToggleStates] = useState<boolean[]>(MOCK_TOGGLES.map((t) => t.on));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const order = ["integrations", "log", "general"];
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % order.length;
      setActiveTab(order[i]);
    }, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (activeTab !== "log") { setVisibleLog(0); return; }
    setVisibleLog(0);
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      setVisibleLog(n);
      if (n >= LOG_ENTRIES.length) clearInterval(t);
    }, 350);
    return () => clearInterval(t);
  }, [activeTab]);

  const tabs = ["general", "integrations", "log"];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 mx-3 rounded-md bg-background/60 px-3 py-1 text-[10px] text-muted-foreground font-mono truncate">
          /wp-admin/admin.php?page=leadcop&tab={activeTab}
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">LeadCop Email Validator</span>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          v1.1.0
        </span>
      </div>

      <div className="flex border-b border-border/40 bg-muted/10 px-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            }}
            className={`px-4 py-2.5 text-[11px] font-medium capitalize border-b-2 -mb-px transition-all ${activeTab === tab
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab === "log" ? "Activity Log" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="min-h-[240px] p-4">
        <AnimatePresence mode="wait">
          {activeTab === "integrations" && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <p className="text-[10px] text-muted-foreground mb-3">
                Choose which form plugins LeadCop validates:
              </p>
              {MOCK_TOGGLES.map((toggle, i) => (
                <motion.div
                  key={toggle.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                >
                  <span className="text-[11px] text-foreground">{toggle.label}</span>
                  <button
                    onClick={() => setToggleStates((s) => s.map((v, idx) => idx === i ? !v : v))}
                    className={`relative h-4 w-7 rounded-full transition-colors duration-300 ${toggleStates[i] ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-300 ${toggleStates[i] ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                    />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "log" && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <p className="text-[10px] text-muted-foreground mb-3">
                Recent email checks — last 1,000 entries kept
              </p>
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-muted/40 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <span>Email</span>
                  <span>Outcome</span>
                  <span>Form</span>
                  <span>Time</span>
                </div>
                {LOG_ENTRIES.slice(0, visibleLog).map((entry, i) => {
                  const c = OUTCOME_COLORS[entry.outcome];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-4 gap-2 px-3 py-1.5 text-[10px] border-t border-border/30"
                    >
                      <span className="font-mono truncate text-foreground/80">{entry.email}</span>
                      <span className="font-semibold" style={{ color: c.text }}>{c.label}</span>
                      <span className="text-muted-foreground">{entry.form}</span>
                      <span className="text-muted-foreground">{entry.time}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "general" && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  API Key
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <span className="font-mono text-[11px] text-foreground/60 flex-1">lk_••••••••••••••••••••••</span>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Disposable Emails
                </label>
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <span className="text-[11px] text-foreground">Block disposable / burner emails</span>
                  <div className="relative h-4 w-7 rounded-full bg-primary">
                    <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-white shadow" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] text-muted-foreground">Activity log: </span>
                <span className="text-[11px] font-semibold text-foreground">347 checks today</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function DarkCodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-secondary">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <CopyButton code={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-green-600 dark:text-green-400">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function LiveDemo({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (v: string) => void;
}) {
  const apiUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/check-email/demo`
      : "https://yourdomain.com/api/check-email/demo";
  return <EmailCheckForm email={email} onEmailChange={onEmailChange} apiUrl={apiUrl} />;
}

function formatPlanPrice(planKey: string, price: number): string {
  if (price === 0) return "$0";
  return `$${price % 1 === 0 ? price : price.toFixed(2)}`;
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      setStatus("success");
      setMessage(data.message || "Thanks for subscribing!");
      setEmail("");
      setName("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {status === "success" ? (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="First name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {status === "loading" ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Join the Intel &rarr;</>
            )}
          </button>
          {status === "error" && (
            <p className="text-[10px] text-red-500 text-center font-medium">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("html");
  const [demoEmail, setDemoEmail] = useState("");
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({
    FREE: 0,
    BASIC: 9,
    PRO: 29,
  });
  const [fullPlanData, setFullPlanData] = useState<
    Record<string, LandingPlanData>
  >({
    FREE: {
      plan: "FREE",
      price: 0,
      requestLimit: 10,
      websiteLimit: 0,
      mxDetectionEnabled: false,
      inboxCheckEnabled: false,
    },
    BASIC: {
      plan: "BASIC",
      price: 9,
      requestLimit: 1000,
      websiteLimit: 0,
      mxDetectionEnabled: false,
      inboxCheckEnabled: false,
    },
    PRO: {
      plan: "PRO",
      price: 29,
      requestLimit: 10000,
      websiteLimit: 0,
      mxDetectionEnabled: false,
      inboxCheckEnabled: false,
    },
  });
  const currentTab = CODE_TABS.find((t) => t.id === activeTab)!;

  useEffect(() => {
    fetch("/api/settings/plans")
      .then((r) => r.json())
      .then((data: { plans: LandingPlanData[] }) => {
        const map: Record<string, number> = {};
        for (const { plan, price } of data.plans) map[plan] = price;
        setPlanPrices(map);
        const full: Record<string, LandingPlanData> = {};
        for (const p of data.plans) full[p.plan] = p;
        setFullPlanData(full);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center pt-24 sm:pt-32 pb-16 sm:pb-20 bg-white">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-16 lg:grid-cols-2 items-center"
          >
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                variants={item}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5"
              >
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">
                  Trusted by 500+ businesses globally
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={item}
                className="font-heading text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
              >
                Stop Fake Signups.{" "}
                <span className="block text-primary/80">Protect Your Revenue.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={item}
                className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg text-slate-500 font-medium leading-relaxed"
              >
                LeadCop identifies and blocks burner emails instantly, saving your ad spend and keeping your CRM clean.
                One line of code protects your business forever.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={item}
                className="mt-10 flex flex-col items-center lg:items-start gap-4 sm:flex-row"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-8 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  View Pricing
                </Link>
              </motion.div>
            </div>

            {/* Right: Live Demo Card */}
            <motion.div
              variants={item}
              className="relative w-full max-w-lg mx-auto lg:mx-0"
            >

              <LiveDemo email={demoEmail} onEmailChange={setDemoEmail} />
            </motion.div>
          </motion.div>

          {/* Bottom Row: Social Proof / Stats */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-20 pt-10 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-10"
          >
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 sm:gap-12">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {PAIN_POINTS_COMPACT.map((p) => (
                <div key={p.title} className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 text-xs font-bold text-slate-500">
                  <p.icon className="h-3.5 w-3.5 text-slate-900/40" />
                  {p.title}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      {/* ── FEATURES (BENTO GRID) ─────────────────────────── */}
      <section id="features" className="relative py-20 sm:py-32 px-4 sm:px-6 bg-slate-50/40">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Detection Engine
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
              Precision Disposable Detection
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              LeadCop’s multi-layered logic identifies burner emails, relay domains,
              and role accounts in milliseconds — before they can affect your revenue.
            </p>
          </motion.div>

          <PremiumBentoGrid />
        </div>
      </section>


      {/* ── UNIFIED SETUP HUB ──────────────────────────────── */}
      <section id="integration" className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.04] to-transparent" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-5 items-start">

            {/* Left: How it Works (Steps) */}
            <div className="lg:col-span-2">
              <div className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                  Instant Protection
                </p>
                <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
                  Zero Setup. <br />Infinite Peace.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  No complex SDKs. No framework lock-in. Protective blocking active in your production environment in under 120 seconds.
                </p>
              </div>

              <div className="space-y-8">
                {HOW_IT_WORKS.map((step, i) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-5"
                  >
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-heading text-xs font-bold text-primary">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Integration Switcher */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-100 bg-white"
              >
                {/* Tab bar */}
                <div className="flex overflow-x-auto border-b border-slate-200/50 bg-slate-50/50 p-2 gap-2">
                  {CODE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === tab.id
                        ? "text-primary bg-white shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                        }`}
                    >
                      <span>{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === "wordpress" ? (
                        <div className="grid gap-8 sm:grid-cols-2">
                          <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#2271b1]/10 px-3 py-1 text-[10px] font-bold text-[#2271b1]">
                              <WpLogoIcon className="h-3 w-3" /> NO-CODE PLUGIN
                            </div>
                            <h4 className="font-heading text-xl font-bold text-slate-900 mb-3">WordPress One-Click</h4>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                              Install LeadCop on your WordPress site to instantly protect WooCommerce, Contact Form 7, and WPForms.
                            </p>
                            <a
                              href="/downloads/leadcop-email-validator.zip?v=1.1"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2271b1] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#1d5e9a] hover:-translate-y-0.5"
                            >
                              <Download className="h-4 w-4" />
                              Download Plugin
                            </a>
                            <p className="mt-4 text-center text-[10px] text-slate-400">Works with all major page builders & form plugins</p>
                          </div>
                          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-inner p-1">
                            <AdminPanelMockup />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <DarkCodeBlock code={currentTab.code} label={currentTab.label} />
                          <div className="mt-6 flex items-center justify-between px-2">
                            <p className="text-xs text-slate-500 font-medium italic">Supports all modern environments.</p>
                            <Link href="/signup" className="text-xs font-bold text-primary hover:underline">Get API Key &rarr;</Link>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Pricing
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl">
              Transparent scaling
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground font-medium">
              Start protecting your revenue for free. Upgrade as you scale.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-6">
            {Object.values(fullPlanData)
              .sort((a, b) => a.price - b.price)
              .map((data, i) => {
                const planKey = data.plan;
                const meta = PLAN_STATIC[planKey] || {
                  name: planKey.charAt(0) + planKey.slice(1).toLowerCase(),
                  period: data.price === 0 ? "forever" : "/month",
                  desc: "Advanced protection",
                  staticFeatures: ["Priority support"],
                  cta: data.price === 0 ? "Start for Free" : "Get Started",
                  href: data.price === 0 ? "/signup" : "/upgrade",
                  highlighted: false,
                };
                const plan = { planKey, ...meta };
                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative flex flex-col rounded-[32px] p-8 border transition-all duration-300 hover:-translate-y-1 w-full md:w-[calc(33.33%-1.5rem)] max-w-sm ${plan.highlighted ? "border-slate-900 bg-white ring-8 ring-slate-50" : "border-slate-100 bg-white"
                      }`}
                  >
                    <div className="mb-6">
                      <h3 className="font-heading text-xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="font-heading text-4xl font-bold text-foreground">
                          {formatPlanPrice(plan.planKey, planPrices[plan.planKey] ?? 0)}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                    </div>
                    <ul className="mb-10 flex-1 space-y-4">
                      {buildLandingFeatures(plan.planKey, fullPlanData[plan.planKey] ?? {
                        plan: plan.planKey,
                        price: 0,
                        requestLimit: 0,
                        websiteLimit: 0,
                        mxDetectionEnabled: false,
                        inboxCheckEnabled: false,
                      }).map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className={`inline-flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold transition-all shadow-lg ${plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-slate-200/50"
                        }`}
                    >
                      {plan.cta}
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA + NEWSLETTER ─────────────────────── */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6">
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-[40px] p-8 sm:p-16 border border-slate-100 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left bg-slate-50">
            <div className="flex-1">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-tight">Active Protection</span>
              </div>
              <h2 className="font-heading text-3xl font-bold text-foreground sm:text-5xl leading-tight">
                Your next signup could be fake. <br />
                <span className="text-primary">Stop it now.</span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground font-medium">
                Join 500+ businesses protecting their lists from burner emails.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5 shadow-xl shadow-primary/30"
                >
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-8 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-white hover:-translate-y-0.5"
                >
                  View Pricing
                </Link>
              </div>
              <p className="mt-8 text-xs text-muted-foreground">
                No credit card required &nbsp;·&nbsp; Free plan available &nbsp;·&nbsp; Cancel anytime
              </p>
            </div>

            <div className="w-full max-w-sm">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl">
                <p className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wider">Join LeadCop Intel</p>
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
