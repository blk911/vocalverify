import { z } from "zod";

export const PromptPack = z.object({
  relationship: z.string(),
  version: z.string(),
  domains: z.array(z.object({
    name: z.string(),
    seeds: z.array(z.string()),
    refine: z.array(z.string())
  })),
  nonce_words: z.array(z.string())
});

export type TPromptPack = z.infer<typeof PromptPack>;

export const Artifact = z.object({
  id: z.string().uuid().optional(),
  relationship: z.string(),       // e.g., "mom_son"
  theme: z.string(),              // e.g., "cooking"
  summary: z.string(),
  anchors: z.array(z.string()),   // ["Biscuits","Observation"]
  emotion: z.string().optional(),
  confidence: z.number(),
  entropyBits: z.number().default(0),
  sensitivity: z.enum(["low","medium","high"]).default("low"),
  provenance: z.object({
    speaker: z.string(),
    date: z.string(),
    tbId: z.string().optional()
  })
});
export type TArtifact = z.infer<typeof Artifact>;

export const PPA = z.object({
  id: z.string().uuid().optional(),
  tbId: z.string(),
  title: z.string(),
  anchors: z.object({
    place: z.string().optional(),
    object: z.string().optional(),
    sequence: z.array(z.string()).optional(),
    quote: z.string().optional(),
    date: z.string().optional()
  }),
  embeddingRef: z.string().optional(),
  entropy: z.number().default(0),
  consent: z.object({ a: z.boolean(), b: z.boolean() }),
  revoked: z.boolean().optional()
});
export type TPPA = z.infer<typeof PPA>;

export const Challenge = z.object({
  id: z.string(),
  tbId: z.string(),
  facet: z.enum(["milestone_count","place_object","sequence","quote"]),
  prompt: z.string(),
  nonce: z.string(),
  ttlMs: z.number().default(120000)
});
export type TChallenge = z.infer<typeof Challenge>;
