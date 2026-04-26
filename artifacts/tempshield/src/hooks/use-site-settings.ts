import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  globalMetaTitle: string;
  globalMetaDescription: string;
  footerText: string | null;
  updatedAt?: string;
}

export interface PageSeo {
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

const ALLOWED_SLUGS = new Set(["/", "/pricing", "/docs", "/login", "/signup"]);

const DEFAULTS: SiteSettings = {
  siteTitle: "LeadCop",
  tagline: "Block Fake Emails. Protect Your Platform.",
  logoUrl: null,
  faviconUrl: null,
  globalMetaTitle: "LeadCop | Stop Fake Signups and Disposable Emails",
  globalMetaDescription:
    "Protect your forms with real-time disposable email detection, typo correction, relay checks, and signup quality filtering.",
  footerText: null,
};

const PAGE_FALLBACKS: Record<
  string,
  {
    title: string;
    description: string;
    keywords?: string;
    type?: "website" | "article";
  }
> = {
  "/": {
    title: "LeadCop | Stop Fake Signups and Disposable Emails",
    description:
      "Block disposable emails, bot signups, relay inboxes, and low-quality leads before they reach your CRM or email platform.",
    keywords:
      "disposable email checker, fake signup protection, email verification, lead quality, spam signup prevention, relay email detection",
    type: "website",
  },
  "/pricing": {
    title: "LeadCop Pricing | Disposable Email Protection Plans",
    description:
      "Compare LeadCop plans for disposable email detection, lead filtering, and real-time signup protection.",
    keywords: "LeadCop pricing, email verification pricing, disposable email API pricing",
    type: "website",
  },
  "/docs": {
    title: "LeadCop Docs | Integration and API Reference",
    description:
      "Learn how to integrate LeadCop on websites, forms, WordPress, and custom apps with the API and frontend script.",
    keywords: "LeadCop docs, email verification API docs, signup form integration",
    type: "website",
  },
  "/login": {
    title: "Log In | LeadCop",
    description: "Access your LeadCop dashboard to monitor email checks, lead quality, and account settings.",
    type: "website",
  },
  "/signup": {
    title: "Create Your LeadCop Account",
    description: "Start using LeadCop to block fake emails and protect your signup forms in minutes.",
    type: "website",
  },
};

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
    queryFn: () => fetch("/api/site-settings").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  return data ?? DEFAULTS;
}

export function usePageSeo(slug: string): PageSeo | null {
  const enabled = ALLOWED_SLUGS.has(slug);
  const { data } = useQuery<PageSeo>({
    queryKey: [`/api/site-settings/page?slug=${slug}`],
    queryFn: () => fetch(`/api/site-settings/page?slug=${encodeURIComponent(slug)}`).then((r) => r.json()),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? null;
}

export function useApplyHeadMeta() {
  const settings = useSiteSettings();
  const [location] = useLocation();

  const pageSeo = usePageSeo(location);

  useEffect(() => {
    const fallback = PAGE_FALLBACKS[location];
    const title = pageSeo?.metaTitle || fallback?.title || settings.globalMetaTitle;
    const description =
      pageSeo?.metaDescription || fallback?.description || settings.globalMetaDescription;
    const keywords = pageSeo?.keywords ?? fallback?.keywords ?? null;
    const ogTitle = pageSeo?.ogTitle || title;
    const ogDescription = pageSeo?.ogDescription || description;
    const ogImage = pageSeo?.ogImage ?? null;
    const canonicalUrl = getCanonicalUrl(location);
    const ogType = fallback?.type || "website";

    document.title = title;

    setMeta("name", "description", description);
    setMeta("name", "robots", "index,follow");
    setMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", ogTitle);
    setMeta("name", "twitter:description", ogDescription);

    if (keywords) {
      setMeta("name", "keywords", keywords);
    } else {
      removeMeta("name", "keywords");
    }

    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDescription);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:site_name", settings.siteTitle);

    if (ogImage) {
      setMeta("property", "og:image", ogImage);
      setMeta("name", "twitter:image", ogImage);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }

    if (settings.faviconUrl) {
      setFavicon(settings.faviconUrl);
    }

    setCanonical(canonicalUrl);
  }, [settings, pageSeo, location]);
}

function getCanonicalUrl(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return new URL(pathname, window.location.origin).toString();
}

function setMeta(attr: "name" | "property", value: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(attr: "name" | "property", value: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (el) el.remove();
}

function setFavicon(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "icon";
    document.head.appendChild(el);
  }
  el.href = href;
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}
