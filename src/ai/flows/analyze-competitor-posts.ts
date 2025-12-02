'use server';

/**
 * @fileOverview A competitor post analysis AI agent.
 *
 * - analyzeCompetitorPosts - A function that handles the analysis of competitor posts.
 * - AnalyzeCompetitorPostsInput - The input type for the analyzeCompetitorPosts function.
 * - AnalyzeCompetitorPostsOutput - The return type for the analyzeCompetitorPosts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCompetitorPostsInputSchema = z.object({
  posts: z.array(z.string()).describe('An array of competitor posts to analyze.'),
});
export type AnalyzeCompetitorPostsInput = z.infer<
  typeof AnalyzeCompetitorPostsInputSchema
>;

const AnalyzeCompetitorPostsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of the competitor posts, highlighting key themes, strategies, and areas for improvement in the user\s own content strategy.'
    ),
});
export type AnalyzeCompetitorPostsOutput = z.infer<
  typeof AnalyzeCompetitorPostsOutputSchema
>;

export async function analyzeCompetitorPosts(
  input: AnalyzeCompetitorPostsInput
): Promise<AnalyzeCompetitorPostsOutput> {
  return analyzeCompetitorPostsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCompetitorPostsPrompt',
  input: {schema: AnalyzeCompetitorPostsInputSchema},
  output: {schema: AnalyzeCompetitorPostsOutputSchema},
  prompt: `You are a social media marketing expert tasked with analyzing competitor posts to improve a user's content strategy.\n\nAnalyze the following competitor posts and provide a summary that highlights key themes, successful strategies, and areas where the user can improve their own content strategy. Focus on actionable insights that the user can implement immediately.\n\nCompetitor Posts:\n{{#each posts}}\n- {{{this}}}\n{{/each}}`,
});

const analyzeCompetitorPostsFlow = ai.defineFlow(
  {
    name: 'analyzeCompetitorPostsFlow',
    inputSchema: AnalyzeCompetitorPostsInputSchema,
    outputSchema: AnalyzeCompetitorPostsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
