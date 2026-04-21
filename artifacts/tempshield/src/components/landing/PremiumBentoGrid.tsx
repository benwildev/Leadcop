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
import VisualFeatureCard, { type ValidationStatus } from "./VisualFeatureCard";

const FEATURES = [
  {
    email: "john@tempmail.com",
    status: "error" as ValidationStatus,
    logicLabel: '{"disposable": true}',
    actionLabel: "Block",
    actionColor: "red" as const,
    title: "Disposable Email Detection",
    description: "Identify and block 200,000+ burner email providers updated hourly with zero false positives.",
    icon: Shield,
    className: "lg:col-span-2",
  },
  {
    email: "chookity-pok@passmail.net",
    status: "warning" as ValidationStatus,
    logicLabel: '{"relay_domain": true}',
    actionLabel: "Ask for Real Mail",
    actionColor: "yellow" as const,
    title: "Forwarding Detection",
    description: "Detect hidden relay services that mask real email addresses from your CRM.",
    icon: Mail,
  },
  {
    email: "elon@spacex.com",
    status: "success" as ValidationStatus,
    logicLabel: '{"mx": true}',
    actionLabel: "Ok",
    actionColor: "green" as const,
    title: "MX Records Validation",
    description: "Verify that the domain is configured to receive emails before you hit 'send'.",
    icon: Globe,
  },
  {
    email: "jane@gmail.com",
    status: "warning" as ValidationStatus,
    logicLabel: '{"public_domain": true}',
    actionLabel: "Ask for Work Mail",
    actionColor: "yellow" as const,
    title: "Public Provider Filter",
    description: "Prioritize B2B leads by identifying generic Gmail, Yahoo, and Outlook signups.",
    icon: UserCheck,
    className: "lg:col-span-2",
  },
  {
    email: "jack@hotmai.com",
    status: "warning" as ValidationStatus,
    logicLabel: '{"did_you_mean": "hotmail.com"}',
    actionLabel: "Suggest Hack",
    actionColor: "yellow" as const,
    title: "Smart Suggestions",
    description: "Intelligently fix typos at the source to prevent losing legitimate customers.",
    icon: Sparkles,
  },
  {
    email: "dev@piedpiper.com",
    status: "success" as ValidationStatus,
    logicLabel: '{"role_account": true}',
    actionLabel: "Flag Role",
    actionColor: "green" as const,
    title: "Role Detection",
    description: "Identify support@, info@, and admin@ accounts to keep your segments precise.",
    icon: UserCircle,
  },
  {
    email: "hello@pantheon.m",
    status: "error" as ValidationStatus,
    logicLabel: '{"invalid_syntax": true}',
    actionLabel: "Invalid Syntax",
    actionColor: "red" as const,
    title: "Strict Syntax Validation",
    description: "Strict RFC validation ensuring only valid, deliverable email formats pass your forms.",
    icon: FileType,
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
