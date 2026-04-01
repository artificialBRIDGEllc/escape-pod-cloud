import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'XAI_API_KEY not set. Add it to your Vercel environment variables.' },
      { status: 500 }
    );
  }

  let rawMessages: { role: string; content: string }[];
  try {
    const body = await req.json();
    rawMessages = body.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) throw new Error();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.API_BASE_URL || 'https://api.x.ai/v1',
  });

  const systemPrompt =
    process.env.SYSTEM_PROMPT ||
    'You are a helpful, direct, and intelligent AI assistant. Be concise but thorough. Use markdown formatting for code, lists, and structure when appropriate.';

  const model = process.env.AI_MODEL || 'grok-beta';

  // Cast to typed messages — role values 'user'/'assistant'/'system' are safe
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(rawMessages.slice(-60) as ChatCompletionMessageParam[]),
  ];

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: parseInt(process.env.MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    });

    const enc = new TextEncoder();

    const readable = new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of stream) {
            const txt = chunk.choices[0]?.delta?.content || '';
            if (txt) {
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: txt })}\n\n`));
            }
          }
          ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Stream error';
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        } finally {
          ctrl.close();
        }
      },
      cancel() {},
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI request failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}
