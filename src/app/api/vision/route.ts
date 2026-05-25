import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithContext } from '@/lib/ai-helpers';

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

    // Use NVIDIA VLM (Vision Language Model) via multimodal chat endpoint
    const nvidiaKey = process.env.NVIDIA_API_KEY;

    if (nvidiaKey) {
      try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: image.startsWith('data:') ? image : `data:image/png;base64,${image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 2048,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const analysis = data.choices?.[0]?.message?.content || '';
          return NextResponse.json({
            analysis,
            model: model || 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
          });
        }
      } catch (e) {
        console.error('NVIDIA VLM failed:', e);
      }
    }

    // Fallback: describe the image request to a text model
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. The user has shared an image but the vision model is unavailable. Let them know you cannot analyze the image directly but offer to help with their question in other ways.',
      },
      { role: 'user', content: prompt },
    ];

    const analysis = await generateTextWithContext(messages);

    return NextResponse.json({
      analysis,
      model: 'fallback-text',
    });
  } catch (error) {
    console.error('Vision analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
