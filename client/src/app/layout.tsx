import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChatSource | Your Sources. Your Answers.',
  description: 'Turn your PDFs, YouTube videos, website links, and notes into grounded answers with verifiable citations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-sky-100 selection:text-slate-900">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
