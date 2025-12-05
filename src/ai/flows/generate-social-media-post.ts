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

const GenerateSocialMediaPostInputSchema = z.object({
  theme: z.string().describe('The theme or topic for the social media post.'),
  tone: z.string().describe('The desired tone of voice for the post.'),
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
  prompt: `Você é um especialista em copywriting para redes sociais.

Gere um texto COMPLETO para um post, em português do Brasil, com estas condições:

Tema do post: "{{theme}}"
Tom de voz: {{tone}}
Redes alvo: {{#each networks}}{{{this}}}{{/each}}

Requisitos:
- Comece com uma frase de impacto ou pergunta que prenda atenção.
- Desenvolva o texto em 2 a 4 parágrafos curtos.
- Use linguagem simples, direta e envolvente.
- Inclua no máximo 4 emojis distribuídos de forma natural (nunca no começo de todas as frases).
- Inclua um CTA (call to action) claro no final, incentivando comentário, compartilhamento ou clique em link.
- Use quebras de linha para facilitar a leitura em celulares.
- NÃO use hashtags (isso será tratado depois na plataforma).
- NÃO fale que foi "gerado por IA", nem explique o que está fazendo; apenas entregue o texto final pronto para publicação.

Retorne APENAS o texto do post no campo 'postContent', sem títulos extras, sem aspas ao redor do texto.
`,
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
