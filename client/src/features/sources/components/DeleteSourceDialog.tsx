'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteSourceMutation } from '../api/use-sources';
import { Source } from '@/lib/api/types';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteSourceDialogProps {
  notebookId: string;
  source: Source | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteSourceDialog({
  notebookId,
  source,
  isOpen,
  onClose,
}: DeleteSourceDialogProps) {
  const deleteMutation = useDeleteSourceMutation(notebookId);

  if (!source) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(source.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Delete Source Container">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4 text-slate-800">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-slate-900 text-sm mb-1 font-heading">Are you sure you want to delete this source?</p>
            <p>
              Deleting <span className="font-bold text-rose-700">{source.title}</span> will purge its parsed chunks and vector embeddings from Qdrant.
            </p>
          </div>
        </div>

        {deleteMutation.isError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
            {deleteMutation.error?.message || 'Failed to delete source.'}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="gap-1.5 shadow-sm"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Source</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
