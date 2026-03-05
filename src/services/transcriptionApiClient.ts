async function parseResponseBody(
  response: Response
): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  // Non-JSON error response — wrap raw text
  const text = await response.text();
  return { error: text || `Request failed (${response.status})` };
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(
      (data.error as string) || `Transcription failed (${response.status})`
    );
  }

  return data.rawTranscript as string;
}

export async function cleanupTranscript(
  rawTranscript: string,
  mode: "article" | "prompt"
): Promise<string> {
  const response = await fetch("/api/cleanup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawTranscript, mode }),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(
      (data.error as string) || `Cleanup failed (${response.status})`
    );
  }

  return data.cleanedText as string;
}
