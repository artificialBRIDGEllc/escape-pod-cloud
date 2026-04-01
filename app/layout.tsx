import type { Metadata } from 'next';
import './globals.css';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'AI Escape Pod';
const appDesc = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Your private AI — no limits, no tracking, always on.';

export const metadata: Metadata = {
  title: appName,
  description: appDesc,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ background: '#030407' }}>
        {children}
      </body>
    </html>
  );
}
