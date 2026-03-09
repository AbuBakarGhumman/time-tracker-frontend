import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeChoice = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "app-theme";

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: ThemeChoice) {
  const dark = theme === "dark" || (theme === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", dark);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    return stored ?? "light";
  });

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (getSystemDark() ? "dark" : "light") : theme;

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  // Apply on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Watch system preference changes when theme === "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
