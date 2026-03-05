"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Languages, Mic } from "lucide-react";

const TranslatorPage = lazy(
  () => import("@/components/translator/TranslatorPage")
);
const VoicePage = lazy(() => import("@/components/voice/VoicePage"));

type Tab = "translator" | "voice";

const STORAGE_KEY = "toolbox_active_tab";

export default function HomeTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("translator");

  // Restore tab from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Tab | null;
    if (saved === "translator" || saved === "voice") {
      setActiveTab(saved);
    }
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header with tab navigation */}
      <header className="border-b px-6 py-3 shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold">Toolbox</h1>
        <nav className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => switchTab("translator")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "translator"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Languages className="h-4 w-4" />
            Translator
          </button>
          <button
            onClick={() => switchTab("voice")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "voice"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="h-4 w-4" />
            Voice
          </button>
        </nav>
      </header>

      {/* Tab content */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        }
      >
        {activeTab === "translator" ? <TranslatorPage /> : <VoicePage />}
      </Suspense>
    </div>
  );
}
