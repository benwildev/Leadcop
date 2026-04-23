import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Check, Loader2 } from "lucide-react";

interface PlanAPIConfig {
  plan: string;
  price: number;
  requestLimit: number;
  mxDetectionEnabled: boolean;
  inboxCheckEnabled: boolean;
}

export function PricingSection() {
  const [plans, setPlans] = useState<PlanAPIConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/plans")
      .then(res => res.json())
      .then(data => {
        if (data.configs) setPlans(data.configs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center bg-white">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <section id="pricing" className="bg-white py-32 border-t border-gray-50">
      <div className="max-w-6xl mx-auto px-10">
        <div className="text-center mb-24">
          <h2 className="text-3x font-bold text-gray-900 tracking-tight mb-3">Pricing</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">Simple. Scalable. Transparent.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-16">
          {plans.map((cfg) => (
            <div key={cfg.plan} className="w-full md:w-[220px]">
              <PlanCard cfg={cfg} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ cfg }: { cfg: PlanAPIConfig }) {
  const getFeatures = (plan: string) => {
    if (plan === 'FREE') return ["1k monthly credits", "Standard speed", "Core filters"];
    if (plan === 'BASIC') return ["25k monthly credits", "5 req/second", "Advanced TLD filter"];
    if (plan === 'PRO') return ["250k monthly credits", "Bulk validation", "Custom blocklists"];
    return ["Unlimited credits", "Maximum speed", "Personal manager"];
  };

  const isPro = cfg.plan === 'PRO';
  const features = getFeatures(cfg.plan);

  return (
    <div className="flex flex-col h-full border-t border-gray-100 pt-10 text-center">
      <div className="mb-10">
        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-5">{cfg.plan}</div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">${cfg.price}</span>
          <span className="text-gray-400 text-xs font-medium">/mo</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 font-medium tracking-tight">
          {cfg.requestLimit.toLocaleString()} checks included
        </p>
      </div>

      <Link href="/register">
        <button className={`w-full py-4 rounded-lg font-black text-[9px] uppercase tracking-widest transition-none mb-12 ${
          isPro 
          ? 'bg-violet-600 text-white active:bg-violet-700' 
          : 'bg-black text-white active:bg-gray-800'
        }`}>
          {cfg.plan === 'FREE' ? 'Select Free' : 'Choose Plan'}
        </button>
      </Link>

      <div className="space-y-5">
        {features.map(f => (
          <div key={f} className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 leading-none">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
