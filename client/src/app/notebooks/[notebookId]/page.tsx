'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotebookQuery } from '@/features/notebooks/api/use-notebooks';
import { EditNotebookDialog } from '@/features/notebooks/components/EditNotebookDialog';
import { DeleteNotebookDialog } from '@/features/notebooks/components/DeleteNotebookDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Edit2, Trash2, ArrowLeft, BookOpen, Layers, MessageSquare } from 'lucide-react';

import { SourceList } from '@/features/sources/components/SourceList';

interface NotebookDetailPageProps {
  params: Promise<{ notebookId: string }>;
}

export default function NotebookDetailPage({ params }: NotebookDetailPageProps) {
  const { notebookId } = use(params);
  const router = useRouter();
  const { data: notebook, isLoading, isError, error } = useNotebookQuery(notebookId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full">
      {/* Top Header / Breadcrumb Bar */}
      <div className="border-b border-brand-medium bg-brand-light py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Breadcrumbs & Title */}
          <div className="space-y-1">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/notebooks" className="hover:text-foreground flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Notebooks</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-brand-dark" />
              <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                {isLoading ? 'Loading...' : notebook?.title || 'Notebook Detail'}
              </span>
            </nav>

            {isLoading ? (
              <Skeleton className="h-7 w-64 mt-1 rounded" />
            ) : notebook ? (
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {notebook.title}
                </h1>
              </div>
            ) : null}
          </div>

          {/* Action buttons */}
          {notebook && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="gap-1.5 text-foreground hover:bg-brand-dark"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full">
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-brand-dark bg-brand-medium/50 p-8 text-center space-y-4 max-w-md mx-auto my-12">
            <h3 className="font-bold text-lg text-foreground">Notebook Not Found</h3>
            <p className="text-xs text-muted-foreground">
              {error?.message || 'This notebook does not exist or you do not have permission to view it.'}
            </p>
            <Button onClick={() => router.push('/notebooks')} variant="outline" className="gap-2 mx-auto">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Notebooks</span>
            </Button>
          </div>
        )}

        {!isLoading && !isError && notebook && (
          <div className="space-y-6">
            {/* Description Banner */}
            {notebook.description && (
              <div className="rounded-xl border border-brand-medium bg-card p-4 text-xs md:text-sm text-foreground leading-relaxed">
                <span className="font-bold mr-2 text-muted-foreground">Description:</span>
                {notebook.description}
              </div>
            )}

            {/* Workspace Grid: Sources Panel + Chat Session Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sources Panel */}
              <div className="lg:col-span-6">
                <SourceList notebookId={notebookId} />
              </div>

              {/* Chat Session Panel Placeholder for Step 4 */}
              <div className="lg:col-span-6 rounded-xl border border-brand-medium bg-card p-6 min-h-[420px] flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-brand-medium border border-brand-dark flex items-center justify-center text-foreground">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Notebook Chat Session</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Real-time SSE token streaming and interactive location citations will be connected in Step 4.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Modals */}
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
