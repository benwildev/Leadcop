import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Zap, Check, X, ArrowRight, Copy, CheckCircle2,
  Mail, Globe, AtSign, FileWarning, Sparkles, UserX,
  ChevronDown, Star, Lock, Shield, AlertCircle, RefreshCw, Send,
} from 'lucide-react';
import { PricingSection } from "../components/sections/PricingSection";
import { Logo } from './Logo';

type ValStatus = 'idle' | 'typing' | 'checking' | 'blocked' | 'role' | 'typo' | 'invalid' | 'valid' | 'tld-error' | 'free';
type ValResult = { status: ValStatus; message?: string; suggestion?: string; reason?: string };

// ─── Live Demo Validation (API Powered) ──────────────────────────────────────
async function checkEmailApi(email: string): Promise<ValResult> {
  const t = email.trim();
  if (!t) return { status: 'idle' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return { status: 'invalid', message: "This doesn't look like a valid email address." };

  try {
    const response = await fetch('/api/check-email/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: t }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { status: 'invalid', message: err.error || "Invalid email address." };
    }

    const data = await response.json();

    if (data.isInvalidTld) return { status: 'tld-error', message: 'Invalid domain', reason: 'Unsupported TLD' };
    if (data.isForwarding) return { status: 'role', message: 'Email relay services are not recommended for signups.', reason: 'Forwarding / Relay detected' };
    if (data.isDisposable) return { status: 'blocked', message: 'Temporary email addresses are not allowed.', reason: 'Disposable provider detected' };
    if (data.didYouMean) return { status: 'typo', message: `Did you mean ${data.didYouMean}?`, suggestion: data.didYouMean };
    if (data.isGibberish) return { status: 'tld-error', message: 'This TLD or domain pattern is suspicious.', reason: 'TLD/Pattern check failed' };
    if (data.isFree) return { status: 'free', message: 'Personal email detected.' };

    return { status: 'valid', message: 'Looks good! This is a real email address.' };
  } catch (error) {
    console.error("API Error:", error);
    return { status: 'invalid', message: "Could not connect to verification server." };
  }
}

// ─── Newsletter Form Component ──────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setStatus('loading');
    try {
      // First, validate using LeadCop logic
      const validation = await checkEmailApi(email);
      console.log("Newsletter Validation Result:", validation);
      
      if (validation.status !== 'valid' && validation.status !== 'idle') {
        setStatus('error');
        setMessage(validation.message || "Invalid email address.");
        return;
      }

      console.log("Newsletter verification passed. Subscribing...");
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      console.log("Newsletter Subscription API Response:", data);
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || "You're on the list!");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus('error');
      setMessage("Could not connect to server.");
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 py-4 text-gray-900"
      >
        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <p className="font-semibold text-base">{message}</p>
        <button onClick={() => setStatus('idle')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Subscribe another email</button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto relative group">
      <div className="flex-1 relative">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all"
        />
      </div>
      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="bg-gray-900 text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 min-w-[120px]"
      >
        {status === 'loading' ? (
          <RefreshCw className="w-4 h-4 animate-spin text-white/50" />
        ) : (
          'Join'
        )}
      </button>
      {status === 'error' && (
        <p className="absolute -bottom-6 left-0 right-0 text-[10px] text-red-500 font-medium">{message}</p>
      )}
    </form>
  );
}

// ─── Live Demo Widget ────────────────────────────────────────────────────────
function LiveDemoWidget() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<ValResult>({ status: 'idle' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const examples = [
    { label: 'Apple Relay', value: 'user@privaterelay.appleid.com' },
    { label: 'Role address', value: 'admin@company.com' },
    { label: 'Invalid domain', value: 'user@imcgrupo.comfd' },
    { label: 'Real email', value: 'sarah@acmecorp.com' },
  ];

  const handleChange = (val: string) => {
    setEmail(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) { setResult({ status: 'idle' }); return; }
    setResult({ status: 'typing' });
    timerRef.current = setTimeout(async () => {
      setResult({ status: 'checking' });
      const apiResult = await checkEmailApi(val);
      setResult(apiResult);
    }, 650);
  };

  const s = result.status;
  const borderCls =
    s === 'valid' ? 'border-green-400 ring-2 ring-green-100' :
      s === 'free' ? 'border-blue-400 ring-2 ring-blue-100' :
      s === 'blocked' || s === 'invalid' ? 'border-red-400 ring-2 ring-red-100' :
        s === 'role' || s === 'tld-error' ? 'border-orange-400 ring-2 ring-orange-100' :
          s === 'typo' ? 'border-yellow-400 ring-2 ring-yellow-100' :
            'border-gray-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-violet-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-gray-400 font-mono">leadcop.io / live-demo</span>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Email Address</p>
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 bg-white ${borderCls}`}>
        <input
          type="email"
          value={email}
          onChange={e => handleChange(e.target.value)}
          placeholder="Type any email to test…"
          className="flex-1 text-gray-800 placeholder-gray-300 outline-none bg-transparent text-sm"
        />
        {s === 'checking' && <RefreshCw className="w-5 h-5 text-gray-300 animate-spin flex-shrink-0" />}
        {s === 'valid' && <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />}
        {s === 'free' && <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />}
        {(s === 'blocked' || s === 'invalid') && <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />}
        {s === 'role' && <Shield className="w-5 h-5 text-orange-500 flex-shrink-0" />}
        {s === 'tld-error' && <Shield className="w-5 h-5 text-orange-500 flex-shrink-0" />}
        {s === 'typo' && <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
        {(s === 'idle' || s === 'typing') && <Shield className="w-5 h-5 text-gray-200 flex-shrink-0" />}
      </div>

      <div className="min-h-[22px] mt-2.5">
        {s === 'blocked' && <p className="text-sm text-red-600 flex items-center gap-1.5"><X className="w-3.5 h-3.5 flex-shrink-0" />{result.message}</p>}
        {s === 'role' && <p className="text-sm text-orange-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{result.message}</p>}
        {s === 'tld-error' && <p className="text-sm text-orange-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{result.message}</p>}
        {s === 'typo' && <p className="text-sm text-yellow-700 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{result.message} <button onClick={() => handleChange(result.suggestion!)} className="ml-1 text-violet-600 underline text-xs">Fix it</button></p>}
        {s === 'invalid' && <p className="text-sm text-red-600 flex items-center gap-1.5"><X className="w-3.5 h-3.5 flex-shrink-0" />{result.message}</p>}
        {s === 'valid' && <p className="text-sm text-green-600 flex items-center gap-1.5"><Check className="w-3.5 h-3.5 flex-shrink-0" />{result.message}</p>}
        {s === 'free' && (
          <div className="flex flex-col gap-2.5">
            <p className="text-sm text-blue-600 flex items-center gap-1.5 font-medium"><Check className="w-3.5 h-3.5 flex-shrink-0" />{result.message}</p>
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] text-blue-700 font-medium">B2B Intel: Capture work emails instead?</span>
              </div>
              <button 
                className="text-[10px] font-bold text-blue-600 uppercase tracking-tight hover:text-blue-800 transition-colors"
                onClick={() => setEmail('')}
              >
                Enter Work email
              </button>
            </div>
          </div>
        )}
        {s === 'checking' && <p className="text-sm text-gray-400">Checking…</p>}
      </div>

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map(ex => (
            <button key={ex.value} onClick={() => handleChange(ex.value)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-700 transition-colors">
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative bg-gray-950 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><span className="w-2.5 h-2.5 rounded-full bg-green-500/50" /></div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>
      <pre className="p-5 text-xs font-mono text-green-400 leading-relaxed overflow-x-auto whitespace-pre-wrap"><code>{code}</code></pre>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ email, lines, badge, badgeCls, dot, icon, title, desc }: {
  email: string; lines: string[]; badge: string; badgeCls: string;
  dot: string; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 hover:shadow-md hover:border-violet-100 transition-all duration-200">
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`w-2 h-2 rounded-full ${dot}`} /><span className="text-gray-500 text-xs font-mono truncate">{email}</span>
        </div>
        <div className="space-y-0.5 mb-3">{lines.map(l => <div key={l} className="text-xs font-mono text-gray-400">{l}</div>)}</div>
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeCls}`}>{badge}</span>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2"><span className="text-violet-600">{icon}</span><span className="font-semibold text-gray-900 text-sm">{title}</span></div>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}



// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="group">
          <Logo size={36} invert={true} />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
          <a href="#demo" className="hover:text-gray-900 transition-colors">Live Demo</a>
          <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
          <a href="#install" className="hover:text-gray-900 transition-colors">Installation</a>
          <Link href="/docs" className="hover:text-gray-900 transition-colors">Docs</Link>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block">Log in</Link>
          <Link href="/register" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'html' | 'wordpress'>('html');

  const htmlSnippet = `<!-- Paste just before </body> on your website -->
<script
  src="https://leadcop.io/temp-email-validator.js"
  data-api-key="YOUR_API_KEY">
</script>`;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-violet-100/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 rounded-full px-4 py-1.5 text-sm mb-8 border border-violet-100 font-medium">
                <Zap className="w-3.5 h-3.5" />Works on any website — no coding needed
              </div>
              <h1 className="text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Stop fake signups<br /><span className="text-violet-600">before they cost you.</span>
              </h1>
              <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                LeadCop automatically blocks disposable emails, spam bots, and fake accounts from your forms in real time — protecting your list, your ad budget, and your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register" className="px-7 py-4 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-violet-200">
                  Start for free<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a href="#demo" className="px-7 py-4 bg-white text-gray-800 rounded-xl font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  Try live demo<ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                {['No credit card required', 'Free plan forever', '5-min setup'].map(t => (
                  <span key={t} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />{t}</span>
                ))}
              </div>
            </div>
            <div id="demo">
              <div className="mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gray-500 font-medium">Live demo — type any email below</span>
              </div>
              <LiveDemoWidget />
              <p className="mt-3 text-xs text-gray-400 text-center">This is exactly what your visitors see when they sign up on your form.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-8">Trusted by 5,000+ businesses worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[{ v: '2.4M+', l: 'Signups checked' }, { v: '99.7%', l: 'Accuracy rate' }, { v: '<100ms', l: 'Check speed' }, { v: '5 min', l: 'To set up' }].map(s => (
              <div key={s.l}><div className="text-3xl font-semibold text-gray-900">{s.v}</div><div className="text-sm text-gray-500 mt-1">{s.l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">How it works</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">Get your forms protected in three steps. No developer, no coding, no stress.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: <Lock className="w-6 h-6 text-violet-600" />, title: 'Add one line to your website', desc: 'Paste a single script tag before the closing tag on your page — or install the WordPress plugin in 30 seconds.' },
            { step: '02', icon: <Sparkles className="w-6 h-6 text-violet-600" />, title: 'We check every email silently', desc: "Every time someone fills out your form, LeadCop instantly validates the address in the background. Invisible to real users." },
            { step: '03', icon: <Shield className="w-6 h-6 text-violet-600" />, title: 'Fake ones are blocked instantly', desc: 'Disposable emails, spam bots, and fake addresses are stopped with a friendly message. Real users sail right through.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-8 group hover:shadow-md hover:border-violet-100 transition-all duration-200">
              <div className="text-6xl font-semibold text-gray-50 absolute top-5 right-5 select-none group-hover:text-violet-50 transition-colors">{step}</div>
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-violet-100 transition-colors">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Installation ─────────────────────────────────────────────────── */}
      <section id="install" className="bg-white py-24 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Works everywhere</p>
              <h2 className="text-4xl font-semibold text-gray-900 mb-5 leading-tight">One line of code.<br />Any platform.</h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                LeadCop connects to any website or signup form — no platform switching, no redesigning, no technical work.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { name: 'WordPress', emoji: '🔌' },
                  { name: 'HTML Forms', emoji: '📄' },
                  { name: 'React / Next.js', emoji: '⚛️' },
                  { name: 'Contact Form 7', emoji: '📋' },
                  { name: 'WPForms', emoji: '🗂️' },
                  { name: 'Any Platform', emoji: '🌍' },
                ].map(p => (
                  <span key={p.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-200 hover:border-violet-300 transition-colors">
                    <span>{p.emoji}</span>{p.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-green-800 text-sm"><strong>WordPress plugin available</strong> — install in 30 seconds from the plugin directory.</p>
              </div>
            </div>
            <div>
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
                {(['html', 'wordpress'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                    {t === 'html' ? 'Any Website (HTML)' : '🔌 WordPress Plugin'}
                  </button>
                ))}
              </div>
              {activeTab === 'html' ? (
                <div>
                  <CodeSnippet code={htmlSnippet} />
                  <p className="mt-3 text-gray-500 text-sm">That's it. LeadCop finds and protects every signup form on your page automatically.</p>
                  <Link href="/docs" className="mt-4 inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 transition-colors font-medium">
                    View full documentation <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-gray-400 font-mono">WordPress Installation</span>
                  </div>
                  <div className="p-6 space-y-4 text-sm text-gray-600">
                    {['Go to WordPress Dashboard → Plugins → Add New', 'Search for "LeadCop Email Validator"', 'Click Install Now → then Activate', 'Go to Settings → LeadCop', 'Paste your API key and click Save'].map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                        <span>{step}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2.5 pt-2 text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5" /><span>You're protected!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ───────────────────────────────────────────── */}
      <section id="features" className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Full protection</p>
            <h2 className="text-4xl font-semibold text-gray-900 mb-4">Every type of fake email, blocked.</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">LeadCop checks every angle so nothing slips through — without ever bothering your real customers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            <FeatureCard email="user@mailinator.com" lines={['disposable: true', 'provider: "mailinator"']} badge="BLOCKED" badgeCls="bg-red-100 text-red-600" dot="bg-red-400" icon={<Mail className="w-4 h-4" />} title="Disposable Email Detection" desc="Instantly blocks 200,000+ burner & temporary email providers. Updated daily, zero false positives on real addresses." />
            <FeatureCard email="user@company.dev-null" lines={['valid_tld: false', 'detected: "unsupported extension"']} badge="BLOCKED" badgeCls="bg-red-100 text-red-600" dot="bg-red-400" icon={<Globe className="w-4 h-4" />} title="Comprehensive TLD Validation" desc="Cross-references every email against a database of 1,400+ official TLDs to catch invalid extensions and malformed domains." />
            <FeatureCard email="user@privaterelay.appleid.com" lines={['relay_detected: true', 'service: "Apple Private Relay"']} badge="FLAG RELAY" badgeCls="bg-orange-100 text-orange-600" dot="bg-orange-400" icon={<RefreshCw className="w-4 h-4" />} title="Forwarding & Relay Detection" desc="Detects relay services and forwarding domains (like Apple Private Relay or Mozilla Relay) used to mask real identities." />
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <FeatureCard email="admin@yourcompany.com" lines={['role_account: true', 'prefix: "admin"']} badge="FLAG ROLE" badgeCls="bg-orange-100 text-orange-600" dot="bg-orange-400" icon={<AtSign className="w-4 h-4" />} title="Role Address Detection" desc="Flags shared inboxes like info@, support@, admin@ that often cause high unsubscribe rates and poor deliverability." />
            <FeatureCard email="sarah@acmecorp.com" lines={['real_inbox: true', 'deliverable: true']} badge="✓ ACCEPTED" badgeCls="bg-green-100 text-green-600" dot="bg-green-400" icon={<CheckCircle2 className="w-4 h-4" />} title="Real Inbox Verification" desc="Verifies the inbox actually exists and can receive messages — so your campaigns always reach real people." />
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard email="john@gmial.com" lines={['typo_detected: true', 'did_you_mean: "gmail.com"']} badge="SUGGEST FIX" badgeCls="bg-yellow-100 text-yellow-700" dot="bg-yellow-400" icon={<Sparkles className="w-4 h-4" />} title="Smart Typo Correction" desc="Catches typos like gmial.com and suggests the right fix so you never lose a real lead." />
            <FeatureCard email="user@gmail.com" lines={['free_provider: true', 'suggest_work_email: true']} badge="ASK FOR WORK MAIL" badgeCls="bg-blue-100 text-blue-600" dot="bg-blue-400" icon={<UserX className="w-4 h-4" />} title="Free Email Filter" desc="Optionally prompt visitors for their work email — helps you capture higher-quality B2B leads." />
            <FeatureCard email="hello@bad-domain.m" lines={['syntax_error: true', 'tld_invalid: true']} badge="INVALID" badgeCls="bg-red-100 text-red-600" dot="bg-red-400" icon={<FileWarning className="w-4 h-4" />} title="Syntax Validation" desc="Catches malformed addresses that would bounce and quietly damage your sender reputation." />
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Real customers</p>
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">Their lists got cleaner. Fast.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "I was wasting money on email campaigns to fake addresses. After LeadCop, my open rates jumped from 12% to 34% in one month.", name: "Marcus T.", role: "E-commerce store owner" },
            { quote: "The WordPress plugin installed in under a minute. I'm not technical at all but had it running before my morning coffee.", name: "Rachel K.", role: "Marketing consultant" },
            { quote: "We run paid ads to a landing page. LeadCop stopped bots from eating our ad budget with fake signups. ROI improved immediately.", name: "David M.", role: "SaaS founder" },
          ].map(({ quote, name, role }) => (
            <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 hover:shadow-md hover:border-violet-100 transition-all duration-200">
              <div className="flex gap-0.5 mb-4">{[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm flex-shrink-0">{name[0]}</div>
                <div><div className="text-sm font-semibold text-gray-900">{name}</div><div className="text-xs text-gray-400">{role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Newsletter Section (Minimalist) ─────────────────────────────────── */}
      <section className="py-24 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 text-violet-600 font-semibold text-[10px] uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-[1px] bg-violet-200" />
            Stay Updated
            <span className="w-8 h-[1px] bg-violet-200" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">Master lead protection.</h2>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed">
            Join 5,000+ developers. Weekly insights on anti-spam strategies and deliverability.
          </p>
          
          <NewsletterForm />
          
          <p className="mt-8 text-[11px] text-gray-400 font-medium">
            No spam. Unsubscribe with one click.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
            <div className="max-w-xs">
              <Logo size={34} invert={true} className="mb-4" />
              <p className="text-gray-500 text-sm leading-relaxed">Protect your signup forms from fake emails, bots, and spam — automatically, on any platform.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 text-sm">
              <div><p className="text-gray-900 font-semibold mb-4">Product</p>{['Features', 'Pricing', 'Live Demo', 'Changelog'].map(l => <a key={l} href="#" className="block text-gray-500 hover:text-violet-600 transition-colors mb-3">{l}</a>)}</div>
              <div><p className="text-gray-900 font-semibold mb-4">Developers</p>{[{ l: 'Documentation', to: '/docs' }, { l: 'HTML Integration', to: '/docs' }, { l: 'WordPress Plugin', to: '/docs' }, { l: 'REST API', to: '/docs' }].map(({ l, to }) => <Link key={l} href={to} className="block text-gray-500 hover:text-violet-600 transition-colors mb-3">{l}</Link>)}</div>
              <div><p className="text-gray-900 font-semibold mb-4">Company</p>{['About', 'Blog', 'Contact', 'Privacy', 'Terms'].map(l => <a key={l} href="#" className="block text-gray-500 hover:text-violet-600 transition-colors mb-3">{l}</a>)}</div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>© 2026 LeadCop. All rights reserved.</p>
            <p>Made to protect your business — not complicate it.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

