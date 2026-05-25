import { NextRequest, NextResponse } from 'next/server';
import { createZAI, generateTextWithContext } from '@/lib/ai-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, message } = body;

    if (!url || !message) {
      return NextResponse.json(
        { error: 'url and message are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Extract web page content using the z-ai-web-dev-sdk web-reader
    let pageContent = '';
    let pageTitle = '';
    let pageDescription = '';

    try {
      const zai = await createZAI();
      const extractResult = await zai.webReader.extract({ url });

      if (typeof extractResult === 'string') {
        pageContent = extractResult;
      } else if (typeof extractResult === 'object' && extractResult !== null) {
        const res = extractResult as Record<string, unknown>;
        pageContent = (res.content as string) || (res.html as string) || (res.text as string) || '';
        pageTitle = (res.title as string) || '';
        pageDescription = (res.description as string) || (res.excerpt as string) || '';

        if (!pageContent && res.markdown) {
          pageContent = res.markdown as string;
        }
      }

      // Limit content to avoid token limits
      if (pageContent.length > 12000) {
        pageContent = pageContent.substring(0, 12000) + '\n\n[Content truncated...]';
      }
    } catch (error) {
      console.error('Web reader error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch or extract content from the URL. Please check the URL and try again.' },
        { status: 400 }
      );
    }

    if (!pageContent.trim()) {
      return NextResponse.json(
        { error: 'Could not extract any content from the URL' },
        { status: 400 }
      );
    }

    // Use extracted content as context for the LLM
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `You are a helpful AI assistant that analyzes web pages and answers questions about them. Be thorough, accurate, and reference the page content in your responses.

The user has shared a web page. Here is the extracted content:

Title: ${pageTitle || 'N/A'}
Description: ${pageDescription || 'N/A'}

Content:
---
${pageContent}
---`,
      },
      { role: 'user', content: message },
    ];

    const response = await generateTextWithContext(messages);

    return NextResponse.json({
      response,
      pageTitle,
      pageDescription,
      contentLength: pageContent.length,
    });
  } catch (error) {
    console.error('Web chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
