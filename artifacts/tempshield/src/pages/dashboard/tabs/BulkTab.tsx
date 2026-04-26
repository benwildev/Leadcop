import React, { useState, useCallback, useRef } from "react";
import {
  FileSpreadsheet, Upload, Clipboard, Loader2, Download,
  CheckCircle2, AlertTriangle, Clock, ArrowUpRight, X, Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";

interface BulkJob {
  id: number;
  status: string;
  totalEmails: number;
  processedCount: number;
  disposableCount: number;
  safeCount: number;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

interface BulkJobResult {
  email: string;
  domain: string;
  isDisposable: boolean;
  reputationScore: number;
  riskLevel: string;
  isFreeEmail: boolean;
  isRoleAccount: boolean;
  mxValid: boolean | null;
  tags: string[];
  error?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: Clock },
  processing: { bg: "bg-blue-500/10", text: "text-blue-400", icon: Loader2 },
  done: { bg: "bg-green-500/10", text: "text-green-400", icon: CheckCircle2 },
  failed: { bg: "bg-red-500/10", text: "text-red-400", icon: AlertTriangle },
};

import type { DashboardPlanConfig } from "@workspace/api-client-react";

export default function BulkTab({ planConfig }: { planConfig: DashboardPlanConfig }) {
  const [emails, setEmails] = useState("");
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeJobResults, setActiveJobResults] = useState<BulkJobResult[]>([]);
  const [resultFilter, setResultFilter] = useState<"all" | "disposable" | "safe">("all");
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  // Plan gate
  const hasBulk = planConfig.hasBulkValidation;
  const bulkLimit = planConfig.bulkEmailLimit; // -1 = unlimited, 0 = disabled, N = max per job

  // Fetch jobs on mount
  React.useEffect(() => {
    if (!hasBulk) return;
    setLoading(true);
    fetch("/api/bulk-jobs", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [hasBulk]);

  // Poll active job
  const startPolling = useCallback((jobId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/bulk-jobs/${jobId}`, { credentials: "include" });
        const job = await r.json();
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...job } : j));
        if (job.status === "done" || job.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setActiveJobResults(job.results ?? []);
        }
      } catch { /* ignore */ }
    }, 2000);
  }, []);

  React.useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleSubmit = async () => {
    setError("");
    const emailList = emails
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@"));

    if (emailList.length === 0) {
      setError("Please enter at least one valid email address.");
      return;
    }
    const maxEmails = bulkLimit === -1 ? Infinity : bulkLimit;
    if (emailList.length > maxEmails) {
      setError(`Your plan allows up to ${maxEmails.toLocaleString()} emails per batch.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bulk-jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create job");
        setSubmitting(false);
        return;
      }
      const newJob: BulkJob = {
        id: data.jobId,
        status: "pending",
        totalEmails: data.totalEmails,
        processedCount: 0,
        disposableCount: 0,
        safeCount: 0,
        createdAt: new Date().toISOString(),
      };
      setJobs(prev => [newJob, ...prev]);
      setEmails("");
      setActiveJobId(data.jobId);
      startPolling(data.jobId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setEmails(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
      handleFile(file);
    }
  }, []);

  const viewJob = async (jobId: number) => {
    setActiveJobId(jobId);
    setActiveJobResults([]);
    try {
      const r = await fetch(`/api/bulk-jobs/${jobId}`, { credentials: "include" });
      const job = await r.json();
      setActiveJobResults(job.results ?? []);
      if (job.status === "pending" || job.status === "processing") {
        startPolling(jobId);
      }
    } catch { /* ignore */ }
  };

  const filteredResults = activeJobResults.filter(r => {
    if (resultFilter === "disposable") return r.isDisposable;
    if (resultFilter === "safe") return !r.isDisposable && !r.error;
    return true;
  });

  // Gate
  if (!hasBulk) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">Bulk Email Validation</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Verify up to 1,000 emails at once with CSV upload or paste. Detect disposable, role, and free email addresses in bulk. Available on PRO and above.
        </p>
        <Link href="/upgrade" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Upgrade to PRO <ArrowUpRight className="h-4 w-4" />
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input area */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">New Bulk Validation</h2>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          }`}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="flex flex-col items-center gap-2 py-8">
            <Upload className={`h-8 w-8 ${dragActive ? "text-primary" : "text-muted-foreground"} transition-colors`} />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Drop a CSV file</span> or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              One email per line{bulkLimit > 0 ? `, max ${bulkLimit.toLocaleString()}` : bulkLimit === -1 ? ", unlimited" : ""}
            </p>
          </div>
        </div>

        {/* Or paste */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">or paste emails</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder={"user@example.com\ntest@tempmail.io\njohn@gmail.com"}
          rows={5}
          className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
        />

        {error && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            {emails.split(/[\n,;]+/).filter(e => e.trim().includes("@")).length} email(s) detected
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || !emails.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {submitting ? "Submitting..." : "Start Validation"}
          </button>
        </div>
      </motion.div>

      {/* Active job results */}
      <AnimatePresence>
        {activeJobId && activeJobResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-foreground">Results — Job #{activeJobId}</h3>
              <div className="flex items-center gap-2">
                {/* Filter */}
                <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
                  {(["all", "disposable", "safe"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setResultFilter(f)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        resultFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "All" : f === "disposable" ? "Disposable" : "Safe"}
                    </button>
                  ))}
                </div>
                <a
                  href={`/api/bulk-jobs/${activeJobId}/download`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </a>
                <button onClick={() => { setActiveJobId(null); setActiveJobResults([]); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border">
                    {["Email", "Domain", "Disposable", "Free", "Role", "MX", "Score", "Risk"].map(h => (
                      <th key={h} className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.slice(0, 100).map((r, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-xs text-foreground/80 max-w-[200px] truncate">{r.email}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{r.domain}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${r.isDisposable ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-500"}`}>
                          {r.isDisposable ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{r.isFreeEmail ? "Yes" : "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{r.isRoleAccount ? "Yes" : "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{r.mxValid === null ? "—" : r.mxValid ? "✓" : "✕"}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-bold ${r.reputationScore >= 70 ? "text-green-500" : r.reputationScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                          {r.reputationScore}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground capitalize">{r.riskLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredResults.length > 100 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">Showing first 100 of {filteredResults.length} results. Download CSV for full data.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job history */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">Job History</h3>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No bulk jobs yet. Submit your first batch above.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => {
              const st = STATUS_STYLES[job.status] ?? STATUS_STYLES.pending;
              const StatusIcon = st.icon;
              const progress = job.totalEmails > 0 ? Math.round((job.processedCount / job.totalEmails) * 100) : 0;
              return (
                <button
                  key={job.id}
                  onClick={() => viewJob(job.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/30 ${
                    activeJobId === job.id ? "border-primary/30 bg-primary/5" : "border-border/50"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg ${st.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`h-4 w-4 ${st.text} ${job.status === "processing" ? "animate-spin" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Job #{job.id}</span>
                      <span className={`text-[10px] font-bold uppercase ${st.text}`}>{job.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {job.totalEmails} emails · {job.disposableCount} disposable · {job.safeCount} safe
                    </p>
                    {(job.status === "processing" || job.status === "pending") && (
                      <div className="h-1 w-full rounded-full bg-border mt-2 overflow-hidden">
                        <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(parseISO(job.createdAt), "MMM d, HH:mm")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
