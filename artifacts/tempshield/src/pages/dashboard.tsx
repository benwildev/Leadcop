import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetDashboard,
  useRegenerateApiKey,
  type DashboardDataWithPlanConfig,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar, type DashboardTab } from "@/components/DashboardSidebar";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import OverviewTab from "./dashboard/tabs/OverviewTab";
import AnalyticsTab from "./dashboard/tabs/AnalyticsTab";
import AuditLogTab from "./dashboard/tabs/AuditLogTab";
import ApiKeysTab from "./dashboard/tabs/ApiKeysTab";
import WebhooksTab from "./dashboard/tabs/WebhooksTab";
import BlocklistTab from "./dashboard/tabs/BlocklistTab";
import SettingsTab from "./dashboard/tabs/SettingsTab";
import BillingTab from "./dashboard/tabs/BillingTab";
import BulkTab from "./dashboard/tabs/BulkTab";
import { TeamTab } from "./dashboard/tabs/TeamTab";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: rawData, isLoading } = useGetDashboard();
  const data = rawData as DashboardDataWithPlanConfig | undefined;
  const regenKeyMutation = useRegenerateApiKey();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const hash = window.location.hash.replace("#", "") as DashboardTab;
    const valid: DashboardTab[] = ["overview","analytics","keys","webhooks","blocklist","team","bulk","audit","billing","settings"];
    return valid.includes(hash) ? hash : "overview";
  });

  if (!user) return null;

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (confirm("Are you sure? Your old API key will stop working immediately.")) {
      await regenKeyMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: [`/api/user/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/auth/me`] });
    }
  };

  const usagePct = data
    ? Math.min(100, (data.user.requestCount / data.user.requestLimit) * 100)
    : 0;

  const TAB_TITLES: Record<DashboardTab, string> = {
    overview: "Overview",
    analytics: "Analytics",
    keys: "API Keys",
    webhooks: "Webhooks",
    blocklist: "Blocklist",
    team: "Team",
    bulk: "Bulk Validation",
    audit: "Audit Log",
    billing: "Billing",
    settings: "Settings",
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        usagePct={usagePct}
        requestCount={data?.user.requestCount ?? 0}
        requestLimit={data?.user.requestLimit ?? 0}
        plan={data?.user.plan ?? "FREE"}
      />

      {/* Main content area — offset by sidebar width */}
      <main className="lg:pl-[260px] min-h-screen transition-all duration-200">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-20 lg:pt-8">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {TAB_TITLES[activeTab]}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {activeTab === "overview" && `Welcome back, ${user.name}`}
              {activeTab === "analytics" && "Monitor your API usage and validation insights"}
              {activeTab === "keys" && "Manage your API keys for authentication"}
              {activeTab === "webhooks" && "Configure webhook integrations"}
              {activeTab === "blocklist" && "Manage your custom domain blocklist"}
              {activeTab === "team" && "Manage team members and seats"}
              {activeTab === "bulk" && "Validate emails in bulk with CSV upload"}
              {activeTab === "audit" && "Review your API request history"}
              {activeTab === "billing" && "View billing history and invoices"}
              {activeTab === "settings" && "Configure your account preferences"}
            </p>
          </div>

          {/* Tab content with crossfade */}
          {isLoading ? (
            <DashboardSkeleton />
          ) : data ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === "overview" && (
                  <OverviewTab
                    data={data}
                    usagePct={usagePct}
                    copied={copied}
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                    regenPending={regenKeyMutation.isPending}
                  />
                )}
                {activeTab === "analytics" && <AnalyticsTab data={data} usagePct={usagePct} />}
                {activeTab === "keys" && (
                  <ApiKeysTab
                    plan={data.user.plan}
                    planConfig={data.planConfig}
                    apiKey={data.user.apiKey}
                    copied={copied}
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                    regenPending={regenKeyMutation.isPending}
                  />
                )}
                {activeTab === "webhooks" && <WebhooksTab plan={data.user.plan} planConfig={data.planConfig} />}
                {activeTab === "blocklist" && <BlocklistTab plan={data.user.plan} planConfig={data.planConfig} />}
                {activeTab === "team" && <TeamTab />}
                {activeTab === "bulk" && <BulkTab planConfig={data.planConfig} />}
                {activeTab === "audit" && <AuditLogTab />}
                {activeTab === "billing" && <BillingTab />}
                {activeTab === "settings" && (
                  <SettingsTab planConfig={data.planConfig} plan={data.user.plan} apiKey={data.user.apiKey} />
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </main>
    </div>
  );
}
