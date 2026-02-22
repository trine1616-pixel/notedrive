import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    googleAI(),
    ollama({
      serverAddress: 'http://127.0.0.1:11434', // Default Ollama port
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Default model
});
