'use server';

/**
 * @fileOverview An AI agent to generate campaign message templates.
 *
 * - generateCampaignTemplate - A function that handles the template generation process.
 * - GenerateCampaignTemplateInput - The input type for the generateCampaignTemplate function.
 * - GenerateCampaignTemplateOutput - The return type for the generateCampaignTemplate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CampaignTemplateType } from '@/types/campaignTemplate';

const GenerateCampaignTemplateInputSchema = z.object({
  templateType: z.custom<CampaignTemplateType>(),
  channel: z.string(),
  topic: z.string().optional(),
  audienceDescription: z.string().optional(),
  tone: z.string().optional().default('profissional'),
  context: z.string().optional(),
});
export type GenerateCampaignTemplateInput = z.infer<typeof GenerateCampaignTemplateInputSchema>;

const GenerateCampaignTemplateOutputSchema = z.object({
  title: z.string().describe('Nome curto do template'),
  description: z.string().describe('Descrição curta'),
  generatedMessage: z.string().describe('Mensagem pronta'),
});
export type GenerateCampaignTemplateOutput = z.infer<typeof GenerateCampaignTemplateOutputSchema>;


export async function generateCampaignTemplate(input: GenerateCampaignTemplateInput): Promise<GenerateCampaignTemplateOutput> {
    return generateCampaignTemplateFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateCampaignTemplatePrompt',
    input: { schema: GenerateCampaignTemplateInputSchema },
    output: { schema: GenerateCampaignTemplateOutputSchema },
    prompt: `
Você é especialista em copy de campanha para relacionamento, engajamento e mobilização.

Gere uma mensagem curta e objetiva em português do Brasil para uma campanha com estas características:

Tipo da campanha: {{{templateType}}}
Canal: {{{channel}}}
Tema principal: {{{topic}}}
Público: {{{audienceDescription}}}
Tom de voz: {{{tone}}}
Contexto adicional: {{{context}}}

Regras:
- Mensagem pronta para uso
- Tom natural, humano e convincente
- Sem exagero
- Não use hashtags
- Não diga que foi gerado por IA
- Pode usar placeholders:
  - {{nome}}
  - {{nome_completo}}
  - {{usuario}}
- Deve ser apropriada para envio direto
- Máximo de 700 caracteres
- Responda apenas com JSON válido no formato especificado.
`.trim(),
});


const generateCampaignTemplateFlow = ai.defineFlow(
    {
        name: 'generateCampaignTemplateFlow',
        inputSchema: GenerateCampaignTemplateInputSchema,
        outputSchema: GenerateCampaignTemplateOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await prompt(input);
            return output!;
        } catch (e) {
            console.error("[generateCampaignTemplateFlow] AI error", e);
            // Fallback for when JSON parsing fails or other errors occur
            return {
                title: "Template gerado",
                description: "Mensagem sugerida pela IA",
                generatedMessage: "Não foi possível gerar a mensagem. Tente novamente.",
            };
        }
    }
);
