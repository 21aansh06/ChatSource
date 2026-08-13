'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useCurrentUserQuery } from '@/features/users/api/use-user';
import { LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserAvatar() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { data: dbUser } = useCurrentUserQuery();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const email =
    dbUser?.email ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';

  const firstName = dbUser?.firstName || clerkUser?.firstName || '';
  const lastName = dbUser?.lastName || clerkUser?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0] || 'User';

  const initialLetter = (firstName ? firstName[0] : email ? email[0] : 'U').toUpperCase();

  const plan = dbUser?.plan || 'FREE';
  const isPaid = plan === 'PAID';

  return (
    <div ref={containerRef} className="relative inline-block text-left font-sans">
      {/* Avatar Button Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2 rounded-full p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        title={`${fullName} (${email}) - ${plan} Plan`}
      >
        {/* Avatar Circle with Initial */}
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-extrabold text-sm shadow-md border-2 border-white group-hover:border-sky-400 transition-colors">
          <span>{initialLetter}</span>

          {/* Micro Plan Pill Badge on Avatar Corner */}
          <span
            className={cn(
              "absolute -bottom-1.5 -right-2 flex h-3.5 px-1 items-center justify-center rounded-full text-[8px] font-extrabold tracking-tight uppercase border border-white text-white shadow-2xs font-mono",
              isPaid ? "bg-emerald-500" : "bg-sky-500"
            )}
          >
            {plan}
          </span>
        </div>
      </button>

      {/* Hover / Click Dropdown Profile Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xl ring-1 ring-slate-900/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
          {/* Top User Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-black text-base shadow-xs shrink-0 font-heading">
              {initialLetter}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 truncate font-heading">{fullName}</p>
                <span
                  className={cn(
                    "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border font-mono shrink-0",
                    isPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-sky-50 text-sky-700 border-sky-200"
                  )}
                >
                  {plan}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5" title={email}>
                {email}
              </p>
            </div>
          </div>

          {/* Plan Summary Banner */}
          <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-semibold">
              <Shield className="h-3.5 w-3.5 text-sky-600" />
              <span>Current Account Plan:</span>
            </div>
            <span className="font-extrabold text-slate-900 font-mono text-[11px]">{plan}</span>
          </div>

          {/* Sign Out Action Button */}
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
