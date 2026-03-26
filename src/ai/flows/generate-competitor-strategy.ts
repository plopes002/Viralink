'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CompetitorStrategyResultSchema } from '@/types/competitorStrategy';
import type { CompetitorStrategyResult } from '@/types/competitorStrategy';

const GenerateCompetitorStrategyInputSchema = z.object({
    myAccount: z.any(),
    competitor: z.any(),
    periodDays: z.number(),
    variations: z.any(),
});

export type GenerateCompetitorStrategyInput = z.infer<typeof GenerateCompetitorStrategyInputSchema>;

export async function generateCompetitorStrategy(
  input: GenerateCompetitorStrategyInput
): Promise<CompetitorStrategyResult> {
  return generateCompetitorStrategyFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateCompetitorStrategyPrompt',
    input: { schema: GenerateCompetitorStrategyInputSchema },
    output: { schema: CompetitorStrategyResultSchema },
    prompt: `
Você é um analista estratégico de redes sociais.

Compare duas contas e gere uma análise objetiva em português do Brasil.

Conta principal:
{{{json myAccount}}}

Concorrente:
{{{json competitor}}}

Variações do período:
{{{json variations}}}

Período analisado: {{{periodDays}}} dias

Regras:
- Foque em crescimento, engajamento, likes e comentários
- Escreva de forma profissional e clara
- Gere conclusões práticas
- Não cite IA
- Responda apenas em JSON válido neste formato:

{
  "summary": "Resumo geral curto",
  "strengths": ["força 1", "força 2"],
  "weaknesses": ["fraqueza 1", "fraqueza 2"],
  "opportunities": ["oportunidade 1", "oportunidade 2"],
  "recommendations": ["ação 1", "ação 2", "ação 3"],
  "suggestedCampaignTitle": "nome curto da campanha",
  "suggestedCampaignMessage": "mensagem sugerida para campanha"
}
`.trim(),
});


const generateCompetitorStrategyFlow = ai.defineFlow(
  {
    name: 'generateCompetitorStrategyFlow',
    inputSchema: GenerateCompetitorStrategyInputSchema,
    outputSchema: CompetitorStrategyResultSchema,
  },
  async (input) => {
    try {
        const { output } = await prompt(input);
        return output!;
    } catch (e) {
        console.error("[generateCompetitorStrategyFlow] AI error", e);
        return {
            summary: "Não foi possível gerar a análise no momento. Tente novamente.",
            strengths: [],
            weaknesses: [],
            opportunities: [],
            recommendations: [],
            suggestedCampaignTitle: "Campanha sugerida",
            suggestedCampaignMessage:
              "Olá! Temos compartilhado conteúdos que podem te interessar bastante. Se fizer sentido para você, acompanhe nossa página para ver mais atualizações.",
          };
    }
  }
);