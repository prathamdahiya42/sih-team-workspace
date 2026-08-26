import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIH Team Collab — AI "7th Member" Platform',
  description: 'Real-time ideation, in-app Jitsi calls, and AI 7th Member summarization for Smart India Hackathon teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAFA] text-slate-900 antialiased selection:bg-saffron-200 selection:text-saffron-900">
        {children}
      </body>
    </html>
  );
}
