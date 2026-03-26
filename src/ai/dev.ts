'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/classify-automate-messages.ts';
import '@/ai/flows/generate-social-media-post.ts';
import '@/ai/flows/analyze-competitor-posts.ts';
import '@/ai/flows/generate-image-flow';
import '@/ai/flows/suggest-categories';
import '@/ai/flows/political-review-flow';
import '@/ai/flows/generate-campaign-template';
import '@/ai/flows/generate-competitor-strategy.ts';