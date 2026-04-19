import React, { useState, useRef } from "react";
import { useBranding } from "../../context/BrandingContext";
import {
  updateBranding,
  uploadBrandLogo,
  removeBrandLogo,
  uploadBrandFavicon,
  removeBrandFavicon,
} from "../../api/branding";

const PlatformBranding: React.FC = () => {
  const { brandName, resolvedLogoUrl, resolvedFaviconUrl, setBranding, refreshBranding } = useBranding();

  const [nameInput, setNameInput]   = useState(brandName);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [favUploading, setFavUploading] = useState(false);
  const [message, setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logoPreview, setLogoPreview]     = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const logoFileRef    = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  // ── Brand Name ────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      const updated = await updateBranding({ brand_name: nameInput.trim() });
      setBranding(updated.brand_name, updated.brand_logo_url, updated.brand_favicon_url);
      showMsg("success", "Brand name updated successfully.");
    } catch {
      showMsg("error", "Failed to update brand name.");
    } finally {
      setSaving(false);
    }
  };

  // ── Logo ──────────────────────────────────────────────────────────────────

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      await uploadBrandLogo(file);
      await refreshBranding();
      setLogoPreview(null);
      showMsg("success", "Logo uploaded successfully.");
    } catch {
      setLogoPreview(null);
      showMsg("error", "Failed to upload logo.");
    } finally {
      setUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setSaving(true);
    try {
      await removeBrandLogo();
      setBranding(brandName, null);
      showMsg("success", "Logo removed.");
    } catch {
      showMsg("error", "Failed to remove logo.");
    } finally {
      setSaving(false);
    }
  };

  // ── Favicon ───────────────────────────────────────────────────────────────

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFaviconPreview(reader.result as string);
    reader.readAsDataURL(file);
    setFavUploading(true);
    try {
      await uploadBrandFavicon(file);
      await refreshBranding();
      setFaviconPreview(null);
      showMsg("success", "Favicon uploaded. Browser tab will update shortly.");
    } catch {
      setFaviconPreview(null);
      showMsg("error", "Failed to upload favicon.");
    } finally {
      setFavUploading(false);
      if (faviconFileRef.current) faviconFileRef.current.value = "";
    }
  };

  const handleRemoveFavicon = async () => {
    setSaving(true);
    try {
      await removeBrandFavicon();
      await refreshBranding();
      showMsg("success", "Favicon removed. Default favicon restored.");
    } catch {
      showMsg("error", "Failed to remove favicon.");
    } finally {
      setSaving(false);
    }
  };

  const displayLogo    = logoPreview    || resolvedLogoUrl;
  const displayFavicon = faviconPreview || resolvedFaviconUrl;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branding</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Set the name, logo, and favicon that appear across the entire platform.
        </p>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* ── Live Preview ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Preview</p>
        <div className="flex items-center gap-4">
          {/* Header preview */}
          <div className="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
            {displayLogo ? (
              <img src={displayLogo} alt="Brand logo" className="w-7 h-7 rounded object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <span className="text-[18px] font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              {nameInput || "SoftDesk"}
            </span>
          </div>

          {/* Browser tab preview */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-slate-400">Tab icon</p>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-t-lg px-3 py-1.5 border border-b-0 border-slate-300 dark:border-slate-600 w-36">
              {displayFavicon ? (
                <img src={displayFavicon} alt="Favicon" className="w-4 h-4 object-contain flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex-shrink-0" />
              )}
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                {nameInput || "SoftDesk"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brand Name ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-4 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Brand Name</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            maxLength={60}
            className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g. SoftDesk"
          />
          <button
            onClick={handleSaveName}
            disabled={saving || !nameInput.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">Shown in the sidebar and header across all dashboards.</p>
      </div>

      {/* ── Brand Logo ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-4 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Brand Logo</label>

        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-700">
            {displayLogo ? (
              <img src={displayLogo} alt="Logo preview" className="w-full h-full object-contain p-1" />
            ) : (
              <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
              uploading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Logo
                </>
              )}
              <input
                ref={logoFileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {resolvedLogoUrl && (
              <button
                onClick={handleRemoveLogo}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove Logo
              </button>
            )}

            <p className="text-xs text-slate-400">PNG, JPG, WEBP, SVG. Recommended: 64×64px or square.</p>
          </div>
        </div>
      </div>

      {/* ── Favicon ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Favicon</label>
            <p className="text-xs text-slate-400 mt-0.5">The small icon shown in the browser tab.</p>
          </div>
          {resolvedFaviconUrl && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Active
            </span>
          )}
        </div>

        <div className="flex items-start gap-4">
          {/* Favicon preview — mimics a browser tab */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-700">
              {displayFavicon ? (
                <img src={displayFavicon} alt="Favicon preview" className="w-10 h-10 object-contain" />
              ) : (
                <svg className="w-7 h-7 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-slate-400">16×16 preview</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
              favUploading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
              {favUploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Favicon
                </>
              )}
              <input
                ref={faviconFileRef}
                type="file"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/jpeg"
                onChange={handleFaviconChange}
                disabled={favUploading}
                className="hidden"
              />
            </label>

            {resolvedFaviconUrl && (
              <button
                onClick={handleRemoveFavicon}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove Favicon
              </button>
            )}

            <p className="text-xs text-slate-400">PNG, SVG, ICO. Recommended: 32×32px. Updates the browser tab instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformBranding;
