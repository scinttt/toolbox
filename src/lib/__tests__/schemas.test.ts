import { LLMDictionaryResponseSchema } from "@/lib/schemas";

describe("LLMDictionaryResponseSchema", () => {
  const validData = {
    word: "hello",
    phonetics: [{ text: "/həˈloʊ/", audio: null }],
    meanings: [
      {
        partOfSpeech: "exclamation",
        definitions: [{ definition: "used as a greeting" }],
      },
    ],
  };

  test("accepts valid data", () => {
    expect(() => LLMDictionaryResponseSchema.parse(validData)).not.toThrow();
  });

  test("accepts data with all optional fields", () => {
    const full = {
      word: "hello",
      phonetics: [{ text: "/həˈloʊ/", audio: "https://audio.mp3" }],
      meanings: [
        {
          partOfSpeech: "exclamation",
          definitions: [
            {
              definition: "used as a greeting",
              definitionSecondary: "问候语",
              example: "Hello there!",
              synonyms: ["hi", "hey"],
              antonyms: ["goodbye"],
            },
          ],
        },
      ],
    };
    expect(() => LLMDictionaryResponseSchema.parse(full)).not.toThrow();
  });

  test("accepts empty phonetics and meanings arrays", () => {
    const data = { word: "test", phonetics: [], meanings: [] };
    expect(() => LLMDictionaryResponseSchema.parse(data)).not.toThrow();
  });

  test("rejects missing word", () => {
    const data = { phonetics: [], meanings: [] };
    expect(() => LLMDictionaryResponseSchema.parse(data)).toThrow();
  });

  test("rejects non-string word", () => {
    const data = { word: 123, phonetics: [], meanings: [] };
    expect(() => LLMDictionaryResponseSchema.parse(data)).toThrow();
  });

  test("rejects missing phonetics array", () => {
    const data = { word: "test", meanings: [] };
    expect(() => LLMDictionaryResponseSchema.parse(data)).toThrow();
  });

  test("rejects invalid definition structure", () => {
    const data = {
      word: "test",
      phonetics: [],
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [{ wrongField: "value" }],
        },
      ],
    };
    expect(() => LLMDictionaryResponseSchema.parse(data)).toThrow();
  });
});
