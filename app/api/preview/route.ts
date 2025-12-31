import { NextResponse } from 'next/server';
import { generateTweet } from '@/lib/generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { topic } = (await request.json().catch(() => ({}))) as { topic?: string };

  const draft = await generateTweet({ topic });

  return NextResponse.json(draft);
}
