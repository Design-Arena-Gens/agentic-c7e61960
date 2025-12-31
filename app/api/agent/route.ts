import { NextResponse } from 'next/server';
import { generateTweet } from '@/lib/generator';
import { postTweet, TwitterConfigError } from '@/lib/twitter';
import { writeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topicParam = url.searchParams.get('topic') ?? undefined;

  try {
    const draft = await generateTweet({ topic: topicParam });

    await postTweet({
      text: draft.tweet,
      metadata: {
        ...draft.metadata,
        trigger: 'cron'
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof TwitterConfigError ? error.message : (error as Error).message;
    await writeStatus({
      ok: false,
      lastError: message
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
