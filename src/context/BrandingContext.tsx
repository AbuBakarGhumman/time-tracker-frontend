import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getBranding } from "../api/branding";
import { API_BASE_URL } from "../api/config";

interface BrandingContextType {
  brandName: string;
  brandLogoUrl: string | null;
  resolvedLogoUrl: string | null;
  brandFaviconUrl: string | null;
  resolvedFaviconUrl: string | null;
  refreshBranding: () => Promise<void>;
  setBranding: (name: string, logoUrl: string | null, faviconUrl?: string | null) => void;
}

const BrandingContext = createContext<BrandingContextType>({
  brandName: "SoftDesk",
  brandLogoUrl: null,
  resolvedLogoUrl: null,
  brandFaviconUrl: null,
  resolvedFaviconUrl: null,
  refreshBranding: async () => {},
  setBranding: () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandName, setBrandName]           = useState("SoftDesk");
  const [brandLogoUrl, setBrandLogoUrl]     = useState<string | null>(null);
  const [brandFaviconUrl, setBrandFaviconUrl] = useState<string | null>(null);

  const resolvedLogoUrl    = brandLogoUrl    ? `${API_BASE_URL}${brandLogoUrl}`    : null;
  const resolvedFaviconUrl = brandFaviconUrl ? `${API_BASE_URL}${brandFaviconUrl}` : null;

  // Dynamically update the browser tab favicon when it changes
  useEffect(() => {
    // Remove all existing icon links so the browser picks up the new one fresh
    document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach(el => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";

    if (resolvedFaviconUrl) {
      // Cache-bust so the browser actually fetches the new image
      link.href = `${resolvedFaviconUrl}?t=${Date.now()}`;
      link.type = resolvedFaviconUrl.match(/\.svg(\?|$)/i) ? "image/svg+xml" : "image/png";
    } else {
      link.href = `/favicon.png?t=${Date.now()}`;
      link.type = "image/png";
    }

    document.head.appendChild(link);
  }, [resolvedFaviconUrl]);

  const refreshBranding = useCallback(async () => {
    try {
      const data = await getBranding();
      setBrandName(data.brand_name || "SoftDesk");
      setBrandLogoUrl(data.brand_logo_url);
      setBrandFaviconUrl(data.brand_favicon_url ?? null);
    } catch {
      // Silently keep defaults
    }
  }, []);

  const setBranding = useCallback(
    (name: string, logoUrl: string | null, faviconUrl?: string | null) => {
      setBrandName(name || "SoftDesk");
      setBrandLogoUrl(logoUrl);
      if (faviconUrl !== undefined) setBrandFaviconUrl(faviconUrl);
    },
    []
  );

  useEffect(() => {
    refreshBranding();
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        brandName,
        brandLogoUrl,
        resolvedLogoUrl,
        brandFaviconUrl,
        resolvedFaviconUrl,
        refreshBranding,
        setBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
