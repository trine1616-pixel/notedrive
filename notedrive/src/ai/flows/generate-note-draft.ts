'use server';
/**
 * @fileOverview A Genkit flow for generating a note draft based on a given topic.
 *
 * - generateNoteDraft - A function that handles the note draft generation process.
 * - GenerateNoteDraftInput - The input type for the generateNoteDraft function.
 * - GenerateNoteDraftOutput - The return type for the generateNoteDraft function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateNoteDraftInputSchema = z.object({
  topic: z.string().describe('The topic or keywords for which to generate a note draft.'),
});
export type GenerateNoteDraftInput = z.infer<typeof GenerateNoteDraftInputSchema>;

const GenerateNoteDraftOutputSchema = z.object({
  draftContent: z.string().describe('The generated markdown note draft or outline.'),
});
export type GenerateNoteDraftOutput = z.infer<typeof GenerateNoteDraftOutputSchema>;

export async function generateNoteDraft(input: GenerateNoteDraftInput): Promise<GenerateNoteDraftOutput> {
  return generateNoteDraftFlow(input);
}

const generateNoteDraftPrompt = ai.definePrompt({
  name: 'generateNoteDraftPrompt',
  input: { schema: GenerateNoteDraftInputSchema },
  output: { schema: GenerateNoteDraftOutputSchema },
  prompt: `You are an AI assistant specialized in creating well-structured note drafts and outlines.

Your task is to generate a comprehensive markdown draft or outline for a note based on the provided topic or keywords.
Focus on providing a logical structure with headings, bullet points, and placeholder content where appropriate.

Topic: {{{topic}}}

---

Draft:`,
});

const generateNoteDraftFlow = ai.defineFlow(
  {
    name: 'generateNoteDraftFlow',
    inputSchema: GenerateNoteDraftInputSchema,
    outputSchema: GenerateNoteDraftOutputSchema,
  },
  async (input) => {
    const { output } = await generateNoteDraftPrompt(input);
    return output!;
  }
);
