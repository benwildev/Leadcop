import React, { useState } from "react";
import { LayoutDashboard, Shield, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { AdminSidebar, NAV_GROUPS, type Section } from "./admin/AdminSidebar";

import { OverviewSection } from "./admin/sections/OverviewSection";
import { UsersSection } from "./admin/sections/UsersSection";
import { SubscriptionsSection } from "./admin/sections/SubscriptionsSection";
import { RevenueSection } from "./admin/sections/RevenueSection";
import { PlanConfigSection } from "./admin/sections/PlanConfigSection";
import { ApiKeysSection } from "./admin/sections/ApiKeysSection";
import { DomainsSection } from "./admin/sections/DomainsSection";
import { PaymentSection } from "./admin/sections/PaymentSection";
import { EmailSection } from "./admin/sections/EmailSection";
import { BrandingSection } from "./admin/sections/BrandingSection";
import { SeoSection } from "./admin/sections/SeoSection";
import { SupportSection } from "./admin/sections/SupportSection";
import { BlogAdminSection } from "./admin/sections/BlogAdminSection";
import { NewsletterAdminSection } from "./admin/sections/NewsletterAdminSection";

const SECTION_COMPONENTS: Record<Section, React.ReactNode> = {
  overview: <OverviewSection />,
  users: <UsersSection />,
  subscriptions: <SubscriptionsSection />,
  revenue: <RevenueSection />,
  "plan-config": <PlanConfigSection />,
  "api-keys": <ApiKeysSection />,
  domains: <DomainsSection />,
  payment: <PaymentSection />,
  email: <EmailSection />,
  branding: <BrandingSection />,
  seo: <SeoSection />,
  support: <SupportSection />,
  blog: <BlogAdminSection />,
  newsletter: <NewsletterAdminSection />,
};

export default function AdminPage() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || user.role !== "ADMIN") return null;

  const allNavItems = NAV_GROUPS.flatMap((g) => g.items);
  const currentItem = allNavItems.find((i) => i.id === section);
  const CurrentIcon = currentItem?.icon ?? LayoutDashboard;
  const currentLabel = currentItem?.label ?? "Admin";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar
        active={section}
        onNav={setSection}
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CurrentIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-heading text-base font-semibold text-foreground truncate">{currentLabel}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className={`${collapsed ? "max-w-7xl" : "max-w-5xl"} mx-auto px-4 sm:px-6 py-6 sm:py-8 transition-all duration-300`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {SECTION_COMPONENTS[section]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
