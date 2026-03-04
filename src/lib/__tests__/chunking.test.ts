import { splitIntoChunks } from "@/lib/chunking";

describe("splitIntoChunks", () => {
  test("returns single chunk for short text", () => {
    const chunks = splitIntoChunks("hello world", 3000);
    expect(chunks).toEqual(["hello world"]);
  });

  test("splits at paragraph boundary", () => {
    const text = "a".repeat(2000) + "\n\n" + "b".repeat(2000);
    const chunks = splitIntoChunks(text, 3000);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe("a".repeat(2000));
    expect(chunks[1]).toBe("b".repeat(2000));
  });

  test("splits at newline when no paragraph break", () => {
    const text = "a".repeat(2000) + "\n" + "b".repeat(2000);
    const chunks = splitIntoChunks(text, 3000);
    expect(chunks.length).toBe(2);
  });

  test("splits at sentence boundary as fallback", () => {
    const text = "a".repeat(1500) + ". " + "b".repeat(2000);
    const chunks = splitIntoChunks(text, 3000);
    expect(chunks.length).toBe(2);
    // First chunk should end after the period
    expect(chunks[0].endsWith(".")).toBe(true);
  });

  test("hard cuts when no good boundary found", () => {
    const text = "a".repeat(6000);
    const chunks = splitIntoChunks(text, 3000);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(3000);
    expect(chunks[1].length).toBe(3000);
  });

  test("handles 50000 char text", () => {
    const para = "This is a test paragraph with some content.\n\n";
    let text = "";
    while (text.length < 50000) text += para;
    text = text.slice(0, 50000);

    const chunks = splitIntoChunks(text, 3000);
    expect(chunks.length).toBeGreaterThan(1);
    // All chunks should be <= 3000 chars
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(3000);
    }
    // Reassembled content should roughly match original
    const reassembled = chunks.join("\n\n");
    expect(reassembled.length).toBeGreaterThan(40000);
  });
});
