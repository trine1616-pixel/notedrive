'use server';
/**
 * @fileOverview A Genkit flow for summarizing notes.
 *
 * - summarizeNote - A function that generates a concise summary of note content.
 * - SummarizeNoteInput - The input type for the summarizeNote function.
 * - SummarizeNoteOutput - The return type for the summarizeNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeNoteInputSchema = z.object({
  noteContent: z.string().describe('The full content of the note to be summarized.'),
});
export type SummarizeNoteInput = z.infer<typeof SummarizeNoteInputSchema>;

const SummarizeNoteOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the note.'),
});
export type SummarizeNoteOutput = z.infer<typeof SummarizeNoteOutputSchema>;

export async function summarizeNote(input: SummarizeNoteInput): Promise<SummarizeNoteOutput> {
  return summarizeNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: { schema: SummarizeNoteInputSchema },
  output: { schema: SummarizeNoteOutputSchema },
  prompt: `You are an expert summarization tool. Your task is to provide a concise and accurate summary of the given note content.
  
  Note Content: {{{noteContent}}}
  
  Instructions:
  1. Extract the main points as "핵심 요약 (Key Takeaways)".
  2. Identify any tasks or follow-up items as "할 일 (Action Items)".
  3. Keep the summary concise (3-5 bullet points).
  4. Response must be in Korean.`,
});

const summarizeNoteFlow = ai.defineFlow(
  {
    name: 'summarizeNoteFlow',
    inputSchema: SummarizeNoteInputSchema,
    outputSchema: SummarizeNoteOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
