"use client";

import { Copy, Check, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VoiceAppState =
  | "idle"
  | "recording"
  | "transcribing"
  | "formatting"
  | "done"
  | "error";

interface AudioRecorderProps {
  appState: VoiceAppState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCopy: () => void;
  copied: boolean;
  canCopy: boolean;
}

export default function AudioRecorder({
  appState,
  onStartRecording,
  onStopRecording,
  onCopy,
  copied,
  canCopy,
}: AudioRecorderProps) {
  const isProcessing = appState === "transcribing" || appState === "formatting";
  const isRecording = appState === "recording";
  const isIdle =
    appState === "idle" || appState === "error" || appState === "done";

  return (
    <div className="flex items-center justify-center gap-4 py-3 shrink-0">
      {/* Record / Stop button — classic red circle */}
      {isIdle && (
        <button
          onClick={onStartRecording}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center"
          aria-label="Start recording"
          title="Start recording"
        >
          {/* Inner red dot */}
          <span className="block w-6 h-6 rounded-full bg-white" />
        </button>
      )}

      {isRecording && (
        <button
          onClick={onStopRecording}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center animate-pulse"
          aria-label="Stop recording"
          title="Stop recording"
        >
          {/* Stop square */}
          <Square className="h-6 w-6 text-white fill-white" />
        </button>
      )}

      {isProcessing && (
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}

      {/* Copy button */}
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onCopy}
        disabled={!canCopy}
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
  );
}
