import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, Terminal, Download, Menu, X, ChevronRight,
  Zap, Shield, BookOpen, Code2, Layers, BarChart3, ExternalLink,
} from 'lucide-react';
import { Logo } from './Logo';

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 bg-gray-900/60">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-500">{lang}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          {copied ? <><Check className="h-3.5 w-3.5 text-green-400" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-green-400 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Integration data ────────────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'html',
    label: 'HTML / WordPress',
    icon: '🌐',
    steps: [
      { title: 'Get your API key', desc: 'Sign up for a free account and copy your API key from the dashboard.' },
      { title: 'Add the script tag', desc: 'Paste the snippet just before the closing </body> tag in your theme or page.' },
      { title: 'Done!', desc: 'LeadCop automatically attaches to all email input fields and validates in real-time.' },
    ],
    code: `<!-- Paste just before the closing </body> tag -->
<!-- Works on WordPress, Contact Form 7, WPForms, HTML, etc. -->
<script
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="YOUR_API_KEY">
</script>

<!-- Full configuration example with all options -->
<script
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="YOUR_API_KEY"

  data-debounce="600"

  data-error-message="Disposable email addresses are not allowed."
  data-error-color="#ef4444"
  data-error-border="#f87171"

  data-warn-mx-message="This email domain has no mail server — you may not receive messages."
  data-warn-mx-color="#f59e0b"
  data-warn-mx-border="#fbbf24"

  data-warn-free-message="Free email providers are not accepted. Please use a work email."
  data-warn-free-color="#f59e0b"
  data-warn-free-border="#fbbf24">
</script>`,
  },
  {
    id: 'react',
    label: 'React / Next.js',
    icon: '⚛️',
    steps: [
      { title: 'Install nothing', desc: 'No npm package needed — just call the REST API directly.' },
      { title: 'Add the hook', desc: 'Copy the useEmailCheck hook into your project.' },
      { title: 'Use it in your form', desc: 'Attach to any email input field and show the error message.' },
    ],
    code: `import { useState, useEffect } from "react";

// Drop this hook anywhere in your project
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
        const res = await fetch("/api/check-email", {
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

// Usage in your form component:
function SignupForm() {
  const [email, setEmail] = useState("");
  const { isDisposable, isLoading } = useEmailCheck(email);

  return (
    <form>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ borderColor: isDisposable ? "red" : undefined }}
      />
      {isDisposable && (
        <p style={{ color: "red" }}>
          Temporary email addresses are not allowed.
        </p>
      )}
      <button disabled={isDisposable === true}>Sign Up</button>
    </form>
  );
}`,
  },
  {
    id: 'laravel',
    label: 'Laravel / PHP',
    icon: '🐘',
    steps: [
      { title: 'Add to config', desc: 'Store your API key in your .env file as LEADCOP_KEY.' },
      { title: 'Create a validation rule', desc: 'Register a custom validation rule or use the closure shown below.' },
      { title: 'Apply to any form', desc: 'Use the rule in any FormRequest or controller.' },
    ],
    code: `<?php

// .env
// LEADCOP_KEY=your_api_key_here

// app/Rules/NoDisposableEmail.php
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
                    'Authorization' => 'Bearer ' . config('services.leadcop.key'),
                ])
                ->post('https://leadcop.io/api/check-email', [
                    'email' => $value,
                ]);

            return $response->successful()
                ? !$response->json('isDisposable')
                : true;
        } catch (\\Exception $e) {
            return true;
        }
    }

    public function message(): string
    {
        return 'Temporary email addresses are not allowed.';
    }
}

// Usage in FormRequest:
public function rules(): array
{
    return [
        'email' => ['required', 'email', new NoDisposableEmail],
    ];
}`,
  },
  {
    id: 'python',
    label: 'Python / Django',
    icon: '🐍',
    steps: [
      { title: 'pip install requests', desc: 'Or use httpx if you prefer async. No other dependencies needed.' },
      { title: 'Add the validator', desc: 'Copy the is_disposable_email function into your project.' },
      { title: 'Apply to Django/FastAPI', desc: 'Call it in your form validator, serializer, or Pydantic model.' },
    ],
    code: `import requests
from functools import lru_cache

LEADCOP_KEY = "YOUR_API_KEY"
LEADCOP_URL = "https://leadcop.io/api/check-email"

@lru_cache(maxsize=512)
def is_disposable_email(email: str) -> bool:
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
        data = response.json()
        return data.get("isDisposable", False)
    except Exception:
        return False

# Django Form example:
from django import forms

class SignupForm(forms.Form):
    email = forms.EmailField()

    def clean_email(self):
        email = self.cleaned_data["email"]
        if is_disposable_email(email):
            raise forms.ValidationError(
                "Temporary email addresses are not allowed."
            )
        return email`,
  },
  {
    id: 'node',
    label: 'Node.js / Express',
    icon: '🟩',
    steps: [
      { title: 'Add middleware', desc: 'Create a reusable middleware function.' },
      { title: 'Apply to routes', desc: 'Add it to any route that accepts email addresses.' },
      { title: 'Handle the error', desc: 'Return a 400 response with a clear error message.' },
    ],
    code: `// middleware/checkEmail.js
const LEADCOP_KEY = process.env.LEADCOP_KEY;
const LEADCOP_URL = "https://leadcop.io";

async function noDisposableEmail(req, res, next) {
  const email = req.body?.email;
  if (!email) return next();

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
    console.error("LeadCop check failed:", err.message);
  }

  next();
}

// Usage in Express router:
router.post("/signup", noDisposableEmail, async (req, res) => {
  const { email, password } = req.body;
  // email is guaranteed non-disposable here
});`,
  },
  {
    id: 'curl',
    label: 'cURL / REST',
    icon: '⚡',
    steps: [
      { title: 'No setup needed', desc: 'Just make a POST request with your API key as a Bearer token.' },
      { title: 'Parse the response', desc: 'Check the isDisposable field in the JSON response.' },
      { title: 'Handle the result', desc: 'Reject the email if isDisposable is true.' },
    ],
    code: `# Check if an email is disposable
curl -X POST https://leadcop.io/api/check-email \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@mailinator.com"}'

# Response (disposable):
{
  "isDisposable": true,
  "domain": "mailinator.com",
  "requestsRemaining": 998
}

# Response (legitimate):
{
  "isDisposable": false,
  "domain": "gmail.com",
  "requestsRemaining": 997
}

# 401 — Invalid or missing API key
{ "error": "API key required. Pass Authorization: Bearer <your_api_key>" }

# 429 — Rate limit exceeded
{ "error": "Rate limit exceeded. Please upgrade your plan." }`,
  },
  {
    id: 'wordpress',
    label: 'WordPress Plugin',
    icon: '🔌',
    steps: [
      { title: 'Download the plugin', desc: 'Download the LeadCop Email Validator plugin zip from your dashboard or the link below.' },
      { title: 'Install in WordPress', desc: 'Go to Plugins → Add New → Upload Plugin, select the zip, and click Install Now → Activate.' },
      { title: 'Enter your API key', desc: 'Go to LeadCop in your WP admin menu, paste your API key, and save. All supported forms are protected automatically.' },
    ],
    code: `; WordPress Plugin — no code required!
; After activating the plugin, navigate to:
;   WordPress Admin → LeadCop → General Settings
; Paste your API key and click Save Settings.

; Supported form systems (toggle each on/off):
;   ✅ WordPress registration form
;   ✅ WordPress comment form
;   ✅ WooCommerce checkout & My Account
;   ✅ Contact Form 7
;   ✅ WPForms
;   ✅ Gravity Forms

; Validation Rules (LeadCop → Validation Rules):
;   Block disposable emails  → ON  (recommended)
;   Free email providers     → Off | Warn | Block
;   No MX records            → Off | Warn | Block

; All validation is server-side — it cannot be bypassed by bots.
; The plugin fails open: if the API is unreachable, forms still work.`,
  },
];

const SCRIPT_ATTRS = [
  { attr: 'data-api-key',          def: '""',                             desc: 'Your API key (required). Sent as Bearer token.' },
  { attr: 'data-api-url',          def: 'script origin',                  desc: 'Base URL of the API server. Defaults to the script\'s own origin.' },
  { attr: 'data-debounce',         def: '600',                            desc: 'Milliseconds to wait after typing stops before firing the check.' },
  { attr: 'data-error-message',    def: '"Temporary email addresses…"',   desc: '❌ Error shown for disposable emails. Blocks form submission.' },
  { attr: 'data-error-color',      def: '#ef4444',                        desc: 'Text colour for the disposable-email error message.' },
  { attr: 'data-error-border',     def: '#f87171',                        desc: 'Input border colour when a disposable email is detected.' },
  { attr: 'data-warn-mx-message',  def: '"This email domain has no…"',    desc: '⚠️ Warning when the domain has no mail server. Does NOT block submit.' },
  { attr: 'data-warn-mx-color',    def: '#f59e0b',                        desc: 'Text colour for the mail server warning message.' },
  { attr: 'data-warn-mx-border',   def: '#fbbf24',                        desc: 'Input border colour for the mail server warning.' },
  { attr: 'data-warn-free-message',def: '"Free email providers are…"',    desc: '⚠️ Warning for free providers (Gmail, Yahoo, etc.). Does NOT block submit.' },
  { attr: 'data-warn-free-color',  def: '#f59e0b',                        desc: 'Text colour for the free email warning message.' },
  { attr: 'data-warn-free-border', def: '#fbbf24',                        desc: 'Input border colour for the free email warning.' },
];

const NAV_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started', icon: <Zap className="w-4 h-4" /> },
  { id: 'authentication',  label: 'Authentication',  icon: <Shield className="w-4 h-4" /> },
  { id: 'api-reference',   label: 'API Reference',   icon: <Code2 className="w-4 h-4" /> },
  { id: 'integrations',    label: 'Integration Guides', icon: <Layers className="w-4 h-4" /> },
  { id: 'script-attrs',    label: 'Script Attributes', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'rate-limits',     label: 'Rate Limits',     icon: <BarChart3 className="w-4 h-4" /> },
];

export default function DocsPage() {
  const validIds = INTEGRATIONS.map(i => i.id);
  const [activeTab, setActiveTab] = useState('html');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (validIds.includes(id)) setActiveTab(id);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const current = INTEGRATIONS.find(i => i.id === activeTab)!;

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
            <Logo size={36} invert={true} />
              <span className="font-semibold text-gray-900 font-heading">LeadCop</span>
            </Link>
            <span className="hidden md:block text-gray-300">/</span>
            <span className="hidden md:block text-sm text-gray-500">Docs</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://leadcop.io" className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
              leadcop.io <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Log in</Link>
            <Link href="/register" className="px-3.5 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
              Get started
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-500 hover:text-gray-900 p-1">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={`${sidebarOpen ? 'fixed inset-0 z-40 bg-white pt-14' : 'hidden'} md:block md:relative md:w-60 md:flex-shrink-0 border-r border-gray-100`}>
          <nav className="sticky top-14 p-5 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 px-3">Contents</p>
            {NAV_SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${activeSection === s.id ? 'bg-violet-50 text-violet-600 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                <span className={activeSection === s.id ? 'text-violet-600' : 'text-gray-400'}>{s.icon}</span>
                {s.label}
                {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-500" />}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 px-3">Platforms</p>
              {INTEGRATIONS.map(i => (
                <button key={i.id}
                  onClick={() => { setActiveTab(i.id); scrollTo('integrations'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left ${activeTab === i.id && activeSection === 'integrations' ? 'bg-violet-50 text-violet-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <span>{i.icon}</span>{i.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-6 md:px-10 py-10 space-y-12">

          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-20">
            <div className="mb-2 flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />Getting Started
            </div>
            <h1 className="font-heading text-4xl font-bold text-gray-900 mb-4">API Documentation</h1>
            <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
              Integrate LeadCop into your stack in minutes. Choose your platform in the Integration Guides section for a copy-paste example, or explore the REST API reference below.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-5">
              {[
                { emoji:'🔌', title:'WordPress Plugin', desc:'Install in 30 seconds — no code needed.' },
                { emoji:'📄', title:'Script Tag', desc:'One line of HTML for any website.' },
                { emoji:'⚡', title:'REST API', desc:'Integrate with any language or framework.' },
              ].map(c => (
                <div key={c.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{c.emoji}</div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">{c.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{c.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="scroll-mt-20">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Shield className="w-6 h-6 text-violet-600" />Authentication
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Every request must include your API key in the{' '}
              <code className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600 text-xs font-mono border border-violet-100">Authorization</code>{' '}
              header as a Bearer token. Get your key from the{' '}
              <Link href="/dashboard" className="text-violet-600 font-semibold underline underline-offset-2 hover:text-violet-700">dashboard</Link>.
            </p>
            <CodeBlock lang="HTTP Header" code={`Authorization: Bearer YOUR_API_KEY`} />
          </section>

          {/* API Reference */}
          <section id="api-reference" className="scroll-mt-20">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Code2 className="w-6 h-6 text-violet-600" />API Reference
            </h2>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-lg bg-violet-600 px-3 py-1 font-mono text-xs font-bold text-white shadow-md shadow-violet-200">POST</span>
                  <h3 className="text-lg font-bold text-gray-900 font-mono">/api/check-email</h3>
                </div>
                <p className="text-sm text-gray-500">Checks if an email belongs to a known disposable/burner email provider.</p>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-10 bg-gray-50/30">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Request Body</p>
                  <CodeBlock lang="JSON" code={`{\n  "email": "test@mailinator.com"\n}`} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 mt-8">Response</p>
                  <CodeBlock lang="JSON" code={`{\n  "isDisposable": true,\n  "domain": "mailinator.com",\n  "requestsRemaining": 999\n}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Error Responses</p>
                  <div className="space-y-3">
                    {[
                      { status:'400', msg:'{ "error": "Invalid email address" }',    color:'text-yellow-600' },
                      { status:'401', msg:'{ "error": "API key required." }',         color:'text-red-600' },
                      { status:'429', msg:'{ "error": "Rate limit exceeded." }',      color:'text-orange-600' },
                    ].map(e => (
                      <div key={e.status} className="rounded-xl border border-gray-100 bg-white p-4 font-mono text-xs shadow-sm flex items-center">
                        <span className={`mr-3 font-black text-sm ${e.color}`}>{e.status}</span>
                        <span className="text-gray-500">{e.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Integration Guides */}
          <section id="integrations" className="scroll-mt-20">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Layers className="w-6 h-6 text-violet-600" />Integration Guides
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Pick your stack for a copy-paste integration example.</p>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg shadow-gray-100">
              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/80 no-scrollbar">
                {INTEGRATIONS.map(item => (
                  <button key={item.id}
                    onClick={() => { setActiveTab(item.id); window.location.hash = item.id; }}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === item.id ? 'text-violet-600 border-violet-600 bg-white' : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-white/50'}`}>
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 grid lg:grid-cols-[260px_1fr] gap-10 items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xl">{current.icon}</span>
                      <h3 className="text-base font-bold text-gray-900">{current.label}</h3>
                    </div>
                    <ol className="space-y-6">
                      {current.steps.map((step, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-100 text-violet-600 text-xs font-black flex items-center justify-center mt-0.5">{i+1}</span>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-snug">{step.title}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {activeTab === 'wordpress' && (
                      <a href="/downloads/leadcop-email-validator.zip" download className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 hover:-translate-y-0.5 active:translate-y-0">
                        <Download className="h-4 w-4" />Download Plugin
                      </a>
                    )}
                  </div>
                  <div className="min-w-0">
                    <CodeBlock lang={current.label} code={current.code} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* Script Attributes */}
          <section id="script-attrs" className="scroll-mt-20">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-violet-600" />Embed Script Attributes
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-3xl">
              All behaviour of the <code className="rounded bg-violet-50 border border-violet-100 px-1.5 py-0.5 text-violet-600 text-xs font-mono">temp-email-validator.js</code> embed script is controlled via <code className="rounded bg-violet-50 border border-violet-100 px-1.5 py-0.5 text-violet-600 text-xs font-mono">data-*</code> attributes.
              The script has three display states: <span className="text-red-600 font-bold">Error</span> (blocks submit), <span className="text-amber-600 font-bold">Warning</span> (alerts, allows submit), and <span className="text-green-600 font-bold">Clear</span>.
            </p>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Attribute</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Default</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {SCRIPT_ATTRS.map(row => (
                      <tr key={row.attr} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-violet-600 whitespace-nowrap">{row.attr}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400 whitespace-nowrap">{row.def}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 leading-relaxed">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/30 space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Priority when multiple conditions are true</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-4 py-1.5 text-red-700 font-bold shadow-sm">1. Disposable → Error</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-amber-700 font-bold shadow-sm">2. Free email → Warning</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-amber-700 font-bold shadow-sm">3. No MX → Warning</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <span className="flex items-center gap-1.5 rounded-full bg-green-100 border border-green-200 px-4 py-1.5 text-green-700 font-bold shadow-sm">4. Clean → Clear</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  * MX detection and free email flagging require those features to be enabled on your plan. The script handles API properties automatically.
                </p>
              </div>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="scroll-mt-20">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-violet-600" />Rate Limits
            </h2>
            <p className="text-sm text-gray-500 mb-8 font-medium">Monthly request quotas reset on the 1st of each month.</p>
            <div className="grid sm:grid-cols-3 gap-5 mb-8">
              {[
                { plan:'FREE',   limit:'500',     period:'checks / month',  note:'Great for testing',           highlight: false },
                { plan:'GROWTH', limit:'5,000',   period:'checks / month',  note:'Most popular',                highlight: true },
                { plan:'PRO',    limit:'50,000',  period:'checks / month',  note:'For high traffic',            highlight: false },
              ].map(p => (
                <div key={p.plan} className={`rounded-2xl p-6 border transition-all ${p.highlight ? 'border-violet-200 bg-violet-50/50 shadow-md shadow-violet-100 ring-2 ring-violet-50' : 'border-gray-100 bg-gray-50'}`}>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{p.plan}</p>
                  <p className="text-3xl font-black text-gray-900">{p.limit}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">{p.period}</p>
                  <div className="h-1 w-8 bg-gray-200 my-4 rounded-full" />
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{p.note}</p>
                </div>
              ))}
            </div>
            <div className="bg-violet-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-violet-200">
               <div className="relative z-10">
                 <h3 className="font-heading text-lg font-bold mb-2">Need a higher limit?</h3>
                 <p className="text-violet-100 text-sm mb-6 max-w-md">We offer custom enterprise quotas for applications checking millions of signups per month.</p>
                 <div className="flex flex-wrap gap-4">
                   <Link href="/pricing" className="px-6 py-2.5 bg-white text-violet-600 rounded-xl font-bold text-sm hover:bg-violet-50 transition-colors">View Plans</Link>
                   <a href="mailto:hello@leadcop.io" className="px-6 py-2.5 bg-violet-700 text-white rounded-xl font-bold text-sm hover:bg-violet-800 transition-colors border border-violet-500">Contact Support</a>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
               <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
            </div>
          </section>

          <footer className="border-t border-gray-100 pt-12 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-400 font-medium">
            <div className="flex items-center gap-4">
              <span>© 2026 LeadCop</span>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <Link href="/docs" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <Link href="/docs" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            </div>
            <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors py-2 px-4 rounded-lg bg-gray-50 hover:bg-gray-100">
              <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to LeadCop Home
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
