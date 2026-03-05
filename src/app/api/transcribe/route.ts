import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_AUDIO_SIZE = 4 * 1024 * 1024; // 4MB (Vercel serverless body limit ~4.5MB)

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 30_000,
});

const EXTENSION_MAP: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as File | null;

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio file provided", code: "EMPTY_INPUT" },
        { status: 400 }
      );
    }

    if (audioBlob.size === 0) {
      return NextResponse.json(
        { error: "Audio file is empty", code: "EMPTY_INPUT" },
        { status: 400 }
      );
    }

    if (audioBlob.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: "Audio file exceeds 4MB limit", code: "INPUT_TOO_LONG" },
        { status: 400 }
      );
    }

    const mimeType = (audioBlob.type || "audio/webm").split(";")[0];
    const fileExtension = EXTENSION_MAP[mimeType] ?? "webm";

    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    const audioFile = await toFile(audioBuffer, `audio.${fileExtension}`, {
      type: mimeType,
    });

    const transcription = await openaiClient.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audioFile,
      prompt:
        "这是一段中英文混合的语音内容。The speaker may use Chinese, English, or switch between both.",
    });

    if (!transcription.text || transcription.text.trim() === "") {
      return NextResponse.json(
        { error: "No speech detected in the audio", code: "NO_SPEECH" },
        { status: 422 }
      );
    }

    return NextResponse.json({ rawTranscript: transcription.text });
  } catch (error) {
    console.error("[transcribe] error:", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json(
      { error: message, code: "UPSTREAM_ERROR" },
      { status: 502 }
    );
  }
}
