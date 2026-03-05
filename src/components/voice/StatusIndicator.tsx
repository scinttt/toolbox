"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { VoiceAppState } from "./AudioRecorder";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface StatusIndicatorProps {
  appState: VoiceAppState;
  analyserNode: AnalyserNode | null;
  elapsedSeconds: number;
}

export default function StatusIndicator({
  appState,
  analyserNode,
  elapsedSeconds,
}: StatusIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (appState !== "recording" || !analyserNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 48;
      const barWidth = Math.floor(canvas.width / barCount) - 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(4, value * canvas.height * 0.85);
        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        const alpha = 0.45 + value * 0.55;
        ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [appState, analyserNode]);

  if (appState === "recording") {
    return (
      <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
        <canvas
          ref={canvasRef}
          width={360}
          height={48}
          className="rounded-md flex-1 max-w-sm"
        />
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {formatTime(elapsedSeconds)}
        </span>
      </div>
    );
  }

  if (appState === "transcribing" || appState === "formatting") {
    const stepLabel =
      appState === "transcribing"
        ? "Transcribing audio..."
        : "Formatting text...";
    return (
      <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {stepLabel}
        </span>
      </div>
    );
  }

  return null;
}
