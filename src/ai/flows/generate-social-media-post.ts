'use server';
/**
 * @fileOverview An AI agent to generate social media posts based on a theme.
 *
 * - generateSocialMediaPost - A function that handles the social media post generation process.
 * - GenerateSocialMediaPostInput - The input type for the generateSocialMediaPost function.
 * - GenerateSocialMediaPostOutput - The return type for the generateSocialMediaPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ToneId, getToneTemplateById } from '@/config/toneTemplates';
import { ObjectiveId, getObjectiveById } from '@/config/postObjectives';

const GenerateSocialMediaPostInputSchema = z.object({
  theme: z.string().describe('The theme or topic for the social media post.'),
  toneId: z.custom<ToneId>().describe('The desired tone of voice for the post.'),
  objectiveId: z.custom<ObjectiveId>().describe('The main business objective of the post.'),
  networks: z.array(z.string()).describe('The target social networks for the post.'),
});
export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;

const GenerateSocialMediaPostOutputSchema = z.object({
  postContent: z.string().describe('The generated content for the social media post.'),
});
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;

export async function generateSocialMediaPost(input: GenerateSocialMediaPostInput): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow(input);
}

const generateSocialMediaPostPrompt = ai.definePrompt({
  name: 'generateSocialMediaPostPrompt',
  prompt: `Você é um especialista em copywriting para redes sociais, criando posts para uma plataforma de gestão e automação chamada VIRALINK.

Objetivo principal do post:
- {{objectiveLabel}}
- Foco: {{objectiveFocus}}

Tema do post: "{{theme}}"
Tom de voz selecionado: {{toneLabel}}
Redes alvo: {{networks}}

Siga estas orientações de ESTILO do tom de voz:
{{toneStyleBullets}}

Siga estas orientações de ESTILO do objetivo do post:
{{objectiveStyleBullets}}

Orientação para CTA:
- Tom de voz: {{toneCTA}}
- Objetivo: {{objectiveCTA}}

Requisitos gerais:
- Escreva em português do Brasil.
- Comece com uma frase de impacto OU uma pergunta que prenda atenção.
- Desenvolva o texto em 2 a 4 parágrafos curtos.
- Use linguagem simples, direta e envolvente, adequada para leitura em celular.
- Use no máximo 4 emojis, distribuídos naturalmente (não coloque emoji em TODAS as frases).
- NÃO use hashtags.
- NÃO diga que foi "gerado por IA" e nem explique o que está fazendo.
- Apenas retorne o texto final pronto para publicação, sem títulos extras, sem aspas em volta.

Retorne APENAS o texto do post no campo 'postContent'.
`,
  input: {
    schema: z.object({
      theme: z.string(),
      toneLabel: z.string(),
      objectiveLabel: z.string(),
      objectiveFocus: z.string(),
      networks: z.string(),
      toneStyleBullets: z.string(),
      objectiveStyleBullets: z.string(),
      toneCTA: z.string(),
      objectiveCTA: z.string(),
    }),
  },
  output: {
    schema: GenerateSocialMediaPostOutputSchema
  },
});

const generateSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async (input) => {
    const tone = getToneTemplateById(input.toneId);
    const objective = getObjectiveById(input.objectiveId);

    const networks = input.networks ?? ["instagram"];

    const toneStyleBullets = tone.instrucoesEstilo
      .map((i) => `- ${i}`)
      .join("\n");
    const objectiveStyleBullets = objective.instrucoesEstilo
      .map((i) => `- ${i}`)
      .join("\n");

    const {output} = await generateSocialMediaPostPrompt({
      theme: input.theme,
      toneLabel: tone.label,
      objectiveLabel: objective.label,
      objectiveFocus: objective.focoPrincipal,
      networks: networks.join(", "),
      toneStyleBullets,
      objectiveStyleBullets,
      toneCTA: tone.instrucoesCTA,
      objectiveCTA: objective.instrucoesCTA,
    });

    return output!;
  }
);
