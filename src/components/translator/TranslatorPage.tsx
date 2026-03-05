"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputPanel from "@/components/translator/InputPanel";
import OutputPanel from "@/components/translator/OutputPanel";
import TranslateButton from "@/components/translator/TranslateButton";
import LanguageSelector from "@/components/translator/LanguageSelector";
import SourceLanguageSelector from "@/components/translator/SourceLanguageSelector";
import VocabularyBook from "@/components/vocabulary/VocabularyBook";
import { detectInputType } from "@/lib/detect";
import {
  addWord,
  removeWord,
  hasWord,
  isStorageAvailable,
} from "@/lib/vocabulary";
import {
  MAX_INPUT_LENGTH,
  type TargetLang,
  type SourceLang,
  type DictionaryResponse,
  type TranslateResponse,
  type TranslateErrorResponse,
  type DictionaryErrorResponse,
} from "@/types";

type OutputMode = "idle" | "loading" | "translation" | "dictionary" | "error";

export default function TranslatorPage() {
  const [input, setInput] = useState("");
  const [targetLang, setTargetLang] = useState<TargetLang>("zh");
  const [sourceLang, setSourceLang] = useState<SourceLang>("en");
  const [outputMode, setOutputMode] = useState<OutputMode>("idle");
  const [translation, setTranslation] = useState<string>();
  const [dictionaryData, setDictionaryData] = useState<DictionaryResponse>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [vocabRefreshKey, setVocabRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const storageAvailable =
    typeof window !== "undefined" && isStorageAvailable();
  const trimmedInput = input.trim();
  const isEmpty = trimmedInput.length === 0;
  const isOverLimit = input.length > MAX_INPUT_LENGTH;
  const canTranslate = !isEmpty && !isOverLimit && !loading;

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    setOutputMode("idle");
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!canTranslate) return;

    // Abort any in-flight request
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestInput = trimmedInput;

    setLoading(true);
    setOutputMode("loading");
    setErrorMessage(undefined);

    const inputType = detectInputType(requestInput);

    try {
      if (inputType === "word") {
        const res = await fetch("/api/dictionary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: requestInput, targetLang }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        // Redirect to login on 401
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            (data as DictionaryErrorResponse).error || "Dictionary lookup failed"
          );
        }

        // Discard stale result if input changed during request
        if (controller.signal.aborted) return;

        setDictionaryData(data as DictionaryResponse);
        setOutputMode("dictionary");
      } else {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: requestInput, targetLang, sourceLang }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        // Redirect to login on 401
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            (data as TranslateErrorResponse).error || "Translation failed"
          );
        }

        // Discard stale result if input changed during request
        if (controller.signal.aborted) return;

        setTranslation((data as TranslateResponse).translation);
        setOutputMode("translation");
      }
    } catch (error) {
      // Silently ignore aborted requests
      if (controller.signal.aborted) return;

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      setErrorMessage(message);
      setOutputMode("error");
    } finally {
      // Only clear loading if this controller is still the active one
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [canTranslate, trimmedInput, targetLang, sourceLang]);

  const isSaved =
    dictionaryData && storageAvailable
      ? hasWord(dictionaryData.word)
      : false;

  const handleToggleSave = useCallback(() => {
    if (!dictionaryData || !storageAvailable) return;

    if (hasWord(dictionaryData.word)) {
      removeWord(dictionaryData.word);
    } else {
      const phonetic = dictionaryData.phonetics[0]?.text || undefined;
      const briefDef =
        dictionaryData.meanings[0]?.definitions[0]?.definition || "";
      addWord({
        word: dictionaryData.word,
        phonetic,
        briefDefinition: briefDef,
        savedAt: Date.now(),
      });
    }
    setVocabRefreshKey((k) => k + 1);
  }, [dictionaryData, storageAvailable]);

  const getOutputText = useCallback((): string => {
    if (outputMode === "translation" && translation) return translation;
    if (outputMode === "dictionary" && dictionaryData) {
      const lines: string[] = [dictionaryData.word];
      for (const p of dictionaryData.phonetics) {
        if (p.text) lines.push(p.text);
      }
      for (const m of dictionaryData.meanings) {
        lines.push(`\n${m.partOfSpeech}`);
        m.definitions.forEach((d, i) => {
          lines.push(`${i + 1}. ${d.definition}`);
          if (d.definitionSecondary) lines.push(`   → ${d.definitionSecondary}`);
          if (d.example) lines.push(`   e.g. "${d.example}"`);
        });
      }
      return lines.join("\n");
    }
    return "";
  }, [outputMode, translation, dictionaryData]);

  const handleCopy = useCallback(async () => {
    const text = getOutputText();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [getOutputText]);

  const hasOutput = outputMode === "translation" || outputMode === "dictionary";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <SourceLanguageSelector
            value={sourceLang}
            onChange={setSourceLang}
          />
          <span className="text-muted-foreground">→</span>
          <LanguageSelector
            value={targetLang}
            onChange={setTargetLang}
          />
          <TranslateButton
            onClick={handleTranslate}
            disabled={!canTranslate}
            loading={loading}
            onCancel={handleCancel}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handleCopy}
            disabled={!hasOutput}
            aria-label="Copy output"
            title="Copy output"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-0 px-6 pb-4 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-h-0 border rounded-lg p-4 flex flex-col">
            <InputPanel
              value={input}
              onChange={setInput}
              onSubmit={handleTranslate}
              loading={loading}
            />
          </div>
          <div className="flex-1 min-h-0 border rounded-lg p-4 overflow-y-auto">
            <OutputPanel
              mode={outputMode}
              translation={translation}
              dictionaryData={dictionaryData}
              errorMessage={errorMessage}
              onRetry={handleTranslate}
              isSaved={isSaved}
              onToggleSave={handleToggleSave}
              storageAvailable={storageAvailable}
            />
          </div>
        </div>
        <div className="mt-3 shrink-0">
          <VocabularyBook refreshKey={vocabRefreshKey} />
        </div>
      </main>
    </div>
  );
}
