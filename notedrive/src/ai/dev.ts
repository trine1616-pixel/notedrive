import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-note-flow.ts';
import '@/ai/flows/generate-note-draft.ts';
import '@/ai/flows/classify-note-flow.ts';
import '@/ai/flows/organize-note-flow.ts';