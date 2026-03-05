"use client";

import { useState, useRef, useCallback } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  elapsedSeconds: number;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  resetRecorder: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  /** Release all hardware resources and null out refs. */
  const releaseResources = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop MediaRecorder if still active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Already stopped or in bad state — safe to ignore
      }
    }
    mediaRecorderRef.current = null;

    setAnalyserNode(null);
  }, []);

  const startRecording = useCallback(async () => {
    // Guard: prevent double-start
    if (mediaRecorderRef.current) {
      releaseResources();
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    mediaStreamRef.current = mediaStream;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    audioContextRef.current = audioContext;
    setAnalyserNode(analyser);

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType,
      audioBitsPerSecond: 32_000,
    });
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start(100);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setElapsedSeconds(0);

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [releaseResources]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Release hardware but keep recorder ref null'd
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          audioContextRef.current?.close();
          audioContextRef.current = null;
          mediaRecorderRef.current = null;
          setAnalyserNode(null);

          resolve(blob);
        },
        { once: true }
      );

      try {
        recorder.stop();
      } catch {
        // Already stopped
        resolve(null);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsRecording(false);
    });
  }, []);

  const resetRecorder = useCallback(() => {
    releaseResources();
    setElapsedSeconds(0);
    setIsRecording(false);
    audioChunksRef.current = [];
  }, [releaseResources]);

  return {
    isRecording,
    elapsedSeconds,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecorder,
  };
}
