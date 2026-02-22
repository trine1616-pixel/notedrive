'use server';
/**
 * @fileOverview A Genkit flow for classifying notes by suggesting tags and folders.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClassifyNoteInputSchema = z.object({
    noteContent: z.string().describe('The full content of the note to be classified.'),
    existingFolders: z.array(z.string()).optional().describe('A list of existing folder names to choose from.'),
});
export type ClassifyNoteInput = z.infer<typeof ClassifyNoteInputSchema>;

const ClassifyNoteOutputSchema = z.object({
    suggestedTags: z.array(z.string()).describe('A list of suggested hashtags.'),
    suggestedFolder: z.string().describe('The most appropriate folder name for this note.'),
    reason: z.string().describe('Brief reason for the classification.'),
});
export type ClassifyNoteOutput = z.infer<typeof ClassifyNoteOutputSchema>;

export async function classifyNote(input: ClassifyNoteInput): Promise<ClassifyNoteOutput> {
    return classifyNoteFlow(input);
}

const classifyNotePrompt = ai.definePrompt({
    name: 'classifyNotePrompt',
    input: { schema: ClassifyNoteInputSchema },
    output: { schema: ClassifyNoteOutputSchema },
    prompt: `You are an expert note organization assistant. Analyze the following note content and suggest appropriate hashtags and a folder.
  
  Note Content: 
  {{{noteContent}}}
  
  Existing Folders:
  {{#if existingFolders}}
    {{existingFolders}}
  {{else}}
    (No existing folders provided. Suggest a new folder name.)
  {{/if}}
  
  Instructions:
  1. Generate 3-5 relevant hashtags starting with #.
  2. Pick the most suitable folder from the existing folders list, or suggest a new one if none fit perfectly.
  3. Provide a brief reason for your choice.
  4. Response must be in Korean.`,
});

const classifyNoteFlow = ai.defineFlow(
    {
        name: 'classifyNoteFlow',
        inputSchema: ClassifyNoteInputSchema,
        outputSchema: ClassifyNoteOutputSchema,
    },
    async input => {
        const { output } = await classifyNotePrompt(input);
        return output!;
    }
);
