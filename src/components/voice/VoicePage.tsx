"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  transcribeAudio,
  cleanupTranscript,
} from "@/services/transcriptionApiClient";
import AudioRecorder from "./AudioRecorder";
import type { VoiceAppState } from "./AudioRecorder";
import StatusIndicator from "./StatusIndicator";

type OutputMode = "article" | "prompt";

export default function VoicePage() {
  const [appState, setAppState] = useState<VoiceAppState>("idle");
  const [outputMode, setOutputMode] = useState<OutputMode>("prompt");
  const [cleanedText, setCleanedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const {
    elapsedSeconds,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecorder,
  } = useAudioRecorder();

  // Clean up mic/audio resources + timers on unmount (tab switch)
  useEffect(() => {
    return () => {
      resetRecorder();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [resetRecorder]);

  const handleStartRecording = async () => {
    resetRecorder();
    setCleanedText("");
    setErrorMessage("");
    try {
      await startRecording();
      setAppState("recording");
    } catch (error) {
      const err = error as DOMException;
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError";
      const isNotFound =
        err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError";
      if (isNotFound) {
        setErrorMessage(
          "No microphone found. Please connect a microphone and try again."
        );
      } else if (isDenied) {
        setErrorMessage(
          "Microphone access denied. Go to System Settings > Privacy & Security > Microphone and enable access for your browser."
        );
      } else {
        setErrorMessage(
          "Could not access microphone. Please check your browser permissions and try again."
        );
      }
      setAppState("error");
    }
  };

  const handleStopAndProcess = async () => {
    setAppState("transcribing");

    try {
      const audioBlob = await stopRecording();

      if (!audioBlob || audioBlob.size < 1000) {
        throw new Error("Recording too short or empty. Please try again.");
      }

      const rawText = await transcribeAudio(audioBlob);

      setAppState("formatting");
      const formattedText = await cleanupTranscript(rawText, outputMode);
      setCleanedText(formattedText);

      setAppState("done");
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setErrorMessage(msg);
      setAppState("error");
    }
  };

  const handleCopy = async () => {
    if (!cleanedText) return;
    try {
      await navigator.clipboard.writeText(cleanedText);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const showModeToggle = appState === "idle" || appState === "done";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar — mode toggle only */}
      <div className="flex items-center px-6 py-2 shrink-0">
        {showModeToggle && (
          <div className="flex bg-muted rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setOutputMode("prompt")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                outputMode === "prompt"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              AI Prompt
            </button>
            <button
              onClick={() => setOutputMode("article")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                outputMode === "article"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Article
            </button>
          </div>
        )}
      </div>

      {/* Main content — fills remaining viewport */}
      <main className="flex-1 min-h-0 px-6 pb-4 flex flex-col">
        <div className="flex-1 min-h-0 border rounded-lg p-4 flex flex-col">
          {/* Status: waveform / spinner */}
          <StatusIndicator
            appState={appState}
            analyserNode={analyserNode}
            elapsedSeconds={elapsedSeconds}
          />

          {/* Error message */}
          {appState === "error" && errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-destructive text-sm text-center">
              {errorMessage}
            </div>
          )}

          {/* Textarea — fills all remaining space */}
          <textarea
            value={cleanedText}
            onChange={(e) => setCleanedText(e.target.value)}
            className="flex-1 min-h-0 w-full p-0 text-xl leading-relaxed text-foreground resize-none font-[inherit] outline-none bg-transparent placeholder:text-muted-foreground"
            placeholder="Transcription will appear here..."
            spellCheck={false}
          />
        </div>

        {/* Record + Copy — centered below content */}
        <AudioRecorder
          appState={appState}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopAndProcess}
          onCopy={handleCopy}
          copied={copied}
          canCopy={!!cleanedText}
        />
      </main>
    </div>
  );
}
