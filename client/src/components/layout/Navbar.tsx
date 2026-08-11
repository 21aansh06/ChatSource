'use client';

import Link from 'next/link';
import { useAuth, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';
import { BookOpen, Sparkles, FolderKanban } from 'lucide-react';

export function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md support-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="group flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1 min-w-0"
        >
          <div className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/10 group-hover:bg-slate-800 transition-colors shrink-0">
            <BookOpen className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-sky-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 font-heading truncate">
                ChatSource
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
                Workspace
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 hidden md:inline-block">
              Your Sources. Your Answers.
            </span>
          </div>
        </Link>

        {/* Right Navigation & Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isLoaded ? (
            <div className="h-9 w-20 sm:w-24 animate-pulse rounded-lg bg-slate-200" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/notebooks"
                className="cursor-pointer inline-flex items-center gap-1.5 sm:gap-2 text-xs font-semibold px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400" />
                <span>My Notebooks</span>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 sm:w-9 sm:h-9 border-2 border-slate-200 shadow-xs hover:border-sky-400 transition-colors"
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <SignInButton mode="modal">
                <button className="cursor-pointer text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="hidden xs:inline sm:hidden">Try Free</span>
                  <span className="hidden sm:inline">Try ChatSource Free</span>
                  <span className="xs:hidden">Free</span>
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
