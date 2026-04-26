import React, { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";

/** Inject Cloudinary resize transforms into a Cloudinary URL */
function cloudinaryResize(url: string, width: number, height: number): string {
  if (!url?.includes("res.cloudinary.com")) return url;
  // Insert transform params after "/upload/"
  return url.replace(
    /\/upload\//,
    `/upload/w_${width},h_${height},c_fit,f_webp,q_auto/`
  );
}
import {
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/pages/Logo";

function useTheme() {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("leadcop-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("leadcop-theme", "light");
    }
  };

  return { isDark, toggle };
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    if (location === "/") {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200 bg-[rgba(250,250,249,0.92)] backdrop-blur"
          : "border-transparent bg-white"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          <Logo size={34} />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
          <button
            onClick={() => scrollTo("features")}
            className="transition hover:text-slate-900"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo("pricing")}
            className="transition hover:text-slate-900"
          >
            Pricing
          </button>
          <Link href="/docs" className="transition hover:text-slate-900">
            API Docs
          </Link>
          <Link href="/blog" className="transition hover:text-slate-900">
            Blog
          </Link>
          {user && (
            <Link href="/dashboard" className="transition hover:text-slate-900 flex items-center gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="transition hover:text-slate-900 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:text-slate-900 hover:border-slate-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:block text-sm text-slate-500 transition hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Start free
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white"
          >
            <div className="px-6 py-5 flex flex-col gap-4 text-sm text-slate-500">
              <button onClick={() => { scrollTo("features"); setMobileOpen(false); }} className="text-left transition hover:text-slate-900">Features</button>
              <button onClick={() => { scrollTo("pricing"); setMobileOpen(false); }} className="text-left transition hover:text-slate-900">Pricing</button>
              <Link href="/docs" onClick={() => setMobileOpen(false)} className="transition hover:text-slate-900">API Docs</Link>
              <Link href="/blog" onClick={() => setMobileOpen(false)} className="transition hover:text-slate-900">Blog</Link>
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="transition hover:text-slate-900">Dashboard</Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="transition hover:text-slate-900">Admin</Link>
                  )}
                  <button onClick={logout} className="text-left text-red-500 hover:text-red-700 transition">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="transition hover:text-slate-900">Log in</Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="font-medium text-slate-900">Start free →</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function Footer() {
  const siteSettings = useSiteSettings();
  return (
    <footer className="border-t border-border/50 py-10 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center transition-opacity hover:opacity-80">
            <Logo size={34} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/docs"
              className="transition-colors hover:text-foreground"
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              className="transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="transition-colors hover:text-foreground"
            >
              Blog
            </Link>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-xs text-muted-foreground">
          {siteSettings.footerText ? (
            siteSettings.footerText
          ) : (
            <>
              Built for developers, by developers. &copy;{" "}
              {new Date().getFullYear()} {siteSettings.siteTitle}.
            </>
          )}
        </p>
      </div>
    </footer>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen pt-20 pb-12 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
