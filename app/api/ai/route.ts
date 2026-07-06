import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'

// Map GOOGLE_AI_KEY from env since the SDK defaults to GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
})

export async function POST(req: Request) {
  try {
    const { command, text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    let prompt = ''
    switch (command) {
      case 'fix-grammar':
        prompt = `Fix any grammar and spelling errors in the following text. Do not change the meaning or style. Just output the corrected text directly, without any prefix or quotes.\n\nText to fix:\n${text}`
        break
      case 'improve-writing':
        prompt = `Improve the writing of the following text. Make it more professional, clear, and engaging. Just output the improved text directly, without any prefix or quotes.\n\nText to improve:\n${text}`
        break
      case 'summarize':
        prompt = `Write a concise summary of the following text. Just output the summary directly, without any prefix or quotes.\n\nText to summarize:\n${text}`
        break
      case 'continue-writing':
        prompt = `Continue the following text naturally for one or two paragraphs based on the context. Just output the continuation text directly, without any prefix or quotes, and do not repeat the original text.\n\nContext:\n${text}`
        break
      default:
        return NextResponse.json({ error: 'Invalid command' }, { status: 400 })
    }

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      prompt,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[AI_ROUTE_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
