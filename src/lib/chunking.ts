// Split text into chunks at paragraph boundaries, falling back to sentence/hard cut
export function splitIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }

    let cutPoint = -1;

    // Try to cut at paragraph boundary (\n\n)
    const searchRange = remaining.slice(0, maxSize);
    const lastParagraph = searchRange.lastIndexOf("\n\n");
    if (lastParagraph > maxSize * 0.3) {
      cutPoint = lastParagraph + 2;
    }

    // Fallback: cut at last newline
    if (cutPoint === -1) {
      const lastNewline = searchRange.lastIndexOf("\n");
      if (lastNewline > maxSize * 0.3) {
        cutPoint = lastNewline + 1;
      }
    }

    // Fallback: cut at last sentence-ending punctuation
    if (cutPoint === -1) {
      const lastSentence = searchRange.search(/[.!?。！？]\s*(?=\S)[^]*$/);
      if (lastSentence > maxSize * 0.3) {
        const match = searchRange.slice(lastSentence).match(/^[.!?。！？]\s*/);
        cutPoint = lastSentence + (match ? match[0].length : 1);
      }
    }

    // Hard cut at maxSize
    if (cutPoint === -1) {
      cutPoint = maxSize;
    }

    chunks.push(remaining.slice(0, cutPoint).trim());
    remaining = remaining.slice(cutPoint).trim();
  }

  return chunks.filter((c) => c.length > 0);
}
