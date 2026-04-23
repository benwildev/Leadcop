import React from "react";
import { Check, XCircle, AlertCircle, LucideIcon, Wifi, FileCode2, Ban } from "lucide-react";
import { motion } from "framer-motion";

export type VisualMode = "badge" | "stamp" | "pulse" | "snippet";

export interface VisualFeatureCardProps {
  mode: VisualMode;
  title: string;
  description: string;
  className?: string;
  icon?: LucideIcon;
  // Mode specific data
  email?: string;
  statusLabel?: string;
  statusType?: "success" | "warning" | "error";
  snippet?: { before: string; after: string };
}

export default function VisualFeatureCard({
  mode,
  title,
  description,
  className = "",
  icon: Icon,
  email,
  statusLabel,
  statusType = "success",
  snippet,
}: VisualFeatureCardProps) {
  
  const renderVisual = () => {
    switch (mode) {
      case "badge":
        return (
          <div className="flex w-full flex-col items-center gap-4">
             <div className="flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50/50 px-5 py-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-slate-500 tracking-tight">{email}</span>
             </div>
             <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase">
                {statusLabel || "Verified"}
             </div>
          </div>
        );
      case "stamp":
        return (
          <div className="flex flex-col items-center gap-2">
            <div className={`relative px-8 py-4 border-2 rounded-2xl transform -rotate-1 ${
              statusType === "error" ? "border-rose-200 bg-rose-50/30 text-rose-600" : "border-emerald-200 bg-emerald-50/30 text-emerald-600"
            }`}>
              <span className="font-heading text-xl font-black uppercase tracking-tighter opacity-80 italic">
                {statusLabel || "Blocked"}
              </span>
              <Ban className="absolute -top-3 -right-3 h-8 w-8 text-rose-500/20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{email}</p>
          </div>
        );
      case "pulse":
        return (
          <div className="relative flex items-center justify-center h-24 w-full">
            <div className="absolute h-16 w-16 rounded-full bg-primary/10 animate-ping" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white border border-primary/20 shadow-sm">
                <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              MX: Online
            </div>
          </div>
        );
      case "snippet":
        return (
          <div className="w-full bg-slate-900 rounded-2xl p-4 font-mono text-[10px] space-y-3 shadow-inner">
            <div className="space-y-1">
              <div className="text-slate-500 line-through opacity-50 px-2">{snippet?.before}</div>
              <div className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-bold">
                {snippet?.after}
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
               <FileCode2 className="h-3 w-3 text-slate-400" />
               <span className="text-slate-400">Fixed instantly</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative group flex flex-col rounded-3xl border border-slate-100 bg-white p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 ${className}`}
    >
      {/* Dynamic Visual Section */}
      <div className="mb-8 min-h-[140px] flex items-center justify-center p-2">
        {renderVisual()}
      </div>

      {/* Content Section */}
      <div className="mt-auto">
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h3 className="font-heading text-base font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  );
}
