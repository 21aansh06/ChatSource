'use client';

import Link from 'next/link';
import { useAuth, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';
import { BookOpen, Sparkles, FolderKanban } from 'lucide-react';

export function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-medium bg-brand-light/95 backdrop-blur support-[backdrop-filter]:bg-brand-light/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <Link 
          href="/" 
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark rounded-md p-1"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-none tracking-tight text-foreground">
              NotebookLM <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-brand-medium border border-brand-dark text-foreground ml-1">Source</span>
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">Ground-Truth RAG Workspace</span>
          </div>
        </Link>

        {/* Right Navigation & Auth Actions */}
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-brand-medium" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link
                href="/notebooks"
                className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-md bg-brand-medium hover:bg-brand-dark transition-colors border border-brand-dark text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FolderKanban className="h-4 w-4" />
                <span>My Notebooks</span>
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border border-brand-dark"
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="text-sm font-medium px-3.5 py-2 rounded-md hover:bg-brand-medium transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>Get Started</span>
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
