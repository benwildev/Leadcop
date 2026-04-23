import React from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Mail, 
  Globe, 
  UserCircle, 
  Sparkles, 
  UserCheck, 
  FileType 
} from "lucide-react";
import VisualFeatureCard, { type VisualMode } from "./VisualFeatureCard";

const FEATURES = [
  {
    mode: "stamp" as VisualMode,
    statusLabel: "Blocked",
    statusType: "error" as const,
    email: "john@tempmail.com",
    title: "Disposable Email Detection",
    description: "Identify and block 200,000+ burner email providers updated hourly with zero false positives.",
    icon: Shield,
    className: "lg:col-span-2",
  },
  {
    mode: "badge" as VisualMode,
    email: "jane@gmail.com",
    statusLabel: "B2B Flagged",
    statusType: "warning" as const,
    title: "Public Provider Filter",
    description: "Prioritize B2B leads by identifying generic Gmail, Yahoo, and Outlook signups.",
    icon: UserCheck,
  },
  {
    mode: "pulse" as VisualMode,
    title: "MX Records Validation",
    description: "Verify that the domain is configured to receive emails before you hit 'send'.",
    icon: Globe,
    className: "lg:col-span-2",
  },
  {
    mode: "snippet" as VisualMode,
    snippet: { 
      before: "jack@hotmai.com", 
      after: "jack@hotmail.com" 
    },
    title: "Smart Suggestions",
    description: "Intelligently fix typos at the source to prevent losing legitimate customers.",
    icon: Sparkles,
  },
  {
    mode: "badge" as VisualMode,
    email: "chookity-pok@passmail.net",
    statusLabel: "Relay Detected",
    statusType: "warning" as const,
    title: "Forwarding Detection",
    description: "Detect hidden relay services that mask real email addresses from your CRM.",
    icon: Mail,
  },
  {
    mode: "stamp" as VisualMode,
    statusLabel: "Role Flagged",
    statusType: "success" as const,
    email: "support@company.io",
    title: "Role Detection",
    description: "Identify support@, info@, and admin@ accounts to keep your segments precise.",
    icon: UserCircle,
    className: "lg:col-span-2",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
    },
  },
};

const item: any = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
};

export default function PremiumBentoGrid() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {FEATURES.map((feature, i) => (
        <motion.div key={i} variants={item} className={feature.className}>
          <VisualFeatureCard {...feature} className="h-full" />
        </motion.div>
      ))}
    </motion.div>
  );
}
