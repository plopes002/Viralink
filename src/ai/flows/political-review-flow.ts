
'use server';

/**
 * @fileOverview An AI agent to detect political mentions in text.
 *
 * - politicalReviewFlow - A function that handles the political review process.
 * - PoliticalReviewInput - The input type for the politicalReviewFlow function.
 * - PoliticalReviewOutput - The return type for the politicalReviewFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PoliticalReviewInputSchema = z.object({
  text: z.string().describe('The text to be analyzed for political content.'),
});
export type PoliticalReviewInput = z.infer<typeof PoliticalReviewInputSchema>;

export const PoliticalReviewOutputSchema = z.object({
  hasPoliticalMention: z.boolean(),
  flags: z.array(z.string()),
  entities: z.array(z.string()),
  excerpt: z.string().nullable(),
  summary: z.string().nullable(),
});
export type PoliticalReviewOutput = z.infer<typeof PoliticalReviewOutputSchema>;

const FALLBACK_ENTITIES = [
  "pt", "pl", "psdb", "psol", "mdb", "união brasil", "uniao brasil",
  "lula", "bolsonaro", "tarcísio", "tarcisio", "boulos", "nikolas",
  "camara", "senado", "prefeito", "governador", "presidente", "eleição",
  "eleicao", "partido", "candidato", "esquerda", "direita", "centro",
  "socialismo", "conservador", "liberal",
];

function fallbackPoliticalReview(text: string): PoliticalReviewOutput {
  const normalized = text.toLowerCase();
  const found = FALLBACK_ENTITIES.filter((term) => normalized.includes(term));

  return {
    hasPoliticalMention: found.length > 0,
    flags: found.length ? ["texto-politico-para-revisao"] : [],
    entities: found.slice(0, 8),
    excerpt: text.slice(0, 220),
    summary: found.length
      ? "Texto com menções políticas detectadas. Revisão manual recomendada."
      : "Sem menções políticas claras.",
  };
}

export async function politicalReviewFlow(
  input: PoliticalReviewInput
): Promise<PoliticalReviewOutput> {
  return flow(input);
}

const prompt = ai.definePrompt({
  name: 'politicalReviewPrompt',
  input: { schema: PoliticalReviewInputSchema },
  output: { schema: PoliticalReviewOutputSchema },
  prompt: `
Analise o texto abaixo e responda APENAS em JSON válido.

Objetivo:
- detectar se há menções políticas
- identificar entidades políticas citadas
- criar um resumo neutro para revisão humana

IMPORTANTE:
- NÃO inferir ideologia da pessoa
- NÃO classificar como esquerda, direita, centro
- NÃO afirmar apoio político
- apenas apontar menções, entidades e necessidade de revisão

Formato obrigatório:
{
  "hasPoliticalMention": true,
  "flags": ["menciona-partido", "menciona-candidato"],
  "entities": ["PT", "Lula"],
  "excerpt": "trecho curto relevante",
  "summary": "Resumo neutro e curto para revisão manual."
}

Se não houver menções políticas relevantes, use:
{
  "hasPoliticalMention": false,
  "flags": [],
  "entities": [],
  "excerpt": "",
  "summary": "Sem menções políticas claras."
}

Texto:
"{{{text}}}"
`.trim(),
});

const flow = ai.defineFlow(
  {
    name: 'politicalReviewFlow',
    inputSchema: PoliticalReviewInputSchema,
    outputSchema: PoliticalReviewOutputSchema,
  },
  async ({ text }) => {
    if (!text.trim()) {
      return {
        hasPoliticalMention: false,
        flags: [],
        entities: [],
        excerpt: null,
        summary: "Texto vazio.",
      };
    }

    try {
      const { output } = await prompt({ text });
      return output!;
    } catch (e) {
      console.error("[politicalReviewFlow] AI error, using fallback", e);
      return fallbackPoliticalReview(text);
    }
  }
);
