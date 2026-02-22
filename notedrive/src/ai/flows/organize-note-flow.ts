'use server';
/**
 * @fileOverview A Genkit flow for organizing and formatting notes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OrganizeNoteInputSchema = z.object({
    noteContent: z.string().describe('The full content of the note to be organized.'),
});
export type OrganizeNoteInput = z.infer<typeof OrganizeNoteInputSchema>;

const OrganizeNoteOutputSchema = z.object({
    organizedContent: z.string().describe('The formatted and organized markdown content.'),
    changesMade: z.string().describe('Brief description of what was improved.'),
});
export type OrganizeNoteOutput = z.infer<typeof OrganizeNoteOutputSchema>;

export async function organizeNote(input: OrganizeNoteInput): Promise<OrganizeNoteOutput> {
    return organizeNoteFlow(input);
}

const organizeNotePrompt = ai.definePrompt({
    name: 'organizeNotePrompt',
    input: { schema: OrganizeNoteInputSchema },
    output: { schema: OrganizeNoteOutputSchema },
    prompt: `You are a professional editor specialized in Markdown note organization. 
  Your task is to take a messy or poorly structured note and turn it into a clean, well-organized Markdown document.
  
  Note Content:
  {{{noteContent}}}
  
  Instructions:
  1. Fix grammar and sentence structure while preserving the original meaning.
  2. Add appropriate Markdown headers (H1, H2, H3) to create a logical hierarchy.
  3. Use bullet points and numbered lists where they improve readability.
  4. Ensure code blocks are correctly formatted with language identifiers if possible.
  5. Bold important keywords or terms.
  6. Return the organized content and a brief summary of the improvements in Korean.
  
  Organize the content meticulously.`,
});

const organizeNoteFlow = ai.defineFlow(
    {
        name: 'organizeNoteFlow',
        inputSchema: OrganizeNoteInputSchema,
        outputSchema: OrganizeNoteOutputSchema,
    },
    async input => {
        const { output } = await organizeNotePrompt(input);
        return output!;
    }
);
