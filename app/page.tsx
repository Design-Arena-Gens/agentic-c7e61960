'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import { Fragment, useEffect, useState } from 'react';
import styles from './page.module.css';

type PreviewResponse = {
  tweet: string;
  metadata: Record<string, string | number>;
};

type AgentStatus = {
  ok: boolean;
  lastRun?: string;
  lastError?: string;
};

const emptyPreview: PreviewResponse = {
  tweet: '',
  metadata: {}
};

export default function Home() {
  const [preview, setPreview] = useState<PreviewResponse>(emptyPreview);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingTweet, setLoadingTweet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formValue, setFormValue] = useState('');

  useEffect(() => {
    const timer = toast
      ? setTimeout(() => {
          setToast(null);
        }, 4000)
      : undefined;
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [toast]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        body: JSON.stringify({ topic: formValue || undefined }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Preview request failed: ${response.statusText}`);
      }

      const data = (await response.json()) as PreviewResponse;
      setPreview(data);
      setToast('Generated fresh draft tweet');
    } catch (error) {
      console.error(error);
      setToast((error as Error).message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const triggerTweet = async () => {
    if (!preview.tweet) {
      setToast('Generate a preview before sending.');
      return;
    }

    setLoadingTweet(true);
    try {
      const response = await fetch('/api/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet: preview.tweet,
          metadata: preview.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to tweet: ${response.statusText}`);
      }

      const { ok } = (await response.json()) as { ok: boolean };

      setToast(ok ? 'Tweet published successfully' : 'Tweet not published');
      await refreshStatus();
    } catch (error) {
      console.error(error);
      setToast((error as Error).message);
    } finally {
      setLoadingTweet(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Unable to load agent status');
      }
      const data = (await response.json()) as AgentStatus;
      setStatus(data);
    } catch (error) {
      console.error(error);
      setStatus({
        ok: false,
        lastError: (error as Error).message
      });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    refreshStatus().catch(console.error);
    fetchPreview().catch(console.error);
  }, []);

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <h1>Autonomous Tweet Agent</h1>
        <p>
          Configure, generate, and launch AI-assisted tweets. The agent executes automatically via
          scheduled runs and you can trigger manual posts here.
        </p>
      </section>

      <section className={styles.controls}>
        <div className={styles.controlCard}>
          <h2>Draft Controller</h2>
          <p>Optionally steer the agent with a topic prompt before generating.</p>
          <label className={styles.fieldLabel} htmlFor="topic">
            Topic prompt (optional)
          </label>
          <input
            id="topic"
            type="text"
            placeholder="AI, startups, productivity..."
            value={formValue}
            onChange={(event) => setFormValue(event.target.value)}
            className={styles.textInput}
          />
          <button className={styles.button} onClick={fetchPreview} disabled={loadingPreview}>
            {loadingPreview ? 'Generating…' : 'Generate Draft'}
          </button>
        </div>

        <div className={styles.controlCard}>
          <h2>Publish</h2>
          <p>Use the current draft tweet and push it live immediately.</p>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={triggerTweet}
            disabled={loadingTweet}
          >
            {loadingTweet ? 'Publishing…' : 'Send Tweet Now'}
          </button>
        </div>

        <div className={styles.controlCard}>
          <h2>Agent Status</h2>
          <p>Last cron execution & diagnostics.</p>
          <button className={styles.button} onClick={refreshStatus}>
            Refresh Status
          </button>
          <dl className={styles.statusList}>
            <div className={styles.statusItem}>
              <dt>Health</dt>
              <dd>{status?.ok ? 'Operational' : 'Check configuration'}</dd>
            </div>
            {status?.lastRun ? (
              <div className={styles.statusItem}>
                <dt>Last Run</dt>
                <dd>{status.lastRun}</dd>
              </div>
            ) : null}
            {status?.lastError ? (
              <div className={styles.statusItem}>
                <dt>Last Error</dt>
                <dd className={styles.errorText}>{status.lastError}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <section className={styles.preview}>
        <h2>Live Draft</h2>
        {preview.tweet ? (
          <Fragment>
            <blockquote className={styles.quote}>{preview.tweet}</blockquote>
            <ul className={styles.metadataList}>
              {Object.entries(preview.metadata).map(([key, value]) => (
                <li key={key}>
                  <span>{key}</span>
                  <span>{String(value)}</span>
                </li>
              ))}
            </ul>
          </Fragment>
        ) : (
          <p className={styles.emptyState}>Generate a draft to see it here.</p>
        )}
      </section>

      {toast ? (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
