import React from "react";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/pages/Logo";

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingScreen({ isLoading, message = "LeadCop is initializing..." }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#584d84]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative flex flex-col items-center">
            {/* Animated Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute -inset-8 border-[3px] border-transparent border-t-[#584d84] border-r-[#584d84]/20 rounded-full"
            />

            {/* Logo with pulse */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "easeInOut" 
              }}
              className="relative z-10"
            >
              <Logo size={48} />
            </motion.div>

            {/* Static Shield backup for visual weight if logo fails */}
            <div className="mt-12 text-center">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[15px] font-bold text-slate-800 dark:text-white tracking-tight"
              >
                {message}
              </motion.p>
              <div className="mt-3 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1, 
                      delay: i * 0.2,
                      ease: "easeInOut" 
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-[#584d84]"
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer Branding */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">
              Secure Email Validation
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LoadingWidget({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="h-8 w-8 border-2 border-[#584d84]/20 border-t-[#584d84] rounded-full"
      />
    </div>
  );
}
