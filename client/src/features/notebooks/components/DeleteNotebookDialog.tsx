'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteNotebookMutation } from '../api/use-notebooks';
import { Notebook } from '@/lib/api/types';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteNotebookDialogProps {
  notebook: Notebook | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteNotebookDialog({ notebook, isOpen, onClose, onSuccess }: DeleteNotebookDialogProps) {
  const deleteMutation = useDeleteNotebookMutation();

  if (!notebook) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(notebook.id);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to delete notebook:', err);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Notebook"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4 text-slate-800">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-slate-900 text-sm mb-1 font-heading">Are you sure you want to delete this notebook?</p>
            <p>
              Deleting <span className="font-bold text-rose-700">{notebook.title}</span> will permanently remove the notebook container, all attached sources, vector indexes, and chat sessions.
            </p>
          </div>
        </div>

        {deleteMutation.isError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
            {deleteMutation.error?.message || 'Failed to delete notebook.'}
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
                <span>Confirm Delete</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
