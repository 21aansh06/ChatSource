'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotebooksQuery } from '../api/use-notebooks';
import { NotebookCard } from './NotebookCard';
import { CreateNotebookDialog } from './CreateNotebookDialog';
import { EditNotebookDialog } from './EditNotebookDialog';
import { DeleteNotebookDialog } from './DeleteNotebookDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Notebook } from '@/lib/api/types';
import { BookPlus, FolderPlus, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';

export function NotebookList() {
  const router = useRouter();
  const { data: notebooks, isLoading, isError, error, refetch } = useNotebooksQuery();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [deletingNotebook, setDeletingNotebook] = useState<Notebook | null>(null);

  const handleCreateSuccess = (newNotebookId: string) => {
    router.push(`/notebooks/${newNotebookId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Your Notebooks
            </h1>
            {notebooks && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono">
                {notebooks.length}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize multi-format sources (PDFs, YouTube URLs, websites, notes) into grounded notebooks.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 shrink-0 shadow-sm"
        >
          <BookPlus className="h-4 w-4 text-sky-400" />
          <span>Create New Notebook</span>
        </Button>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="h-12 w-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 font-heading">Failed to Load Notebooks</h3>
            <p className="text-xs text-slate-600 mt-1">
              {error?.message || 'An error occurred while communicating with the backend API.'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2 mx-auto">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && notebooks?.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-5 max-w-md mx-auto my-12 shadow-2xs">
          <div className="h-16 w-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-sky-600 shadow-2xs">
            <FolderPlus className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-slate-900 font-heading">No Notebooks Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create your first notebook container to ingest PDF documents, YouTube lectures, website links, or text notes.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
            <BookPlus className="h-4 w-4 text-sky-400" />
            <span>Create First Notebook</span>
          </Button>
        </div>
      )}

      {/* Data Grid State */}
      {!isLoading && !isError && notebooks && notebooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              onEdit={(nb) => setEditingNotebook(nb)}
              onDelete={(nb) => setDeletingNotebook(nb)}
            />
          ))}
        </div>
      )}

      {/* Dialog Modals */}
      <CreateNotebookDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditNotebookDialog
        notebook={editingNotebook}
        isOpen={Boolean(editingNotebook)}
        onClose={() => setEditingNotebook(null)}
      />

      <DeleteNotebookDialog
        notebook={deletingNotebook}
        isOpen={Boolean(deletingNotebook)}
        onClose={() => setDeletingNotebook(null)}
      />
    </div>
  );
}
