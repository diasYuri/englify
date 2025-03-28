import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI();

const systemPrompt = `You are Englify, an AI English tutor. Your responses should be clear, helpful, and focused on improving the user's English skills. All your responses will be delivered in both text and audio formats to enhance the learning experience.

When responding:
1. Correct any pronunciation or grammar mistakes in a friendly way
2. Provide alternative ways to express the same idea
3. Keep responses concise and easy to understand, as they will be converted to speech
4. Use natural, conversational English suitable for audio playback
5. Highlight key vocabulary or phrases that would be useful for the student`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, chatHistory, conversationId, isAudio } = await request.json();

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
        include: { user: true }
      });

      if (!conversation || conversation.user.email !== session.user.email) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      conversation = await prisma.conversation.create({
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          userId: user.id,
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        conversationId: conversation.id,
        isAudio: isAudio || false,
      },
    });

    // Format chat history for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((msg: { role: string; content: string; isAudio?: boolean }) => ({
        role: msg.role,
        content: msg.content + (msg.isAudio ? ' [This was an audio message]' : ''),
      })),
      { 
        role: 'user', 
        content: message + (isAudio ? ' [This is an audio message, provide a response suitable for audio playback]' : '')
      }
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
      n: 1
    });

    // Create assistant message in database
    const assistantMessage = await prisma.message.create({
      data: {
        content: '',
        role: 'assistant',
        conversationId: conversation.id,
        isResponseToAudio: isAudio || false,
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

              const eventData = {
                content: content,
                conversationId: conversation.id,
                isResponseToAudio: isAudio || false,
                timestamp: Date.now() // Add timestamp to ensure unique events
              };
              
              // Ensure proper SSE formatting with data: prefix and double newline
              const event = `data: ${JSON.stringify(eventData)}\n\n`;
              controller.enqueue(textEncoder.encode(event));
              
              // Add a small delay to ensure chunks are processed separately
              await new Promise(resolve => setTimeout(resolve, 5));
            }
          }

          // Send a final event with the complete response to ensure client has the full text
          const finalEventData = {
            content: fullAssistantResponse,
            conversationId: conversation.id,
            isResponseToAudio: isAudio || false,
            isFinal: true
          };
          controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(finalEventData)}\n\n`));
          
          // Update the assistant message with the complete response
          await prisma.message.update({
            where: { id: assistantMessage.id },
            data: { 
              content: fullAssistantResponse,
              isResponseToAudio: isAudio || false,
            },
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

          // Send final event with a proper DONE marker
          // Ensure proper SSE formatting with data: prefix and double newline
          controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          // Send error information to client
          const errorData = {
            error: 'Error while streaming response',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
          controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Prevents buffering for Nginx proxy
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorResponse = { error: 'Failed to get response' };
    const options = { status: 500 };
    return NextResponse.json(errorResponse, options);
  } finally {
    await prisma.$disconnect();
  }
} 