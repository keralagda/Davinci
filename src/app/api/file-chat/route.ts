import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithContext } from '@/lib/ai-helpers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const file = formData.get('file') as File | null;

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Extract text content from file if provided
    let fileContent = '';
    if (file) {
      try {
        // For text-based files, read directly
        if (
          file.type === 'text/plain' ||
          file.type === 'text/csv' ||
          file.type === 'application/json' ||
          file.type === 'text/markdown' ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.json')
        ) {
          fileContent = await file.text();
        } else if (
          file.type === 'application/pdf' ||
          file.name.endsWith('.pdf')
        ) {
          // For PDFs, read as text (basic extraction - may not work for all PDFs)
          const buffer = await file.arrayBuffer();
          const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
          // Try to extract readable text from PDF buffer
          const textMatches = text.match(/[\x20-\x7E\n\r\t]{20,}/g);
          fileContent = textMatches ? textMatches.join('\n') : '[PDF content could not be extracted]';
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.endsWith('.docx')
        ) {
          // For DOCX, basic text extraction
          const buffer = await file.arrayBuffer();
          const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
          const textMatches = text.match(/[\x20-\x7E\n\r\t]{10,}/g);
          fileContent = textMatches ? textMatches.join('\n') : '[DOCX content could not be extracted]';
        } else {
          // Try reading as text for other formats
          try {
            fileContent = await file.text();
          } catch {
            fileContent = '[File content could not be read]';
          }
        }

        // Limit file content to avoid token limits
        if (fileContent.length > 10000) {
          fileContent = fileContent.substring(0, 10000) + '\n\n[Content truncated...]';
        }
      } catch (error) {
        console.error('File reading error:', error);
        fileContent = '[Error reading file content]';
      }
    }

    // Build messages for the AI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    let systemContent = 'You are a helpful AI assistant that analyzes documents and answers questions about them. Be thorough, accurate, and reference the document content in your responses.';
    if (fileContent) {
      systemContent += `\n\nThe user has uploaded a document. Here is its content:\n\n---\n${fileContent}\n---`;
    }
    messages.push({ role: 'system', content: systemContent });
    messages.push({ role: 'user', content: message });

    // Generate response using AI
    const response = await generateTextWithContext(messages);

    return NextResponse.json({
      response,
      fileName: file?.name || null,
      fileSize: file?.size || null,
    });
  } catch (error) {
    console.error('File chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
