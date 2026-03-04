import { NextRequest, NextResponse } from "next/server";
import { translate } from "@/lib/deepseek";
import { translateWithDeepL } from "@/lib/deepl";
import { isAppError } from "@/lib/errors";
import { MAX_INPUT_LENGTH } from "@/types";
import type { SourceLang, TranslateErrorResponse, TranslateResponse } from "@/types";

// Allow up to 60s for long text chunked translation (Vercel Pro)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang, sourceLang } = body;

    // Validate targetLang
    if (targetLang !== "zh" && targetLang !== "en") {
      return NextResponse.json(
        { error: "targetLang must be 'zh' or 'en'", code: "INVALID_INPUT" } satisfies TranslateErrorResponse,
        { status: 400 }
      );
    }

    // Validate sourceLang
    const validSourceLangs: SourceLang[] = ["zh", "en", "mixed"];
    if (!validSourceLangs.includes(sourceLang)) {
      return NextResponse.json(
        { error: "sourceLang must be 'zh', 'en', or 'mixed'", code: "INVALID_INPUT" } satisfies TranslateErrorResponse,
        { status: 400 }
      );
    }

    // Validate text
    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text must be a non-empty string", code: "EMPTY_INPUT" } satisfies TranslateErrorResponse,
        { status: 400 }
      );
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
          code: "INPUT_TOO_LONG",
        } satisfies TranslateErrorResponse,
        { status: 400 }
      );
    }

    const trimmed = text.trim();

    // Route: pure zh/en → DeepL, mixed → DeepSeek LLM
    let translation: string;
    if (sourceLang === "mixed") {
      translation = await translate(trimmed, targetLang);
    } else {
      translation = await translateWithDeepL(trimmed, targetLang);
    }

    return NextResponse.json({ translation } satisfies TranslateResponse);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        {
          error: "Translation service unavailable, please try again",
          code: "UPSTREAM_ERROR",
        } satisfies TranslateErrorResponse,
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } satisfies TranslateErrorResponse,
      { status: 500 }
    );
  }
}
