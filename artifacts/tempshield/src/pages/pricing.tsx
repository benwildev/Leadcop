import React, { useState } from "react";
import { Link } from "wouter";
import { Navbar, Footer, PageTransition } from "@/components/Layout";
import { Check, ArrowRight, Zap, Globe, Shield, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  {
    key: 'BASIC',
    name: 'Basic',
    desc: 'Essential tools for startups and independent developers',
    tiers: [
      { credits: 5000, price: 19 },
      { credits: 10000, price: 29 },
      { credits: 25000, price: 49 },
    ],
    features: [
      "Standard response time",
      "Usage dashboard",
      "Monthly credit reset",
      "Multiple API Keys",
      "Email support"
    ],
    highlighted: false,
    cta: 'Get Started'
  },
  {
    key: 'PRO',
    name: 'Pro',
    desc: 'The most popular choice for growing platforms',
    tiers: [
      { credits: 50000, price: 89 },
      { credits: 100000, price: 149 },
      { credits: 250000, price: 299 },
    ],
    features: [
      "Priority response time",
      "30-day request log",
      "UserCheck Gates",
      "Bulk email & domain validation",
      "Custom blocklist",
      "Advanced usage analytics",
      "Dedicated support"
    ],
    highlighted: true,
    cta: 'Scale Now'
  },
  {
    key: 'MAX',
    name: 'Max',
    desc: 'Enterprise-grade volume and performance for agencies',
    tiers: [
      { credits: 500000, price: 499 },
      { credits: 1000000, price: 899 },
      { credits: 2500000, price: 1999 },
    ],
    features: [
      "Fastest response time",
      "Unlimited API endpoints",
      "Lowest latency verification",
      "Custom webhook integrations",
      "Personal account manager",
      "Custom reporting tools",
      "24/7 Phone support"
    ],
    highlighted: false,
    cta: 'Go Unlimited'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-32">
          {/* ── Hero Section ── */}
          <div className="max-w-4xl mx-auto px-6 text-center mb-20 text-gray-900">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Zap className="w-3 h-3" />
              Elastic Capacity
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Start on our <span className="text-violet-600 text-6xl">Free Plan</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Scale your protection as your lead flow grows. Dynamic volume for every stage.
            </p>
          </div>

          <div className="max-w-[1240px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {PLANS.map((plan, idx) => (
                <PlanCard key={plan.key} plan={plan} index={idx} />
              ))}
            </div>
          </div>

          {/* ── Footer Hint ── */}
          <div className="mt-20 text-center flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
               <Shield className="w-4 h-4" />
               Enterprise? Contact <a href="mailto:sales@leadcop.io" className="text-violet-600 font-bold hover:underline">sales@leadcop.io</a> for custom volume.
             </div>
             <Link href="/register" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">View all feature comparisons <ArrowRight className="inline w-3 h-3" /></Link>
          </div>
        </main>
      </PageTransition>
      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        input[type="range"] {
          -webkit-appearance: none;
          height: 4px;
          border-radius: 4px;
          background: #f1f1f1;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
          cursor: pointer;
          border: 3px solid white;
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 14px rgba(139, 92, 246, 0.4);
        }
      `}} />
    </div>
  );
}

function PlanCard({ plan, index }: { plan: typeof PLANS[0]; index: number }) {
  const [tierIdx, setTierIdx] = useState(0);
  const current = plan.tiers[tierIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex flex-col bg-white rounded-[32px] p-8 transition-all duration-300 border h-full ${
        plan.highlighted 
        ? "border-violet-300 shadow-2xl shadow-violet-100 ring-2 ring-violet-50 scale-[1.02] z-10" 
        : "border-gray-100 hover:border-violet-200"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-violet-200">
           Recommended
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-6 h-8">{plan.desc}</p>
        
        <div className="flex items-baseline gap-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={current.price}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-5xl font-bold text-gray-900"
            >
              ${current.price}
            </motion.span>
          </AnimatePresence>
          <span className="text-gray-400 text-xs font-semibold">/mo</span>
        </div>
      </div>

      <Link href="/register">
        <button className={`w-full py-4 rounded-2xl font-bold text-sm transition-all mb-8 active:scale-[0.98] ${
          plan.highlighted ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-xl shadow-violet-100' : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
        }`}>
          {plan.cta}
        </button>
      </Link>

      {/* ── Slider ── */}
      <div className="mb-10 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume adjustment</span>
          <span className="text-sm font-bold text-violet-600">{current.credits.toLocaleString()} <span className="text-[10px] text-gray-400">/mo</span></span>
        </div>
        <input
          type="range"
          min="0"
          max={plan.tiers.length - 1}
          step="1"
          value={tierIdx}
          onChange={(e) => setTierIdx(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex-1 space-y-4">
        {plan.features.map(f => (
          <div key={f} className="flex items-start gap-3">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-green-500" />
            </div>
            <span className="text-xs font-medium text-gray-600">{f}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

