import { NextRequest, NextResponse } from 'next/server';
import { createZAI } from '@/lib/ai-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, prompt, model } = body;

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'image and prompt are required' },
        { status: 400 }
      );
    }

    // Use the VLM capability from z-ai-web-dev-sdk
    const zai = await createZAI();
    const result = await zai.vlm.analyze({
      image,
      prompt,
    });

    // Extract the analysis text from the result
    let analysis = '';
    if (typeof result === 'string') {
      analysis = result;
    } else if (typeof result === 'object' && result !== null) {
      const res = result as Record<string, unknown>;
      if (res.content) {
        analysis = res.content as string;
      } else if (res.text) {
        analysis = res.text as string;
      } else if (res.analysis) {
        analysis = res.analysis as string;
      } else if (res.choices) {
        // OpenAI-style response
        const choices = res.choices as Array<{ message?: { content?: string } }>;
        if (choices?.[0]?.message?.content) {
          analysis = choices[0].message.content;
        }
      } else {
        analysis = JSON.stringify(result);
      }
    }

    return NextResponse.json({
      analysis,
      model: model || 'vlm',
    });
  } catch (error) {
    console.error('Vision analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
