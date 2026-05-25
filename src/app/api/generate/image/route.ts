import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateImage, DEFAULT_MODELS } from '@/lib/ai-helpers';

const DEMO_USER_ID = 'demo-user-001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, size, quality, style, model } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Use the provided model or fall back to the default NVIDIA image model
    const selectedModel = model || DEFAULT_MODELS.image;

    // Create initial record with pending status
    const imageGen = await db.imageGeneration.create({
      data: {
        userId: DEMO_USER_ID,
        prompt,
        negativePrompt: negativePrompt ?? null,
        size: size ?? '1024x1024',
        quality: quality ?? 'standard',
        style: style ?? null,
        status: 'pending',
      },
    });

    try {
      // Generate the image using the selected NVIDIA/Stability AI model
      const result = await generateImage(prompt, {
        size: size ?? '1024x1024',
        quality: quality ?? 'standard',
        style,
        model: selectedModel,
        negativePrompt,
      });

      // Determine the image URL
      let imageUrl = result.url ?? '';
      if (!imageUrl && result.data) {
        // If we got base64 data, we'll store it as a data URL
        const base64Data = result.data.startsWith('data:')
          ? result.data
          : `data:image/png;base64,${result.data}`;
        imageUrl = base64Data;
      }

      // Update the record with completed status
      const updated = await db.imageGeneration.update({
        where: { id: imageGen.id },
        data: {
          imageUrl,
          status: 'completed',
        },
      });

      // Update user image count
      await db.user.update({
        where: { id: DEMO_USER_ID },
        data: { imagesUsed: { increment: 1 } },
      });

      return NextResponse.json({
        id: updated.id,
        imageUrl,
        prompt,
        size: size ?? '1024x1024',
        quality: quality ?? 'standard',
        style: style ?? null,
        model: selectedModel,
        status: 'completed',
      });
    } catch (genError) {
      // Update record with failed status
      await db.imageGeneration.update({
        where: { id: imageGen.id },
        data: { status: 'failed' },
      });
      throw genError;
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
