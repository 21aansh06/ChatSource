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
import { BookPlus, FolderPlus, RefreshCw, AlertCircle } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-medium">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Your Notebooks</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Containers holding multi-format sources for grounded RAG research.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 shrink-0 shadow-xs"
        >
          <BookPlus className="h-4 w-4" />
          <span>New Notebook</span>
        </Button>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-brand-medium bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-12 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <div className="pt-3 border-t border-brand-medium flex justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-brand-dark bg-brand-medium/50 p-6 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="h-12 w-12 rounded-full bg-brand-medium border border-brand-dark flex items-center justify-center mx-auto text-foreground">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Failed to Load Notebooks</h3>
            <p className="text-xs text-muted-foreground mt-1">
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
        <div className="rounded-xl border border-dashed border-brand-dark bg-card p-12 text-center space-y-5 max-w-md mx-auto my-12">
          <div className="h-16 w-16 rounded-2xl bg-brand-medium border border-brand-dark flex items-center justify-center mx-auto text-foreground shadow-xs">
            <FolderPlus className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-foreground">No Notebooks Yet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create your first notebook container to ingest PDF documents, website URLs, or raw text notes.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <BookPlus className="h-4 w-4" />
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
