import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Loader2, Check } from "lucide-react";

interface PlanAPIConfig {
  plan: string;
  price: number;
  requestLimit: number;
  description: string | null;
  features: string[];
}

// LeadCop Brand Purple
const BRAND = "#584d84";

export function PricingSection() {
  const [plans, setPlans] = useState<PlanAPIConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/plans")
      .then(res => res.json())
      .then(data => {
        if (data.configs) {
          const order = ["FREE", "BASIC", "PRO", "MAX", "ENTERPRISE"];
          const sorted = data.configs.sort((a: any, b: any) => {
            const idxA = order.indexOf(a.plan);
            const idxB = order.indexOf(b.plan);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
          });
          setPlans(sorted);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center bg-white">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  return (
    <section id="pricing" className="bg-slate-50 py-28 border-y border-slate-100">
      {/* Header */}
      <div className="text-center mb-16 max-w-xl mx-auto px-6">
        <p className="text-[12px] font-bold tracking-[0.2em] uppercase mb-3 text-[#584d84]">
          Simple Pricing
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Scale as you grow.
        </h2>
        <p className="mt-5 text-lg text-slate-500">
          Transparent pricing for teams of all sizes.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl w-full mx-auto px-6">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${plans.length} gap-5`}>
          {plans.map((cfg) => {
            const isPro = cfg.plan === 'PRO';
            const isMax = cfg.plan === 'MAX';
            const isFree = cfg.plan === 'FREE';
            const isEnterprise = cfg.plan === 'ENTERPRISE';
            const highlighted = isPro || isMax;

            return (
              <div
                key={cfg.plan}
                className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-7 transition-shadow hover:shadow-md"
                style={highlighted ? {
                  borderColor: BRAND,
                  boxShadow: `0 0 0 1px ${BRAND}20`,
                } : {}}
              >
                {/* Popular badge */}
                {highlighted && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold uppercase tracking-[0.18em] px-3.5 py-1 rounded-full"
                    style={{ background: BRAND }}
                  >
                    Most Popular
                  </div>
                )}

                {/* Plan label */}
                <p
                  className="text-[10px] font-bold tracking-[0.28em] uppercase mb-5 text-slate-400"
                >
                  {isEnterprise ? "Custom" : cfg.plan.charAt(0) + cfg.plan.slice(1).toLowerCase()}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className="text-4xl font-bold tracking-tight text-slate-900"
                  >
                    {isEnterprise ? "Custom" : `$${cfg.price}`}
                  </span>
                  {!isEnterprise && (
                    <span className="text-sm text-slate-400">
                      /mo
                    </span>
                  )}
                </div>

                <p className="text-xs mb-7 text-slate-400">
                  {isFree ? `${cfg.requestLimit.toLocaleString()} checks/mo` : "Unlimited checks"}
                </p>

                {/* Features */}
                <ul className="space-y-3 flex-1 border-t border-slate-50 pt-6">
                  {cfg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        className="shrink-0 mt-0.5 text-[#584d84]"
                        size={14}
                        strokeWidth={3}
                      />
                      <span
                        className="text-[13px] font-medium text-slate-600"
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="mt-8">
                  {isEnterprise ? (
                    <a href="mailto:support@leadcop.io" className="block">
                      <button
                        className="w-full py-3 rounded-xl text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-200 active:scale-95 border hover:border-[#6C5DD3] hover:text-[#6C5DD3]"
                        style={{
                          background: "transparent",
                          color: "#0f172a",
                          borderColor: "#e2e8f0",
                        }}
                      >
                        Contact Sales
                      </button>
                    </a>
                  ) : (
                    <Link href="/signup" className="block">
                      <button
                        className="w-full py-3 rounded-xl text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-200 active:scale-95 hover:opacity-90"
                        style={highlighted ? {
                          background: BRAND,
                          color: "#fff",
                          boxShadow: `0 4px 14px 0 ${BRAND}45`,
                        } : {
                          background: "#0f172a",
                          color: "#fff",
                        }}
                      >
                        {isFree ? "Get Started" : "Buy Now"}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
