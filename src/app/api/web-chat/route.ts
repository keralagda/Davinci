import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithContext } from '@/lib/ai-helpers';

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

    // Fetch web page content directly
    let pageContent = '';
    let pageTitle = '';
    let pageDescription = '';

    try {
      const fetchResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DavinciBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}`);
      }

      const html = await fetchResponse.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        pageTitle = titleMatch[1].trim().replace(/\s+/g, ' ');
      }

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
      if (descMatch) {
        pageDescription = descMatch[1].trim();
      }

      // Extract text content: remove scripts, styles, and HTML tags
      let textContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      // Limit content to avoid token limits
      if (textContent.length > 12000) {
        textContent = textContent.substring(0, 12000) + '\n\n[Content truncated...]';
      }

      pageContent = textContent;
    } catch (error) {
      console.error('Web fetch error:', error);
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
