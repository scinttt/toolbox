"use client";

import type { DictionaryResponse } from "@/types";
import DictionaryCard from "./DictionaryCard";

interface OutputPanelProps {
  mode: "idle" | "loading" | "translation" | "dictionary" | "error";
  translation?: string;
  dictionaryData?: DictionaryResponse;
  errorMessage?: string;
  onRetry?: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  storageAvailable: boolean;
}

export default function OutputPanel({
  mode,
  translation,
  dictionaryData,
  errorMessage,
  onRetry,
  isSaved,
  onToggleSave,
  storageAvailable,
}: OutputPanelProps) {
  if (mode === "idle") {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xl">
        Translation will appear here
      </div>
    );
  }

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Processing...
        </div>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-destructive text-sm">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary underline hover:no-underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (mode === "dictionary" && dictionaryData) {
    return (
      <div className="p-1 overflow-y-auto h-full">
        <DictionaryCard
          data={dictionaryData}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          storageAvailable={storageAvailable}
        />
      </div>
    );
  }

  if (mode === "translation" && translation) {
    return (
      <div className="p-1 overflow-y-auto h-full">
        <p className="text-xl leading-relaxed whitespace-pre-wrap">
          {translation}
        </p>
      </div>
    );
  }

  return null;
}
