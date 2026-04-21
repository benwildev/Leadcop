import React from "react";
import { Check, XCircle, AlertCircle, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type ValidationStatus = "success" | "warning" | "error";

export interface VisualFeatureCardProps {
  email: string;
  status: ValidationStatus;
  logicLabel: string;
  actionLabel: string;
  actionColor: "green" | "yellow" | "red";
  title: string;
  description: string;
  className?: string;
  icon?: LucideIcon;
}

const statusConfig = {
  success: {
    icon: Check,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  error: {
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
};

const actionColorConfig = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  yellow: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function VisualFeatureCard({
  email,
  status,
  logicLabel,
  actionLabel,
  actionColor,
  title,
  description,
  className = "",
  icon: Icon,
}: VisualFeatureCardProps) {
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <div
      className={`relative group flex flex-col rounded-3xl border border-slate-100 bg-white p-8 transition-colors duration-300 hover:border-primary/20 hover:bg-slate-50/30 ${className}`}
    >
      {/* Mock UI Section - Flattened */}
      <div className="relative mb-8 min-h-[120px] flex flex-col items-center justify-center p-2">
        
        {/* Browser-style Input Mockup */}
        <div className={`relative flex w-full items-center gap-3 rounded-xl border bg-slate-50/50 px-4 py-3 transition-all ${cfg.border} group-hover:bg-white`}>
          <div className="flex gap-1 mr-2 opacity-40">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </div>
          <span className="flex-1 truncate font-mono text-[10px] font-medium text-slate-400">{email}</span>
          <div className={`flex h-5 w-5 items-center justify-center rounded-full ${cfg.bg}`}>
            <StatusIcon className={`h-3 w-3 ${cfg.color}`} />
          </div>
        </div>

        {/* Static Path Section */}
        <div className="relative h-16 w-full flex flex-col items-center">
          <div className="absolute top-0 bottom-0 w-px border-l-[1.5px] border-dashed border-slate-200" />
          
          {/* Logic Pill */}
          <div className="relative mt-4">
            <div className="rounded-lg border border-slate-100 bg-white px-3 py-1 font-mono text-[10px] font-bold text-slate-500">
              {logicLabel}
            </div>
          </div>

          {/* Result Pill */}
          <div className="mt-6">
            <div
              className={`rounded-lg border px-4 py-1.5 font-heading text-[10px] font-bold uppercase tracking-wider ${actionColorConfig[actionColor]}`}
            >
              {actionLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-auto">
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
          <h3 className="font-heading text-base font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  );
}
