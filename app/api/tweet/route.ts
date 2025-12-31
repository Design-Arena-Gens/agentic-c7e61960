import { NextResponse } from 'next/server';
import { generateTweet } from '@/lib/generator';
import { postTweet, TwitterConfigError } from '@/lib/twitter';
import { writeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

type RequestBody = {
  tweet?: string;
  metadata?: Record<string, unknown>;
  topic?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;

  try {
    const draft = body.tweet
      ? { tweet: body.tweet, metadata: body.metadata ?? {} }
      : await generateTweet({ topic: body.topic });

    const metadata = {
      ...draft.metadata,
      trigger: draft.metadata?.trigger ?? 'manual'
    };

    await postTweet({ text: draft.tweet, metadata });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TwitterConfigError) {
      await writeStatus({
        ok: false,
        lastError: error.message
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const message = (error as Error).message ?? 'Unknown error';
    await writeStatus({
      ok: false,
      lastError: message
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
