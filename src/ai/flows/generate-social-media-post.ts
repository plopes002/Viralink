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
});
export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;

const GenerateSocialMediaPostOutputSchema = z.object({
  postContent: z.string().describe('The generated content for the social media post.'),
  hashtags: z.string().describe('Relevant hashtags for the post.'),
  title: z.string().describe('An attention-grabbing title for the post.'),
});
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;

export async function generateSocialMediaPost(input: GenerateSocialMediaPostInput): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow(input);
}

const generateSocialMediaPostPrompt = ai.definePrompt({
  name: 'generateSocialMediaPostPrompt',
  input: {schema: GenerateSocialMediaPostInputSchema},
  output: {schema: GenerateSocialMediaPostOutputSchema},
  prompt: `You are a social media expert. Generate engaging social media content based on the given theme.

Theme: {{{theme}}}

Generate a social media post, suggest relevant hashtags, and create an attention-grabbing title.

Output in JSON format.
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
