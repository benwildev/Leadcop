import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Globe,
  Mail,
  Download,
  MoveRight,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { PricingSection } from "../components/sections/PricingSection";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";

type ValStatus =
  | "idle"
  | "typing"
  | "checking"
  | "blocked"
  | "role"
  | "typo"
  | "invalid"
  | "valid"
  | "tld-error"
  | "free";

type ValResult = {
  status: ValStatus;
  message?: string;
  suggestion?: string;
  reason?: string;
};

async function checkEmailApi(email: string): Promise<ValResult> {
  const trimmed = email.trim();

  if (!trimmed) return { status: "idle" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return {
      status: "invalid",
      message: "This does not look like a valid email address.",
    };
  }

  try {
    const response = await fetch("/api/check-email/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        status: "invalid",
        message: error.error || "Invalid email address.",
      };
    }

    const data = await response.json();

    if (data.didYouMean) {
      const [localPart] = trimmed.split("@");
      const fullSuggestion = `${localPart}@${data.didYouMean}`;
      return {
        status: "typo",
        message: `Did you mean ${fullSuggestion}?`,
        suggestion: fullSuggestion,
      };
    }

    if (data.isInvalidTld) {
      return {
        status: "tld-error",
        message: "Invalid domain extension.",
        reason: "Unsupported TLD",
      };
    }

    if (data.isForwarding) {
      return {
        status: "role",
        message: "Relay emails are not ideal for signups.",
        reason: "Forwarding or relay detected",
      };
    }

    if (data.isDisposable || data.disposable) {
      return {
        status: "blocked",
        message: "Temporary email addresses are blocked. Please try again.",
        reason: "Disposable provider detected",
      };
    }

    if (data.isRoleAccount || data.roleAccount) {
      return {
        status: "role",
        message: "Role-based inboxes often convert poorly.",
        reason: "Role account detected",
      };
    }

    if (data.isGibberish) {
      return {
        status: "tld-error",
        message: "This email pattern looks suspicious.",
        reason: "Pattern check failed",
      };
    }

    if (data.isFree) {
      return {
        status: "free",
        message: "Personal email detected.",
      };
    }

    return {
      status: "valid",
      message: "Looks good. This appears to be a real inbox.",
    };
  } catch (error) {
    console.error("Demo validation failed", error);
    return {
      status: "invalid",
      message: "Could not connect to the verification server.",
    };
  }
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "validating">("idle");
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateEmail = async (val: string) => {
    if (!val || !val.includes("@")) {
      setStatus("idle");
      return;
    }
    
    setStatus("validating");
    try {
      const result = await checkEmailApi(val);
      if (result.status !== "valid" && result.status !== "free" && result.status !== "idle") {
        setStatus("error");
        setMessage(result.message || "Invalid email address.");
      } else {
        setStatus("idle");
        setMessage("");
      }
    } catch {
      // Silently fail real-time validation
      setStatus("idle");
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (status === "error") setStatus("idle");

    timerRef.current = setTimeout(() => {
      validateEmail(val);
    }, 600);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");

    try {
      const validation = await checkEmailApi(email);

      if (validation.status !== "valid" && validation.status !== "free" && validation.status !== "idle") {
        setStatus("error");
        setMessage(validation.message || "Invalid email address.");
        return;
      }

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Could not connect to server.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-900">{message}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-3 text-xs text-slate-500 transition-colors hover:text-slate-900"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row relative">
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            placeholder="Work email"
            required
            className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition ${
              status === "error" 
                ? "border-red-500 focus:border-red-600" 
                : "border-slate-200 focus:border-slate-900"
            }`}
          />
          {status === "validating" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={status === "loading" || status === "error"}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-8 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Join"}
        </button>
      </div>
      <div className="flex items-center justify-between min-h-[1.5rem]">
        {status === "error" ? (
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-red-600 animate-in fade-in slide-in-from-top-1">
            <X className="h-3.5 w-3.5" />
            {message}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">
            <Shield className="h-3 w-3" />
            LeadCop Protected
          </p>
        )}
      </div>
    </form>
  );
}

function LiveDemoWidget() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ValResult>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const examples = [
    { label: "Disposable", value: "user@mailinator.com" },
    { label: "Role", value: "admin@corporate.com" },
    { label: "Typo", value: "john@gmial.com" },
    { label: "Relay", value: "user@privaterelay.appleid.com" },
    { label: "Real", value: "sarah@acmecorp.com" },
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setEmail(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value.trim()) {
      setResult({ status: "idle" });
      return;
    }

    setResult({ status: "typing" });
    timerRef.current = setTimeout(async () => {
      setResult({ status: "checking" });
      const apiResult = await checkEmailApi(value);
      setResult(apiResult);
    }, 500);
  };

  const stateTone: Record<
    ValStatus,
    { border: string; icon: React.ReactNode; text: string; panel?: string }
  > = {
    idle: {
      border: "border-slate-200",
      icon: <Shield className="h-5 w-5 text-slate-300" />,
      text: "Type an email to see LeadCop classify it in real time.",
    },
    typing: {
      border: "border-slate-300",
      icon: <Shield className="h-5 w-5 text-slate-400" />,
      text: "Waiting for a quick pause before checking.",
    },
    checking: {
      border: "border-slate-400",
      icon: <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />,
      text: "Checking the address now.",
    },
    blocked: {
      border: "border-red-300",
      icon: <X className="h-5 w-5 text-red-500" />,
      text: result.message || "Temporary email addresses are blocked.",
      panel: "bg-red-50 text-red-700",
    },
    role: {
      border: "border-amber-300",
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      text: result.message || "Role-based email detected.",
      panel: "bg-amber-50 text-amber-700",
    },
    typo: {
      border: "border-amber-300",
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      text: result.message || "Possible typo detected.",
      panel: "bg-amber-50 text-amber-700",
    },
    invalid: {
      border: "border-red-300",
      icon: <X className="h-5 w-5 text-red-500" />,
      text: result.message || "Invalid email address.",
      panel: "bg-red-50 text-red-700",
    },
    valid: {
      border: "border-emerald-300",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      text: result.message || "Looks good.",
      panel: "bg-emerald-50 text-emerald-700",
    },
    "tld-error": {
      border: "border-amber-300",
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      text: result.message || "Invalid domain extension.",
      panel: "bg-amber-50 text-amber-700",
    },
    free: {
      border: "border-sky-300",
      icon: <Mail className="h-5 w-5 text-sky-500" />,
      text: result.message || "Personal email detected.",
      panel: "bg-sky-50 text-sky-700",
    },
  };

  const tone = stateTone[result.status];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#584d84]">Real-time Demo</p>
          <p className="mt-1 text-sm text-slate-500">Experience LeadCop as your users do</p>
        </div>
        <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
          Sandbox
        </div>
      </div>

      <div className={`flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3 ${tone.border}`}>
        <input
          type="email"
          value={email}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="name@company.com"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        {tone.icon}
      </div>

      <div className={`mt-3 rounded-xl px-4 py-3 text-[13px] ${tone.panel || "bg-slate-50 text-slate-600 border border-slate-100"}`}>
        <div className="flex items-center gap-2">
          {tone.icon}
          <span>{tone.text}</span>
        </div>
        {result.status === "typo" && result.suggestion && (
          <button
            onClick={() => handleChange(result.suggestion!)}
            className="mt-2 text-[12px] font-bold text-[#584d84] underline underline-offset-4"
          >
            Use suggested address
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Examples</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example.value}
              onClick={() => handleChange(example.value)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] text-slate-600 transition hover:border-[#584d84] hover:text-[#584d84]"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-xs uppercase tracking-[0.2em] text-white/50">Install snippet</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 transition hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-xs leading-6 text-emerald-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  preview,
  buttonText,
  primary,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  preview?: {
    email: string;
    details: { label: string; value: string }[];
    badge: { text: string; tone: "red" | "orange" | "emerald" | "amber" | "sky" };
    dot: string;
  };
  buttonText?: string;
  primary?: boolean;
  wide?: boolean;
}) {
  const badgeTones = {
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
  };

  const dotColors = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md flex flex-col h-full ${wide ? "lg:col-span-3 md:col-span-2" : ""}`}
    >
      <div className={`flex flex-col flex-1 ${wide ? "lg:flex-row lg:items-center lg:justify-between lg:gap-12" : ""}`}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[#584d84] border border-slate-100">
              {icon}
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {title}
              {wide && <span className="bg-[#584d84] text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">New</span>}
            </h3>
          </div>

          <p className={`text-[15px] leading-relaxed text-slate-600 ${wide ? "mb-6 max-w-xl" : "mb-6"}`}>
            {description}
          </p>

          {preview && (
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-[11px]">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${dotColors[preview.badge.tone]}`} />
                <span className="text-slate-400 font-bold uppercase tracking-wider">Input: {preview.email}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {preview.details.map((d) => (
                  <div key={d.label}>
                    <span className="text-slate-400 font-medium">{d.label}: </span>
                    <span className={d.value === "true" || d.value === "false" || d.value.includes('"') ? "text-[#584d84] font-bold" : "text-slate-600"}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {buttonText && (
          <div className={`${wide ? "lg:w-48 mt-6 lg:mt-0" : "mt-auto"}`}>
            <button
              className={`w-full py-2.5 px-4 rounded-xl text-[14px] font-bold border transition ${primary
                ? "bg-[#584d84] border-[#584d84] text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition ${scrolled
        ? "border-slate-200 bg-[rgba(250,250,249,0.92)] backdrop-blur"
        : "border-transparent bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Logo size={34} />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          <a href="#product" className="transition hover:text-slate-900">
            Product
          </a>
          <a href="#how" className="transition hover:text-slate-900">
            How it works
          </a>
          <a href="#install" className="transition hover:text-slate-900">
            Installation
          </a>
          <a href="#pricing" className="transition hover:text-slate-900">
            Pricing
          </a>
          <Link href="/docs" className="transition hover:text-slate-900">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm text-slate-500 transition hover:text-slate-900 md:block">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"html" | "wordpress">("html");
  const { user } = useAuth();

  const htmlSnippet = `<!-- Paste just before </body> -->
<script
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="YOUR_API_KEY">
</script>`;

  const stats = [
    { value: "2.4M+", label: "signups checked" },
    { value: "99.7%", label: "accuracy rate" },
    { value: "<100ms", label: "average decision time" },
    { value: "5 min", label: "typical setup" },
  ];

  const steps = [
    {
      number: "01",
      title: "Connect LeadCop",
      text: "Add one script or install the WordPress plugin. LeadCop attaches to your forms automatically.",
    },
    {
      number: "02",
      title: "Check every signup",
      text: "Disposable, typo, relay, and role-based emails are classified in real time before they enter your CRM.",
    },
    {
      number: "03",
      title: "Keep the good leads",
      text: "Real visitors move through the form normally while bad data gets blocked or flagged instantly.",
    },
  ];

  const proofCards = [
    {
      title: "Cleaner pipelines",
      description: "Keep junk addresses out of sales workflows, onboarding, and marketing automation from the start.",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: "Lower ad waste",
      description: "Paid traffic stops turning into fake submissions, which makes channel performance easier to trust.",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      title: "Better deliverability",
      description: "Valid inboxes mean fewer bounces, stronger sender reputation, and more dependable campaign data.",
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  const features = [
    {
      title: "Disposable Email Detection",
      description: "Instantly blocks 200,000+ burner and temporary email providers. Updated daily to catch new domains.",
      icon: <Trash2 className="h-5 w-5" />,
      preview: {
        email: "temp123@mailinator.com",
        details: [{ label: "domain_exists", value: "true" }],
        badge: { text: "BLOCKED", tone: "red" as const },
        dot: "red",
      },
      buttonText: "Block",
      primary: false,
    },
    {
      title: "Email Forwarding Detection",
      description: "Detects hidden relay services and forwarding domains used to mask real user identities.",
      icon: <MoveRight className="h-5 w-5" />,
      preview: {
        email: "forward@outlook.com",
        details: [{ label: "forwarding", value: '"detected"' }],
        badge: { text: "FLAG RELAY", tone: "orange" as const },
        dot: "orange",
      },
      buttonText: "Verify Identity",
    },
    {
      title: "MX Records Validation",
      description: "Verifies that the domain's mail servers are configured and capable of receiving mail.",
      icon: <Server className="h-5 w-5" />,
      preview: {
        email: "contact@example.com",
        details: [{ label: "mx", value: '"valid"' }],
        badge: { text: "ACCEPTED", tone: "emerald" as const },
        dot: "emerald",
      },
      buttonText: "Mark as Valid",
    },
    {
      title: "Public Email Detection",
      description: "Identifies personal email providers like Gmail or Yahoo, perfect for B2B segmentation.",
      icon: <Globe className="h-5 w-5" />,
      preview: {
        email: "john.doe@gmail.com",
        details: [{ label: "public_domain", value: "true" }],
        badge: { text: "ASK FOR WORK MAIL", tone: "sky" as const },
        dot: "sky",
      },
      buttonText: "Ask for Work Email",
    },
    {
      title: "Smart Email Suggestions",
      description: "Intelligently catches common domain typos like gmial.com and suggests the correct fix.",
      icon: <Sparkles className="h-5 w-5" />,
      preview: {
        email: "user@gmial.com",
        details: [{ label: "suggestion", value: '"user@gmail.com"' }],
        badge: { text: "SUGGEST FIX", tone: "amber" as const },
        dot: "amber",
      },
      buttonText: "Suggest Fix",
    },
    {
      title: "Role Account Detection",
      description: "Flags shared addresses like support@ or admin@ that often lead to poor conversions.",
      icon: <Users className="h-5 w-5" />,
      preview: {
        email: "support@company.com",
        details: [{ label: "role_account", value: "true" }],
        badge: { text: "FLAG ROLE", tone: "orange" as const },
        dot: "orange",
      },
      buttonText: "Accept",
    },
    {
      title: "Comprehensive TLD Validation",
      description: "Cross-references every email against a database of 1,400+ official TLDs to catch invalid extensions and malformed domains.",
      icon: <Globe className="h-5 w-5" />,
      preview: {
        email: "user@startup-identity.xyz",
        details: [
          { label: "domain_exists", value: "true" },
          { label: "tld_valid", value: "true" },
        ],
        badge: { text: "NEW", tone: "sky" as const },
        dot: "sky",
      },
      buttonText: "Validate Domain",
      wide: true,
    },
  ];

  useEffect(() => {
    const scriptId = "leadcop-landing-structured-data";
    const canonicalUrl =
      typeof window !== "undefined" ? new URL("/", window.location.origin).toString() : "https://leadcop.io/";

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: "LeadCop",
          url: canonicalUrl,
          logo: "https://leadcop.io/favicon.svg",
        },
        {
          "@type": "WebSite",
          name: "LeadCop",
          url: canonicalUrl,
          description:
            "LeadCop blocks disposable emails, fake signups, and low-quality leads before they reach your pipeline.",
        },
        {
          "@type": "SoftwareApplication",
          name: "LeadCop",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: canonicalUrl,
          description:
            "Real-time disposable email detection and signup quality filtering for websites, forms, and WordPress.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        },
      ],
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white overflow-x-hidden">
      <div className="relative">
        <Navbar />

        <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            {/* Hero Content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#584d84] mb-8">
                <span className="h-2 w-2 rounded-full bg-[#584d84]" />
                Minimal setup. Immediate protection.
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl leading-[1.1]">
                Stop fake signups <span className="text-[#584d84] block mt-2">at the gate.</span>
              </h1>

              <p className="mt-8 text-lg leading-relaxed text-slate-600">
                LeadCop validates every submission in real time. We instantly filter out disposable emails, bots, and low-conversion role accounts before they pollute your pipeline or CRM.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#584d84] px-8 text-[15px] font-bold text-white transition hover:opacity-90"
                >
                  Start free trial
                </Link>
                <a
                  href="#demo"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 text-[15px] font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Run live demo
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-5 text-[13px] font-semibold text-indigo-950/70">
                {["No credit card", "Works on any website", "WordPress plugin available"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div id="demo" className="mt-10 lg:mt-0">
              <LiveDemoWidget />
            </div>
          </div>
        </section>

      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="font-display text-4xl font-extrabold tracking-tight text-[#584d84]">{stat.value}</p>
                <p className="mt-2 text-[14px] font-semibold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl text-center mx-auto mb-16">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#584d84]">Why teams use LeadCop</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl leading-[1.1]">
            Built to remove friction, <br className="hidden sm:block" />not add it.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Keep bad data out, keep good leads moving. LeadCop acts as a seamless gateway that ensures only high-quality contacts reach your team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {proofCards.map((card) => (
            <FeatureCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 mb-16 items-end">
            <div className="max-w-2xl">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#584d84]">How it works</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl leading-[1.1]">
                Three steps to a cleaner funnel
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              No redesign, no custom flow, no complicated setup sequence. Just install, check, and keep the good data.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-md">
                <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#584d84]">{step.number}</p>
                <h3 className="mt-5 font-display text-[22px] font-bold text-slate-950">{step.title}</h3>
                <p className="mt-4 text-[16px] leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="install" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold" style={{ color: "#584d84" }}>Installation</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
              One line of code on any website.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              LeadCop works with static HTML, React, Next.js, WordPress, and form builders. You keep your existing
              stack and add protection on top.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["HTML forms", "React and Next.js", "WordPress", "WPForms and Contact Form 7"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
              {(["html", "wordpress"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm transition ${activeTab === tab
                    ? "text-white"
                    : "text-slate-600"
                  }`}
                  style={activeTab === tab ? { background: "#584d84" } : {}}
                >
                  {tab === "html" ? "HTML snippet" : "WordPress plugin"}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {activeTab === "html" ? (
                <div>
                  <CodeSnippet code={htmlSnippet} />
                  <p className="mt-3 text-sm text-slate-600">
                    Paste the script once and LeadCop protects every signup form it can detect on the page.
                  </p>
                  <Link
                    href="/docs"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900"
                  >
                    View developer docs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">WordPress setup</p>
                  <div className="mt-5 space-y-4">
                    {[
                      "Download the plugin ZIP file below.",
                      "Open WordPress Dashboard → Plugins → Add New → Upload Plugin.",
                      "Install and activate the plugin.",
                      "Paste your API key in LeadCop settings.",
                      "Save and start protecting your forms.",
                    ].map((step, index) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "#584d84" }}>
                          {index + 1}
                        </div>
                        <p className="pt-1 text-sm text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <a
                      href="/downloads/leadcop-email-validator.zip"
                      download
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Download className="h-4 w-4" />
                      Download Plugin ZIP
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.22em] font-semibold" style={{ color: "#584d84" }}>Coverage</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Everything you need to validate emails instantly
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Understand email quality in real-time without technical complexity. Precision checks for every contact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                preview={feature.preview}
                buttonText={feature.buttonText}
                primary={feature.primary}
                wide={feature.wide}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#584d84]">Social Proof</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
            Trusted by security ops & marketing.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              quote: "Our CRM stopped filling up with junk the same day we installed it.",
              name: "Marcus T.",
              role: "E-commerce founder",
            },
            {
              quote: "The plugin was simple enough that marketing handled setup without engineering.",
              name: "Rachel K.",
              role: "Growth consultant",
            },
            {
              quote: "Paid signup campaigns became easier to trust because fake leads dropped off immediately.",
              name: "David M.",
              role: "SaaS operator",
            },
          ].map((item) => (
            <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-slate-600">"{item.quote}"</p>
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-[14px] font-bold text-slate-900">{item.name}</p>
                <p className="text-[12px] font-semibold text-[#584d84]">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PricingSection />

      <section className="bg-[#584d84]">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/60">Newsletter</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-white">
            Practical notes on lead quality.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Weekly product updates, anti-spam tactics, and lessons from teams cleaning up acquisition funnels.
          </p>
          <div className="mx-auto mt-10 max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10">
            <NewsletterForm />
          </div>
        </div>
      </section>

      <footer className="bg-white mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto flex flex-col gap-16 border-t border-slate-100 pt-16 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo size={34} />
            <p className="mt-6 text-[15px] leading-relaxed text-slate-500">
              Protect signup forms from disposable emails, bot traffic, and bad lead data without rebuilding your site.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-[14px] font-medium text-slate-500 md:grid-cols-3">
            <div className="space-y-4">
              <p className="font-bold tracking-tight text-slate-900">Product</p>
              <a href="#product" className="block transition hover:text-[#584d84]">
                Features
              </a>
              <a href="#pricing" className="block transition hover:text-[#584d84]">
                Pricing
              </a>
              <a href="#demo" className="block transition hover:text-[#584d84]">
                Demo
              </a>
            </div>
            <div className="space-y-4">
              <p className="font-bold tracking-tight text-slate-900">Developers</p>
              <Link href="/docs" className="block transition hover:text-[#584d84]">
                Documentation
              </Link>
              <Link href="/docs" className="block transition hover:text-[#584d84]">
                API
              </Link>
              <Link href="/docs" className="block transition hover:text-[#584d84]">
                Integration guide
              </Link>
            </div>
            <div className="space-y-4">
              <p className="font-bold tracking-tight text-slate-900">Account</p>
              {user ? (
                <Link href="/dashboard" className="block transition hover:text-[#584d84]">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="block transition hover:text-[#584d84]">
                    Log in
                  </Link>
                  <Link href="/signup" className="block transition hover:text-[#584d84]">
                    Start free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 flex flex-col gap-4 text-[13px] font-semibold text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 LeadCop. All rights reserved.</p>
          <p>Lead validation, simplified.</p>
        </div>
      </footer>
      </div>
    </div>
  );
}
