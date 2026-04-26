import React, { useState, useEffect } from "react";
import {
  Copy, Check, Terminal, Download, ChevronDown,
  Shield, Zap, Globe, Users, Lock, AlertCircle, CheckCircle2,
  ArrowRight, BookOpen, Code2, HelpCircle, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Logo } from "./Logo";

/* ─────────────────────────── helpers ─────────────────────────── */

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl" style={{ background: "#0f1117" }}>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "#1a1d27", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3" style={{ color: "#6b7280" }} />
            <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{lang}</span>
          </div>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-slate-400 transition-colors hover:text-slate-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed whitespace-pre" style={{ color: "#a5d6ff" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-violet-50 border border-violet-100 px-1.5 py-0.5 text-violet-700 text-xs font-mono">
      {children}
    </code>
  );
}

function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: { bg: "bg-blue-50 border-blue-200", icon: <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />, text: "text-blue-700" },
    warning: { bg: "bg-amber-50 border-amber-200", icon: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />, text: "text-amber-700" },
    tip: { bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />, text: "text-emerald-700" },
  }[type];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${styles.bg}`}>
      {styles.icon}
      <p className={`text-sm leading-relaxed ${styles.text}`}>{children}</p>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-violet-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-slate-800 hover:text-violet-600 transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-slate-500 leading-relaxed">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── data ────────────────────────────── */

const INTEGRATIONS = [
  {
    id: "html",
    label: "HTML / Any Website",
    icon: "🌐",
    audience: "Easiest — no coding required",
    steps: [
      { title: "Get your API key", desc: "Create a free account and copy your API key from the dashboard." },
      { title: "Paste one script tag", desc: "Add the snippet just before the </body> closing tag in your website's HTML." },
      { title: "You're done!", desc: "LeadCop silently attaches to every email field and validates as users type." },
    ],
    code: `<!-- Paste just before the closing </body> tag -->
<!-- Works on any website — WordPress, Webflow, Squarespace, Shopify, etc. -->
<script
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="YOUR_API_KEY">
</script>

<!-- Optional: full configuration with all customization options -->
<script
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="YOUR_API_KEY"
  data-debounce="600"
  data-error-message="Disposable email addresses are not allowed."
  data-error-color="#ef4444"
  data-error-border="#f87171"
  data-warn-mx-message="This email domain has no mail server."
  data-warn-mx-color="#f59e0b"
  data-warn-mx-border="#fbbf24"
  data-warn-free-message="Free email providers are not accepted here."
  data-warn-free-color="#f59e0b"
  data-warn-free-border="#fbbf24">
</script>`,
  },
  {
    id: "wordpress",
    label: "WordPress Plugin",
    icon: "🔌",
    audience: "No code — install & activate",
    steps: [
      { title: "Download the plugin", desc: "Download the LeadCop Email Validator plugin .zip from the link below." },
      { title: "Upload & activate", desc: "Go to Plugins → Add New → Upload Plugin, select the zip, click Install Now → Activate." },
      { title: "Paste your API key", desc: "Open LeadCop in your WP admin menu, paste your API key, and click Save. Done — all your forms are protected." },
    ],
    code: `; No code needed! After activating the plugin:
; WordPress Admin → LeadCop → General Settings → Paste API Key → Save

; Auto-protected form systems:
;   ✅ WordPress default registration & comment forms
;   ✅ WooCommerce checkout & My Account
;   ✅ Contact Form 7
;   ✅ WPForms
;   ✅ Gravity Forms

; Configurable validation rules:
;   Block disposable emails  → ON by default (recommended)
;   Free email providers     → Off | Warn | Block (your choice)
;   No MX records (invalid)  → Off | Warn | Block (your choice)

; All checks happen server-side — bots cannot bypass them.
; The plugin fails open: forms still work if the API is unreachable.`,
  },
  {
    id: "react",
    label: "React / Next.js",
    icon: "⚛️",
    audience: "For React developers",
    steps: [
      { title: "No package to install", desc: "Call the REST API directly — no npm package needed." },
      { title: "Copy the hook", desc: "Add the useEmailCheck hook to your project." },
      { title: "Wire it to any input", desc: "Pass the email state into the hook and show the validation result." },
    ],
    code: `import { useState, useEffect } from "react";

// 1. Add this hook anywhere in your project
function useEmailCheck(email: string) {
  const [result, setResult] = useState<{
    isDisposable: boolean | null;
    isLoading: boolean;
  }>({ isDisposable: null, isLoading: false });

  useEffect(() => {
    if (!email || !email.includes("@")) {
      setResult({ isDisposable: null, isLoading: false });
      return;
    }
    const timer = setTimeout(async () => {
      setResult(prev => ({ ...prev, isLoading: true }));
      try {
        const res = await fetch("https://leadcop.io/api/check-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_API_KEY",
          },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setResult({ isDisposable: data.isDisposable, isLoading: false });
      } catch {
        setResult({ isDisposable: null, isLoading: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  return result;
}

// 2. Use it in any form component
function SignupForm() {
  const [email, setEmail] = useState("");
  const { isDisposable, isLoading } = useEmailCheck(email);

  return (
    <form>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ borderColor: isDisposable ? "#ef4444" : undefined }}
        placeholder="your@email.com"
      />
      {isLoading && <p style={{ color: "#94a3b8" }}>Checking…</p>}
      {isDisposable && (
        <p style={{ color: "#ef4444" }}>
          Temporary email addresses are not allowed.
        </p>
      )}
      <button type="submit" disabled={!!isDisposable || isLoading}>
        Create Account
      </button>
    </form>
  );
}`,
  },
  {
    id: "node",
    label: "Node.js / Express",
    icon: "🟩",
    audience: "For backend JavaScript developers",
    steps: [
      { title: "Create the middleware", desc: "Write a reusable Express middleware function that calls the API." },
      { title: "Apply to your routes", desc: "Add it to any route that accepts an email in the request body." },
      { title: "Handle the rejection", desc: "The middleware returns a 400 response automatically for disposable emails." },
    ],
    code: `// middleware/checkEmail.js
const LEADCOP_KEY = process.env.LEADCOP_KEY;
const LEADCOP_URL = "https://leadcop.io";

async function noDisposableEmail(req, res, next) {
  const email = req.body?.email;
  if (!email) return next();   // skip if no email in body

  try {
    const response = await fetch(\`\${LEADCOP_URL}/api/check-email\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${LEADCOP_KEY}\`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.isDisposable) {
      return res.status(400).json({
        error: "Temporary email addresses are not allowed.",
        field: "email",
      });
    }
  } catch (err) {
    // Fail open — if the API is unreachable, let the request through
    console.error("LeadCop check failed:", err.message);
  }

  next();
}

// Attach to any Express route:
router.post("/signup", noDisposableEmail, async (req, res) => {
  const { email, password } = req.body;
  // If we reach here, the email is safe to store
  await createUser({ email, password });
  res.json({ success: true });
});`,
  },
  {
    id: "laravel",
    label: "Laravel / PHP",
    icon: "🐘",
    audience: "For PHP / Laravel developers",
    steps: [
      { title: "Add to .env", desc: "Store your key as LEADCOP_KEY in your .env file." },
      { title: "Create a Rule class", desc: "Copy the NoDisposableEmail rule into app/Rules/." },
      { title: "Apply to any form", desc: "Use the rule inside your FormRequest or controller validation." },
    ],
    code: `<?php
// Step 1: .env
// LEADCOP_KEY=your_api_key_here

// Step 2: app/Rules/NoDisposableEmail.php
namespace App\\Rules;

use Illuminate\\Contracts\\Validation\\Rule;
use Illuminate\\Support\\Facades\\Http;

class NoDisposableEmail implements Rule
{
    public function passes($attribute, $value): bool
    {
        try {
            $response = Http::timeout(3)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . env('LEADCOP_KEY'),
                ])
                ->post('https://leadcop.io/api/check-email', [
                    'email' => $value,
                ]);

            // fail open if API unreachable
            return $response->successful()
                ? !$response->json('isDisposable')
                : true;
        } catch (\\Exception $e) {
            return true; // fail open
        }
    }

    public function message(): string
    {
        return 'Temporary email addresses are not allowed.';
    }
}

// Step 3: Use in any FormRequest or controller
public function rules(): array
{
    return [
        'email' => ['required', 'email', new NoDisposableEmail],
    ];
}`,
  },
  {
    id: "python",
    label: "Python / Django",
    icon: "🐍",
    audience: "For Python developers",
    steps: [
      { title: "pip install requests", desc: "One dependency — or use httpx for async support." },
      { title: "Copy the helper function", desc: "Add is_disposable_email() to a utils.py file in your project." },
      { title: "Call it from your validator", desc: "Use it in a Django form, DRF serializer, or FastAPI validator." },
    ],
    code: `import requests
from functools import lru_cache

LEADCOP_KEY = "YOUR_API_KEY"
LEADCOP_URL = "https://leadcop.io/api/check-email"

@lru_cache(maxsize=512)
def is_disposable_email(email: str) -> bool:
    """Returns True if the email is from a disposable provider."""
    try:
        response = requests.post(
            LEADCOP_URL,
            json={"email": email},
            headers={
                "Authorization": f"Bearer {LEADCOP_KEY}",
                "Content-Type": "application/json",
            },
            timeout=3,
        )
        return response.json().get("isDisposable", False)
    except Exception:
        return False  # fail open


# ── Django Form example ───────────────────────────────
from django import forms

class SignupForm(forms.Form):
    email = forms.EmailField()

    def clean_email(self):
        email = self.cleaned_data["email"]
        if is_disposable_email(email):
            raise forms.ValidationError(
                "Temporary email addresses are not allowed."
            )
        return email


# ── Django REST Framework serializer example ─────────
from rest_framework import serializers

class UserSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if is_disposable_email(value):
            raise serializers.ValidationError(
                "Temporary email addresses are not allowed."
            )
        return value`,
  },
  {
    id: "curl",
    label: "cURL / REST",
    icon: "⚡",
    audience: "Test the API directly from your terminal",
    steps: [
      { title: "No setup required", desc: "Just send a POST request — works in any language or tool." },
      { title: "Read the response", desc: "Check the isDisposable boolean in the JSON response." },
      { title: "Act on the result", desc: "Reject form submission if isDisposable is true." },
    ],
    code: `# ── Basic request ────────────────────────────────────
curl -X POST https://leadcop.io/api/check-email \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@mailinator.com"}'

# ── Response: disposable email detected ──────────────
{
  "isDisposable": true,
  "domain": "mailinator.com",
  "requestsRemaining": 998
}

# ── Response: legitimate email ───────────────────────
{
  "isDisposable": false,
  "domain": "gmail.com",
  "requestsRemaining": 997
}

# ── Error: missing or invalid API key ────────────────
# HTTP 401
{ "error": "API key required. Pass Authorization: Bearer <key>" }

# ── Error: request limit reached ─────────────────────
# HTTP 429
{ "error": "Rate limit exceeded. Upgrade your plan to continue." }`,
  },
];

const SCRIPT_ATTRS = [
  { attr: "data-api-key", def: '""', req: true, desc: "Your account API key. Required for production use (not just demos)." },
  { attr: "data-debounce", def: "600", req: false, desc: "How many milliseconds to wait after the user stops typing before running a check. Lower = faster feedback, higher API usage." },
  { attr: "data-error-message", def: "Temporary email addresses…", req: false, desc: "❌ Error message shown when a disposable email is detected. Blocks form submission." },
  { attr: "data-error-color", def: "#ef4444", req: false, desc: "Text colour of the error message (any CSS colour value)." },
  { attr: "data-error-border", def: "#f87171", req: false, desc: "Input border colour when an error is shown." },
  { attr: "data-warn-mx-message", def: "This email domain has no mail server…", req: false, desc: "⚠️ Warning shown when the email domain has no MX records (can't receive mail). Warns but does NOT block." },
  { attr: "data-warn-mx-color", def: "#f59e0b", req: false, desc: "Text colour of the MX warning." },
  { attr: "data-warn-mx-border", def: "#fbbf24", req: false, desc: "Input border colour for the MX warning." },
  { attr: "data-warn-free-message", def: "Free email providers are not accepted…", req: false, desc: "⚠️ Warning shown for free providers (Gmail, Yahoo, Hotmail…). Warns but does NOT block." },
  { attr: "data-warn-free-color", def: "#f59e0b", req: false, desc: "Text colour of the free email warning." },
  { attr: "data-warn-free-border", def: "#fbbf24", req: false, desc: "Input border colour for the free email warning." },
];

const ERROR_CODES = [
  { code: "200", status: "OK", desc: "Request succeeded. Check the isDisposable field in the response.", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { code: "400", status: "Bad Request", desc: "The email field is missing or the value is not a valid email address format.", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { code: "401", status: "Unauthorized", desc: "No API key was provided, or the key is invalid. Include Authorization: Bearer YOUR_KEY in the request headers.", color: "text-red-600 bg-red-50 border-red-200" },
  { code: "422", status: "Unprocessable", desc: "The request body could not be parsed. Ensure you are sending valid JSON with Content-Type: application/json.", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { code: "429", status: "Too Many Requests", desc: "You have exceeded your plan's monthly request limit. Upgrade your plan or wait until the next reset.", color: "text-rose-600 bg-rose-50 border-rose-200" },
  { code: "5xx", status: "Server Error", desc: "A temporary server error occurred. Your integration should fail open (allow the request through) and retry later.", color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const FAQS = [
  {
    q: "What is a disposable or temporary email address?",
    a: "A disposable email (also called a throwaway, temp, or burner email) is a short-lived inbox created specifically to bypass registration forms — for example, mail from mailinator.com, guerrillamail.com, or yopmail.com. Real users never give these as their main email, so blocking them protects your list quality.",
  },
  {
    q: "Will blocking disposable emails hurt my conversion rate?",
    a: "No. Legitimate users — the customers you actually want — use real email addresses. The only people blocked are those who were never going to engage with your product in the first place. Most businesses see no change in genuine signups but a significant reduction in bounce rates and spam complaints.",
  },
  {
    q: "What happens if the LeadCop API goes down?",
    a: "All our code examples use a 'fail open' pattern — if the API is unreachable or returns an error, your form continues to work normally. We recommend this approach so your registration flow is never blocked by a third-party dependency.",
  },
  {
    q: "Does LeadCop work with my existing form tool?",
    a: "Yes. The HTML embed script attaches automatically to any <input type=\"email\"> on the page, regardless of what framework or form builder generated it. The WordPress plugin additionally supports Contact Form 7, WPForms, Gravity Forms, and WooCommerce.",
  },
  {
    q: "Do I need a developer to set this up?",
    a: "Not if you're using the HTML embed script or WordPress plugin. You just paste one line of code (or upload a zip file). No programming knowledge required. If you want to integrate the API directly into a backend, it's a simple POST request — most developers have it working in under 10 minutes.",
  },
  {
    q: "Is user data stored or logged?",
    a: "Email addresses submitted to the API are checked against our allow/deny list and are not permanently stored or sold. Only anonymised usage metrics (request counts per API key) are retained for billing purposes.",
  },
  {
    q: "Can I test the API before buying a paid plan?",
    a: "Yes. Our Free plan includes 10 checks so you can verify your integration works end-to-end at no cost. The /api/check-email/demo endpoint is also available without an API key for quick testing.",
  },
  {
    q: "What does the 'Free email warning' feature do?",
    a: "When enabled, the script will display a warning (but NOT block) if a user enters a Google, Yahoo, Hotmail or other free provider address. This is useful for B2B products that require a work email — you can warn the user without fully preventing them from signing up.",
  },
];

/* ─────────────────────────── page ────────────────────────────── */

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quick Start" },
  { id: "how-it-works", label: "How It Works" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoint", label: "API Endpoint" },
  { id: "integration-guides", label: "Integration Guides" },
  { id: "script-attributes", label: "Script Attributes" },
  { id: "error-codes", label: "Error Codes" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "faq", label: "FAQ" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition ${scrolled
          ? "border-slate-200 bg-[rgba(250,250,249,0.92)] backdrop-blur"
          : "border-transparent bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Logo size={34} />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          <Link href="/#product" className="transition hover:text-slate-900">
            Product
          </Link>
          <Link href="/#how" className="transition hover:text-slate-900">
            How it works
          </Link>
          <Link href="/#install" className="transition hover:text-slate-900">
            Installation
          </Link>
          <Link href="/pricing" className="transition hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/docs" className="font-semibold text-slate-900 transition">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-slate-500 transition hover:text-slate-900 md:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("html");
  const [activeNav, setActiveNav] = useState("overview");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/public/plans")
      .then(res => res.json())
      .then(data => {
        if (data.configs) {
          const order = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
          const sorted = data.configs.sort((a: any, b: any) => order.indexOf(a.plan) - order.indexOf(b.plan));
          setPlans(sorted);
        }
      })
      .catch(() => { });
  }, []);

  // Highlight nav item on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveNav(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const current = INTEGRATIONS.find((i) => i.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white">
      <Nav />
      {/* Background script for JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": "LeadCop API Documentation — Block Fake & Disposable Emails",
          "description": "Complete integration guide for the LeadCop disposable email detection API. Includes authentication, endpoint reference, code samples for HTML, React, Laravel, Python, Node.js, and cURL.",
          "url": "https://leadcop.io/docs",
          "author": { "@type": "Organization", "name": "LeadCop" }
        })}
      </script>

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 items-start">

          {/* ── Sticky sidebar nav ─────────────────────── */}
          <aside className="hidden lg:block sticky top-24 self-start">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-3">On this page</p>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveNav(item.id)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeNav === item.id
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-8 rounded-xl bg-violet-600 p-5 text-white shadow-xl shadow-violet-500/10">
              <Shield className="h-6 w-6 mb-3 text-violet-200" />
              <p className="text-sm font-semibold mb-1">Free plan available</p>
              <p className="text-xs text-violet-200 mb-4 leading-relaxed">Start protecting your forms — no credit card needed.</p>
              <Link
                href="/signup"
                className="block text-center rounded-lg bg-white text-violet-700 text-xs font-bold py-2 hover:bg-violet-50 transition-colors"
              >
                Get started free →
              </Link>
            </div>
          </aside>

          {/* ── Main content ───────────────────────────── */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 space-y-16"
          >

            {/* ── OVERVIEW ─────────────────────────────── */}
            <section id="overview" className="scroll-mt-24">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5">
                <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-semibold text-violet-700">Documentation</span>
              </div>
              <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4 leading-tight">
                LeadCop API Docs
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl leading-relaxed mb-6">
                LeadCop protects your registration forms and email lists from disposable,
                temporary, and fake email addresses. This guide covers everything from a
                simple no-code setup to full backend API integration.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Globe className="h-5 w-5 text-emerald-600" />,
                    bg: "bg-emerald-50 border-emerald-200",
                    title: "I'm not a developer",
                    desc: "Use the HTML script tag or WordPress plugin. No coding required.",
                    href: "#quickstart",
                    cta: "Quick Start →",
                    ctatext: "text-emerald-700",
                  },
                  {
                    icon: <Code2 className="h-5 w-5 text-violet-600" />,
                    bg: "bg-violet-50 border-violet-200",
                    title: "I'm a developer",
                    desc: "Jump to the API endpoint reference and integration code samples.",
                    href: "#authentication",
                    cta: "API Reference →",
                    ctatext: "text-violet-700",
                  },
                  {
                    icon: <HelpCircle className="h-5 w-5 text-blue-600" />,
                    bg: "bg-blue-50 border-blue-200",
                    title: "I have questions",
                    desc: "Read the FAQ for common questions about how LeadCop works.",
                    href: "#faq",
                    cta: "Read FAQ →",
                    ctatext: "text-blue-700",
                  },
                ].map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    className={`group rounded-xl border p-5 transition-all hover:shadow-sm hover:-translate-y-0.5 ${card.bg}`}
                  >
                    <div className="mb-3">{card.icon}</div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{card.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{card.desc}</p>
                    <span className={`text-xs font-bold ${card.ctatext}`}>{card.cta}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* ── QUICK START ────────────────── */}
            <section id="quickstart" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">Quick Start</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-2xl">
                The fastest way to protect your website — no programming needed. You just need to copy and paste one line of code.
              </p>

              <div className="glass-card rounded-2xl p-8 mb-4">
                <h3 className="font-heading text-base font-semibold text-slate-800 mb-6">3 steps to protect any website</h3>
                <ol className="space-y-6">
                  {[
                    {
                      icon: <Users className="h-5 w-5 text-violet-600" />,
                      title: "Create a free account",
                      desc: "Sign up at the link below — no credit card required. Your API key is generated automatically.",
                      extra: <Link href="/signup" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700"><ArrowRight className="h-3.5 w-3.5" /> Create free account</Link>,
                    },
                    {
                      icon: <Code2 className="h-5 w-5 text-violet-600" />,
                      title: "Copy the script tag",
                      desc: "Find where you can add code to your website's footer or body area, then paste this snippet:",
                      extra: (
                        <div className="mt-4">
                          <CodeBlock lang="HTML" code={`<script\n  src="https://leadcop.io/temp-email-validator.js"\n  data-api-key="YOUR_API_KEY">\n</script>`} />
                          <p className="mt-2 text-xs text-slate-400">Replace <InlineCode>YOUR_API_KEY</InlineCode> with the key from your dashboard.</p>
                        </div>
                      ),
                    },
                    {
                      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
                      title: "That's it — you're protected",
                      desc: "LeadCop automatically finds every email input field on your site. When someone types a disposable email, they'll see an error.",
                      extra: (
                        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                          <p className="text-xs text-emerald-700 font-medium">✅ Real-time validation as users type.</p>
                        </div>
                      ),
                    },
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 font-bold text-sm text-violet-700">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {step.icon}
                          <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                        {step.extra}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <Callout type="tip">
                Using WordPress? Skip the code entirely — install the <a href="#integration-guides" className="underline font-semibold">WordPress plugin</a> and your forms are protected in under 2 minutes.
              </Callout>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────── */}
            <section id="how-it-works" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-2xl">
                A simple explanation of the verification process.
              </p>

              <div className="glass-card rounded-2xl p-8 mb-6">
                <div className="space-y-0">
                  {[
                    { icon: "📝", title: "User starts typing", desc: "The LeadCop script watches every email input field on the page for changes." },
                    { icon: "⏱️", title: "Brief pause (debounce)", desc: "After 600ms of inactivity, LeadCop sends the email to our API for checking." },
                    { icon: "🔍", title: "API Validation", desc: "Checks against 100,000+ disposable domains and verifies MX records." },
                    { icon: "✅", title: "Result", desc: "Legitimate emails pass silently. Bad data is blocked instantly." },
                  ].map((step, i, arr) => (
                    <div key={i} className={`flex gap-4 ${i < arr.length - 1 ? "pb-6 border-b border-violet-50" : ""} ${i > 0 ? "pt-6" : ""}`}>
                      <div className="text-2xl shrink-0 w-8 text-center">{step.icon}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 mb-1">{step.title}</p>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── AUTHENTICATION ────────────────────────── */}
            <section id="authentication" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">Authentication</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-2xl">
                Format your secret API key in the <InlineCode>Authorization</InlineCode> header.
              </p>

              <div className="glass-card rounded-2xl p-8 space-y-5">
                <CodeBlock lang="HTTP Header" code={`Authorization: Bearer YOUR_API_KEY`} />
                <Callout type="warning">
                  Never expose your Secret Key in client-side JS. For the public validator script, use the key provided in your settings.
                </Callout>
              </div>
            </section>

            {/* ── API ENDPOINT ──────────────────────────── */}
            <section id="endpoint" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">API Endpoint</h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-violet-100 bg-violet-50/30">
                  <span className="rounded-lg bg-violet-600 px-3 py-1 font-mono text-xs font-bold text-white">POST</span>
                  <code className="font-mono text-sm font-semibold text-slate-800">https://leadcop.io/api/check-email</code>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Request body</p>
                    <CodeBlock lang="JSON" code={`{\n  "email": "test@mailinator.com"\n}`} />
                  </div>
                  <div className="space-y-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Response</p>
                    <CodeBlock lang="JSON" code={`{\n  "isDisposable": true,\n  "domain": "mailinator.com",\n  "requestsRemaining": 999\n}`} />
                  </div>
                </div>
              </div>
            </section>

            {/* ── INTEGRATION GUIDES ────────────────────── */}
            <section id="integration-guides" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Integration Guides</h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex overflow-x-auto border-b border-violet-100 bg-violet-50/40">
                  {INTEGRATIONS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === item.id
                          ? "border-violet-600 text-violet-700 bg-violet-100/60"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-violet-50"
                        }`}
                    >
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-8"
                  >
                    <div className="grid md:grid-cols-[1fr_2fr] gap-8 items-start">
                      <div>
                        <h3 className="font-heading text-base font-semibold text-slate-800 mb-4">{current.label}</h3>
                        <ol className="space-y-4">
                          {current.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-xs">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center">{i + 1}</span>
                              <div>
                                <p className="font-bold text-slate-700">{step.title}</p>
                                <p className="text-slate-400 mt-0.5">{step.desc}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <CodeBlock lang={current.label} code={current.code} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>

            {/* ── ERROR CODES ───────────────────────────── */}
            <section id="error-codes" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Error Codes</h2>
              <div className="glass-card rounded-2xl overflow-hidden divide-y divide-violet-50">
                {ERROR_CODES.map((e) => (
                  <div key={e.code} className="flex items-start gap-4 p-5 hover:bg-violet-50/20 transition-colors">
                    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold font-mono ${e.color}`}>
                      {e.code}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-0.5">{e.status}</p>
                      <p className="text-xs text-slate-500">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── RATE LIMITS ───────────────────────────── */}
            <section id="rate-limits" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">Rate Limits</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-2xl">
                To ensure high availability and prevent abuse, LeadCop enforces rate limits across all subscription tiers.
              </p>

              <div className="glass-card rounded-2xl overflow-hidden divide-y divide-violet-100">
                <div className="grid grid-cols-4 bg-violet-50/50 p-4 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-violet-100">
                  <div className="col-span-1 pl-2">Plan</div>
                  <div className="col-span-1">Monthly Credits</div>
                  <div className="col-span-1">Concurrency</div>
                  <div className="col-span-1">Rate Limit</div>
                </div>
                {plans.length > 0 ? (
                  plans.map((cfg) => (
                    <div key={cfg.plan} className="grid grid-cols-4 items-center p-5 hover:bg-violet-50/30 transition-colors group">
                      <div className="col-span-1 pl-2">
                        <p className="text-sm font-bold text-slate-800">{cfg.plan}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-sm font-semibold text-slate-700">{cfg.requestLimit.toLocaleString()}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-slate-500">{(cfg.plan === 'PRO' || cfg.plan === 'ENTERPRISE') ? 'Unlimited' : 'Single-thread'}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                          {cfg.rateLimitPerSecond || (cfg.plan === 'FREE' ? 1 : 10)} REQ/SEC
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed italic">
                * Rates are calculated per API key. Enterprise plans can request custom rate limits and higher concurrency thresholds.
              </p>
            </section>

            {/* ── FAQ ───────────────────────────────────── */}
            <section id="faq" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <div className="glass-card rounded-2xl p-2 px-6">
                {FAQS.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>

            {/* ── CTA ───────────────────────────────────── */}
            <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-10 text-center text-white shadow-2xl shadow-violet-500/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
              <Shield className="h-10 w-10 text-violet-200 mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold mb-3">Ready to stop fake signups?</h2>
              <p className="text-violet-100 text-sm mb-6 max-w-sm mx-auto">
                Set up takes under 2 minutes. Start for free today and clean your lead data instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup" className="rounded-xl bg-white text-violet-700 px-6 py-3 text-sm font-bold hover:shadow-lg transition-all">
                  Start for free <ArrowRight className="h-4 w-4 inline-block ml-1" />
                </Link>
              </div>
            </section>

          </motion.main>
        </div>
      </div>
    </div>
  );
}
