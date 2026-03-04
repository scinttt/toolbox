import { NextRequest, NextResponse } from "next/server";
import { lookupWord } from "@/lib/dictionary";
import { detectInputType } from "@/lib/detect";
import { isAppError } from "@/lib/errors";
import type { DictionaryErrorResponse, DictionaryResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, targetLang } = body;

    // Validate targetLang
    if (targetLang !== "zh" && targetLang !== "en") {
      return NextResponse.json(
        { error: "targetLang must be 'zh' or 'en'", code: "INVALID_WORD" } satisfies DictionaryErrorResponse,
        { status: 400 }
      );
    }

    // Validate word
    if (typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json(
        { error: "Word must be a non-empty string", code: "INVALID_WORD" } satisfies DictionaryErrorResponse,
        { status: 400 }
      );
    }

    const trimmedWord = word.trim();

    // Verify it's actually a single word
    if (detectInputType(trimmedWord) !== "word") {
      return NextResponse.json(
        { error: "Input is not a single word", code: "INVALID_WORD" } satisfies DictionaryErrorResponse,
        { status: 400 }
      );
    }

    const result: DictionaryResponse = await lookupWord(trimmedWord, targetLang);

    return NextResponse.json(result);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        {
          error: "Dictionary service unavailable, please try again",
          code: "UPSTREAM_ERROR",
        } satisfies DictionaryErrorResponse,
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } satisfies DictionaryErrorResponse,
      { status: 500 }
    );
  }
}
