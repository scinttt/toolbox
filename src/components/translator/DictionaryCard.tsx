"use client";

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Star, Volume2 } from "lucide-react";
import { validateAudioUrl } from "@/lib/audio-url";
import type { DictionaryResponse } from "@/types";

interface DictionaryCardProps {
  data: DictionaryResponse;
  isSaved: boolean;
  onToggleSave: () => void;
  storageAvailable: boolean;
}

export default function DictionaryCard({
  data,
  isSaved,
  onToggleSave,
  storageAvailable,
}: DictionaryCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((url: string) => {
    const safeUrl = validateAudioUrl(url);
    if (!safeUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(safeUrl);
    audioRef.current.play().catch(() => {
      // Audio playback failed silently
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Word header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.word}</h2>
          {/* Phonetics */}
          <div className="flex flex-wrap gap-3 mt-1">
            {data.phonetics.map((p, i) => (
              <span
                key={i}
                className="flex items-center gap-1 text-sm text-muted-foreground"
              >
                {p.text && <span>{p.text}</span>}
                {p.audio && (
                  <button
                    onClick={() => playAudio(p.audio!)}
                    className="inline-flex items-center text-primary hover:text-primary/80"
                    aria-label={`Play pronunciation ${i + 1}`}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          onClick={onToggleSave}
          disabled={!storageAvailable}
          title={
            !storageAvailable
              ? "Storage unavailable"
              : isSaved
                ? "Remove from vocabulary"
                : "Save to vocabulary"
          }
        >
          <Star
            className={`h-4 w-4 mr-1 ${isSaved ? "fill-current" : ""}`}
          />
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Source indicator */}
      {data.source !== "dictionary_api" && (
        <div className="text-xs text-muted-foreground">
          {data.source === "llm"
            ? "Powered by AI"
            : "AI-generated (dictionary unavailable)"}
        </div>
      )}

      {/* Meanings */}
      <div className="space-y-4">
        {data.meanings.map((meaning, mi) => (
          <div key={mi}>
            <h3 className="text-sm font-semibold text-primary italic mb-2">
              {meaning.partOfSpeech}
            </h3>
            <ol className="space-y-3 list-decimal list-inside">
              {meaning.definitions.map((def, di) => (
                <li key={di} className="text-sm leading-relaxed">
                  <span>{def.definition}</span>
                  {def.definitionSecondary && (
                    <div className="ml-5 text-muted-foreground">
                      &rarr; {def.definitionSecondary}
                    </div>
                  )}
                  {def.example && (
                    <div className="ml-5 text-muted-foreground italic">
                      e.g. &quot;{def.example}&quot;
                    </div>
                  )}
                  {def.synonyms && def.synonyms.length > 0 && (
                    <div className="ml-5 text-xs text-muted-foreground">
                      synonyms: {def.synonyms.join(", ")}
                    </div>
                  )}
                  {def.antonyms && def.antonyms.length > 0 && (
                    <div className="ml-5 text-xs text-muted-foreground">
                      antonyms: {def.antonyms.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
