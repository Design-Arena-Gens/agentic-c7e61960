import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoTweet Agent',
  description: 'Autonomous agent that crafts and publishes tweets on a schedule.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
