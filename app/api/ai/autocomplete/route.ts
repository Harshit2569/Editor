import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { prompt } = await req.json();

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: 'You are a helpful writing assistant. Complete the user\'s thought seamlessly. Provide only the continuation, no pleasantries or meta-commentary.',
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in AI autocomplete:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
