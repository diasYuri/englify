import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  generateAudio: z.boolean().default(false),
  chatHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).default([]),
});

export type ChatMessageRequest = z.infer<typeof chatMessageSchema>;
