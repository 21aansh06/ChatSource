'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotebookQuery } from '@/features/notebooks/api/use-notebooks';
import { EditNotebookDialog } from '@/features/notebooks/components/EditNotebookDialog';
import { DeleteNotebookDialog } from '@/features/notebooks/components/DeleteNotebookDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2, ArrowLeft, BookOpen, Layers, MessageSquare, ShieldCheck, Plus, Info } from 'lucide-react';

import { SourceList } from '@/features/sources/components/SourceList';
import { ChatInterface } from '@/features/chat/components/ChatInterface';
import { useSourcesQuery } from '@/features/sources/api/use-sources';
import { AddSourceDialog } from '@/features/sources/components/AddSourceDialog';

interface NotebookDetailPageProps {
  params: Promise<{ notebookId: string }>;
}

export default function NotebookDetailPage({ params }: NotebookDetailPageProps) {
  const { notebookId } = use(params);
  const router = useRouter();
  const { data: notebook, isLoading, isError, error } = useNotebookQuery(notebookId);
  const { data: sources } = useSourcesQuery(notebookId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  // Mobile View Tab Switcher State (Sources vs Chat)
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat'>('chat');

  const readySourcesCount = sources?.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'READY'
  ).length || 0;

  const totalSourcesCount = sources?.length || 0;
  const hasReadySources = readySourcesCount > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden w-full bg-slate-50/50 font-sans">
      {/* 1. Fixed Header Bar (Shrink-0) */}
      <div className="border-b border-slate-200/80 bg-white shrink-0 shadow-2xs z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Breadcrumb & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/notebooks"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Notebooks</span>
              </Link>

              <span className="text-slate-300">/</span>

              {isLoading ? (
                <Skeleton className="h-6 w-48 rounded-lg" />
              ) : notebook ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="h-3.5 w-3.5 text-sky-400" />
                  </div>
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate font-heading tracking-tight">
                    {notebook.title}
                  </h1>

                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit Notebook Title"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {notebook.description && (
                    <button
                      onClick={() => setShowDescription(!showDescription)}
                      className={`p-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        showDescription ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Toggle Description Scope"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right: Actions & Mobile Switcher */}
            {notebook && (
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Readiness Metric Pill */}
                <div className="hidden md:flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                  <span>{readySourcesCount}/{totalSourcesCount} Ready</span>
                </div>

                {/* Mobile View Switcher Tabs */}
                <div className="flex sm:hidden items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setMobileTab('sources')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      mobileTab === 'sources'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Sources ({totalSourcesCount})
                  </button>
                  <button
                    onClick={() => setMobileTab('chat')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      mobileTab === 'chat'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Chat
                  </button>
                </div>

                <Button
                  onClick={() => setIsAddSourceOpen(true)}
                  size="sm"
                  className="gap-1.5 shadow-2xs font-semibold bg-sky-500 text-white hover:bg-sky-600 border-0"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Source</span>
                </Button>

                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Notebook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Description Collapsible Banner */}
          {notebook?.description && showDescription && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 animate-in fade-in-0 duration-150">
              <span className="font-bold text-slate-900 mr-2 font-heading">Notebook Description:</span>
              {notebook.description}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Fixed Viewport Grid (Flex-1 overflow-hidden) */}
      <div className="flex-1 overflow-hidden mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 w-full h-full">
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full overflow-hidden">
            <Skeleton className="lg:col-span-4 h-full rounded-2xl" />
            <Skeleton className="lg:col-span-8 h-full rounded-2xl" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 font-heading">Notebook Not Found</h3>
            <p className="text-xs text-slate-500">
              {error?.message || 'This notebook does not exist or you do not have permission to view it.'}
            </p>
            <Button onClick={() => router.push('/notebooks')} variant="outline" className="gap-2 mx-auto">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Notebooks</span>
            </Button>
          </div>
        )}

        {!isLoading && !isError && notebook && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full overflow-hidden">
            {/* Left Column: Source Library Sidebar */}
            <div className={`lg:col-span-4 h-full overflow-hidden ${mobileTab === 'sources' ? 'block' : 'hidden lg:block'}`}>
              <SourceList
                notebookId={notebookId}
                onOpenAddDialog={() => setIsAddSourceOpen(true)}
              />
            </div>

            {/* Right Column: Grounded Chat Studio Canvas */}
            <div className={`lg:col-span-8 h-full overflow-hidden ${mobileTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
              <ChatInterface notebookId={notebookId} hasReadySources={hasReadySources} />
            </div>
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      <AddSourceDialog
        notebookId={notebookId}
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
      />

      <EditNotebookDialog
        notebook={notebook || null}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <DeleteNotebookDialog
        notebook={notebook || null}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={() => router.push('/notebooks')}
      />
    </div>
  );
}
