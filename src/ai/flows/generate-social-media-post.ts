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

const GenerateSocialMediaPostInputSchema = z.object({
  theme: z.string().describe('The theme or topic for the social media post.'),
  toneId: z.custom<ToneId>().describe('The desired tone of voice for the post.'),
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
  input: {schema: GenerateSocialMediaPostInputSchema},
  output: {schema: GenerateSocialMediaPostOutputSchema},
  prompt: `Você é um especialista em copywriting para redes sociais, criando posts para uma plataforma de gestão e automação chamada VIRALINK.

Objetivo:
Gerar um texto COMPLETO para um post em português do Brasil.

Tema do post: "{{theme}}"
Tom de voz selecionado: {{@getToneTemplateById(toneId).label}}
Descrição do tom: {{@getToneTemplateById(toneId).descricao}}
Redes alvo: {{#each networks}}{{{this}}}{{/each}}

Siga estas orientações de estilo:
{{#each (@getToneTemplateById(toneId).instrucoesEstilo)}}
- {{{this}}}
{{/each}}

Orientação de CTA:
- {{@getToneTemplateById(toneId).instrucoesCTA}}

Requisitos gerais:
- Comece com uma frase de impacto OU uma pergunta que prenda atenção.
- Desenvolva o texto em 2 a 4 parágrafos curtos.
- Use linguagem simples, direta e envolvente, adequada para leitura em celular.
- Use no máximo 4 emojis, distribuídos naturalmente (não coloque emoji em TODAS as frases).
- Inclua um CTA (call to action) claro no final, coerente com o tom e com a orientação acima.
- Use quebras de linha para facilitar a leitura.
- NÃO use hashtags.
- NÃO diga que foi "gerado por IA" e nem explique o que está fazendo.
- Apenas retorne o texto final pronto para publicação, sem títulos extras, sem aspas em volta.

Retorne APENAS o texto do post no campo 'postContent'.
`,
  template: {
    helpers: {
      getToneTemplateById,
    },
  }
});

const generateSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async input => {
    const {output} = await generateSocialMediaPostPrompt(input);
    return output!;
  }
);
