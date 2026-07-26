import type { Metadata } from 'next';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatSource | Ground-Truth RAG Workspace',
  description: 'Grounded Notebook RAG platform for parsing, chunking, and chatting with PDFs, Website URLs, and Raw Text sources.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-brand-light text-foreground antialiased selection:bg-brand-dark selection:text-foreground">
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
