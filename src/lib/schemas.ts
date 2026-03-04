import { z } from "zod";

const PhoneticSchema = z.object({
  text: z.string().nullable(),
  audio: z.string().nullable(),
});

const DefinitionSchema = z.object({
  definition: z.string(),
  definitionSecondary: z.string().optional(),
  example: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
});

const MeaningSchema = z.object({
  partOfSpeech: z.string(),
  definitions: z.array(DefinitionSchema),
});

// Schema for LLM dictionary response (no "source" field)
export const LLMDictionaryResponseSchema = z.object({
  word: z.string(),
  phonetics: z.array(PhoneticSchema),
  meanings: z.array(MeaningSchema),
});

export type LLMDictionaryResponse = z.infer<typeof LLMDictionaryResponseSchema>;
