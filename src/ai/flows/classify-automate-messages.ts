'use server';

/**
 * @fileOverview This file defines a Genkit flow for classifying messages and automating content for message replies using AI.
 *
 * classifyAutomateMessages - A function that takes a message as input, classifies it, and generates an automated reply.
 * ClassifyAutomateMessagesInput - The input type for the classifyAutomateMessages function.
 * ClassifyAutomateMessagesOutput - The return type for the classifyAutomateMessages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyAutomateMessagesInputSchema = z.object({
  message: z.string().describe('The content of the message to be classified and replied to.'),
});
export type ClassifyAutomateMessagesInput = z.infer<
  typeof ClassifyAutomateMessagesInputSchema
>;

const ClassifyAutomateMessagesOutputSchema = z.object({
  classification: z
    .string()
    .describe('The classification of the message (e.g., inquiry, complaint, compliment).'),
  automatedReply: z
    .string()
    .describe('The automated reply generated for the message.'),
});
export type ClassifyAutomateMessagesOutput = z.infer<
  typeof ClassifyAutomateMessagesOutputSchema
>;

export async function classifyAutomateMessages(
  input: ClassifyAutomateMessagesInput
): Promise<ClassifyAutomateMessagesOutput> {
  return classifyAutomateMessagesFlow(input);
}

const classifyAutomateMessagesPrompt = ai.definePrompt({
  name: 'classifyAutomateMessagesPrompt',
  input: {schema: ClassifyAutomateMessagesInputSchema},
  output: {schema: ClassifyAutomateMessagesOutputSchema},
  prompt: `You are an AI assistant designed to classify incoming messages and generate appropriate automated replies.

  Message: {{{message}}}

  Classification: (Classify the message into one of the following categories: inquiry, complaint, compliment, other)
  Automated Reply: (Generate a suitable automated reply based on the message classification. The reply should be concise and helpful.)`,
});

const classifyAutomateMessagesFlow = ai.defineFlow(
  {
    name: 'classifyAutomateMessagesFlow',
    inputSchema: ClassifyAutomateMessagesInputSchema,
    outputSchema: ClassifyAutomateMessagesOutputSchema,
  },
  async input => {
    const {output} = await classifyAutomateMessagesPrompt(input);
    return output!;
  }
);
