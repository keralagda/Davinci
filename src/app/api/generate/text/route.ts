import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateText } from '@/lib/ai-helpers';

const DEMO_USER_ID = 'demo-user-001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, inputs, tone, language, length, model } = body;

    if (!templateId || !inputs) {
      return NextResponse.json(
        { error: 'templateId and inputs are required' },
        { status: 400 }
      );
    }

    // Look up the template
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: { category: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Construct prompt by replacing {variable} placeholders
    let userPrompt = template.prompt;
    for (const [key, value] of Object.entries(inputs as Record<string, string>)) {
      const placeholder = `{${key}}`;
      userPrompt = userPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Build system prompt with tone, language, and length preferences
    const systemParts: string[] = [
      'You are a professional AI content generator.',
    ];
    if (tone) {
      systemParts.push(`Write in a ${tone} tone.`);
    }
    if (language) {
      systemParts.push(`Write the output in ${language}.`);
    }
    if (length) {
      const lengthMap: Record<string, string> = {
        short: 'Keep the response concise and brief (1-2 paragraphs).',
        medium: 'Write a moderately detailed response (3-5 paragraphs).',
        long: 'Write a comprehensive and detailed response (6+ paragraphs).',
      };
      systemParts.push(lengthMap[length] ?? '');
    }
    const systemPrompt = systemParts.join(' ');

    // Generate content using AI
    const content = await generateText(systemPrompt, userPrompt, model);

    // Count words
    const wordsCount = content.split(/\s+/).filter(Boolean).length;

    // Save the generated doc
    const doc = await db.generatedDoc.create({
      data: {
        userId: DEMO_USER_ID,
        templateId,
        title: template.name,
        input: JSON.stringify(inputs),
        output: content,
        wordsCount,
        model: model ?? 'default',
        language: language ?? 'English',
        tone: tone ?? 'Professional',
      },
    });

    // Update user word count
    await db.user.update({
      where: { id: DEMO_USER_ID },
      data: { wordsUsed: { increment: wordsCount } },
    });

    return NextResponse.json({
      id: doc.id,
      content,
      wordsCount,
      template: template.name,
    });
  } catch (error) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
