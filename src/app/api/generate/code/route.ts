import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateText } from '@/lib/ai-helpers';

const DEMO_USER_ID = 'demo-user-001';

const CODE_SYSTEM_PROMPT = `You are an expert software engineer and coding assistant. When given a coding task:

1. Write clean, efficient, and well-documented code
2. Follow best practices and design patterns for the specified language
3. Include helpful comments explaining key logic
4. Provide error handling where appropriate
5. After the code, provide a brief explanation of the implementation

Format your response as follows:
- Start with the code in a code block with the appropriate language tag
- Then provide a "## Explanation" section below the code block

If the user doesn't specify a programming language, default to TypeScript/JavaScript.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, language, model } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Build the user prompt with language context
    const langContext = language
      ? `Programming language: ${language}\n\n`
      : '';
    const userPrompt = `${langContext}${prompt}`;

    // Generate code using AI
    const fullResponse = await generateText(CODE_SYSTEM_PROMPT, userPrompt, model);

    // Separate code and explanation
    let code = fullResponse;
    let explanation = '';

    // Try to extract code blocks and explanation
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const codeMatch = fullResponse.match(codeBlockRegex);

    if (codeMatch) {
      code = codeMatch[1].trim();
      // Extract explanation after the code block
      const afterCode = fullResponse.slice(fullResponse.indexOf('```', fullResponse.indexOf(codeMatch[0]) + 3) + 3);
      const explanationMatch = afterCode.match(/##\s*Explanation\s*\n([\s\S]*)/i);
      if (explanationMatch) {
        explanation = explanationMatch[1].trim();
      } else {
        explanation = afterCode.trim();
      }
    }

    // Save to database
    const codeGen = await db.codeGeneration.create({
      data: {
        userId: DEMO_USER_ID,
        prompt,
        language: language ?? null,
        code,
        explanation: explanation || null,
        model: model ?? 'default',
      },
    });

    // Update user code generation count
    await db.user.update({
      where: { id: DEMO_USER_ID },
      data: { codeGenerated: { increment: 1 } },
    });

    return NextResponse.json({
      id: codeGen.id,
      code,
      explanation,
      language: language ?? 'typescript',
    });
  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
