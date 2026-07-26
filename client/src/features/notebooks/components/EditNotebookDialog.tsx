'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateNotebookMutation } from '../api/use-notebooks';
import { Notebook } from '@/lib/api/types';
import { Loader2, Save } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Notebook title is required').max(150, 'Title cannot exceed 150 characters').trim(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditNotebookDialogProps {
  notebook: Notebook | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditNotebookDialog({ notebook, isOpen, onClose }: EditNotebookDialogProps) {
  const updateMutation = useUpdateNotebookMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (notebook) {
      setValue('title', notebook.title);
      setValue('description', notebook.description || '');
    }
  }, [notebook, setValue]);

  if (!notebook) return null;

  const onSubmit = async (data: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: notebook.id,
        input: {
          title: data.title,
          description: data.description || undefined,
        },
      });
      onClose();
    } catch (err) {
      console.error('Failed to update notebook:', err);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Notebook Details"
      description="Update notebook title or description."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {updateMutation.isError && (
          <div className="rounded-md bg-brand-medium border border-brand-dark p-3 text-xs text-foreground font-medium">
            {updateMutation.error?.message || 'Failed to update notebook.'}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Title</label>
          <Input
            {...register('title')}
            disabled={isSubmitting || updateMutation.isPending}
          />
          {errors.title && (
            <p className="text-xs text-foreground font-semibold">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Description</label>
          <Textarea
            {...register('description')}
            rows={3}
            disabled={isSubmitting || updateMutation.isPending}
          />
          {errors.description && (
            <p className="text-xs text-foreground font-semibold">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-medium">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="gap-1.5"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
