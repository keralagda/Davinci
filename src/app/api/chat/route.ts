import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateText } from '@/lib/ai-helpers';

const DEMO_USER_ID = 'demo-user-001';

const ASSISTANT_SYSTEM_PROMPTS: Record<string, string> = {
  general:
    'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses. Be conversational but professional.',
  coder:
    'You are an expert software engineer and coding assistant. Help users write, debug, and optimize code. Provide code examples with explanations. Support multiple programming languages and frameworks. Follow best practices and design patterns.',
  writer:
    'You are a skilled creative writer and editor. Help users with writing tasks including articles, stories, essays, copywriting, and editing. Adapt your writing style to match the requested tone and audience. Provide constructive feedback and suggestions.',
  marketing:
    'You are a marketing expert and strategist. Help users create compelling marketing content, ad copy, social media posts, email campaigns, and branding strategies. Understand target audiences and craft persuasive messaging. Provide data-driven marketing insights.',
  seo:
    'You are an SEO specialist and content optimizer. Help users create SEO-friendly content, optimize meta tags, research keywords, and improve search rankings. Follow current SEO best practices and Google guidelines.',
  business:
    'You are a business consultant and strategist. Help users with business planning, strategy development, market analysis, financial projections, and operational improvements. Provide actionable insights and practical recommendations.',
  tutor:
    'You are a patient and effective tutor. Explain concepts clearly with examples and analogies. Adapt your teaching style to the learner\'s level. Break down complex topics into digestible parts. Ask questions to check understanding.',
};

function getSystemPrompt(assistantType: string): string {
  return ASSISTANT_SYSTEM_PROMPTS[assistantType] ?? ASSISTANT_SYSTEM_PROMPTS.general;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, assistantType } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    let conversation;
    let convId = conversationId;

    // If no conversationId, create a new conversation
    if (!convId) {
      const title = message.length > 50 ? message.slice(0, 50) + '...' : message;
      conversation = await db.conversation.create({
        data: {
          userId: DEMO_USER_ID,
          title,
          assistantType: assistantType ?? 'general',
        },
      });
      convId = conversation.id;
    } else {
      conversation = await db.conversation.findUnique({
        where: { id: convId },
      });
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    }

    // Add user message
    await db.message.create({
      data: {
        conversationId: convId,
        role: 'user',
        content: message,
      },
    });

    // Get conversation history for context
    const messages = await db.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    });

    // Build messages array for AI
    const systemPrompt = getSystemPrompt(conversation?.assistantType ?? assistantType ?? 'general');
    const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 20 messages for context window)
    const recentMessages = messages.slice(-20);
    for (const msg of recentMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        aiMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Generate response
    const zai = await (await import('z-ai-web-dev-sdk')).default.create();
    const result = await zai.chat.completions.create({
      messages: aiMessages,
      thinking: { type: 'disabled' },
    });

    let assistantContent = '';
    const choice = result.choices?.[0];
    if (choice?.message?.content) {
      assistantContent = choice.message.content;
    } else if (typeof result === 'string') {
      assistantContent = result;
    } else {
      assistantContent = JSON.stringify(result);
    }

    // Save assistant response
    const assistantMessage = await db.message.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: assistantContent,
      },
    });

    // Update user chat message count
    await db.user.update({
      where: { id: DEMO_USER_ID },
      data: { chatMessages: { increment: 1 } },
    });

    return NextResponse.json({
      conversationId: convId,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantContent,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
