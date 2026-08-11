'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNotebookMutation } from '../api/use-notebooks';
import { Loader2, Plus, BookOpen } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Notebook title is required').max(150, 'Title cannot exceed 150 characters').trim(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateNotebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (notebookId: string) => void;
}

export function CreateNotebookDialog({ isOpen, onClose, onSuccess }: CreateNotebookDialogProps) {
  const createMutation = useCreateNotebookMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const created = await createMutation.mutateAsync({
        title: data.title,
        description: data.description || undefined,
      });
      reset();
      onClose();
      if (onSuccess && created.id) {
        onSuccess(created.id);
      }
    } catch (err: any) {
      console.error('Failed to create notebook:', err);
    }
  };

  const handleClose = () => {
    reset();
    createMutation.reset();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Notebook"
      description="Containers hold PDF documents, YouTube videos, website links, and notes."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {createMutation.isError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
            {createMutation.error?.message || 'Failed to create notebook. Please try again.'}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900 font-heading">
            Title <span className="text-rose-500">*</span>
          </label>
          <Input
            {...register('title')}
            placeholder="e.g. Q3 Financial Research & Analysis"
            disabled={isSubmitting || createMutation.isPending}
            autoFocus
          />
          {errors.title && (
            <p className="text-xs text-rose-600 font-medium">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900 font-heading">
            Description <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </label>
          <Textarea
            {...register('description')}
            placeholder="Key background notes, scope, or research objectives..."
            rows={3}
            disabled={isSubmitting || createMutation.isPending}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 font-medium">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="gap-1.5 shadow-sm"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-sky-400" />
                <span>Create Notebook</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
