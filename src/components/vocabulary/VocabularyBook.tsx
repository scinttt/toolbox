"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, X, ChevronDown, ChevronUp } from "lucide-react";
import { getVocabularyEntries, removeWord } from "@/lib/vocabulary";
import type { VocabularyEntry } from "@/types";

interface VocabularyBookProps {
  refreshKey: number;
}

export default function VocabularyBook({ refreshKey }: VocabularyBookProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);

  useEffect(() => {
    setEntries(getVocabularyEntries());
  }, [refreshKey, isOpen]);

  const handleRemove = (word: string) => {
    removeWord(word);
    setEntries(getVocabularyEntries());
  };

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Vocabulary Book ({entries.length})
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="border-t max-h-[300px] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No saved words yet. Save words from dictionary lookups.
            </p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li
                  key={entry.word}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{entry.word}</span>
                    {entry.phonetic && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {entry.phonetic}
                      </span>
                    )}
                    <p className="text-muted-foreground text-xs truncate">
                      {entry.briefDefinition}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 ml-2"
                    onClick={() => handleRemove(entry.word)}
                    aria-label={`Remove ${entry.word}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
