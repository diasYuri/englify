import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are a helpful English teacher. Your goal is to help users improve their English skills.
When they send a message in their native language or English, you should:
1. If the message is in English, correct any mistakes and explain them
2. If the message is not in English, provide the English translation and explain key phrases
3. Always be encouraging and supportive
4. Provide examples when relevant
5. Keep explanations clear and concise`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, chatHistory, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation || conversation.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          userId: session.user.id,
        },
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        conversationId: conversation.id,
      },
    });

    // Format chat history for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    // Create assistant message in database
    const assistantMessage = await prisma.message.create({
      data: {
        content: '',
        role: 'assistant',
        conversationId: conversation.id,
      },
    });

    let fullAssistantResponse = '';

    // Create a new stream for the response
    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullAssistantResponse += content;
              controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ content, conversationId: conversation.id })}\n\n`));
            }
          }

          // Update the assistant message with the complete response
          await prisma.message.update({
            where: { id: assistantMessage.id },
            data: { content: fullAssistantResponse },
          });

          // Update conversation title if this is the first message
          const messageCount = await prisma.message.count({
            where: { conversationId: conversation.id },
          });
          
          if (messageCount <= 2) {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { title: message.slice(0, 50) + (message.length > 50 ? '...' : '') },
            });
          }

          // Send [DONE] event
          controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
