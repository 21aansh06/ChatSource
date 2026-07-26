'use client';

import React from 'react';
import Link from 'next/link';
import { Notebook } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Edit2, Trash2, ArrowRight } from 'lucide-react';

interface NotebookCardProps {
  notebook: Notebook;
  onEdit: (notebook: Notebook) => void;
  onDelete: (notebook: Notebook) => void;
}

export function NotebookCard({ notebook, onEdit, onDelete }: NotebookCardProps) {
  const formattedDate = new Date(notebook.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-brand-dark bg-card p-5 transition-all duration-200 hover:border-primary hover:shadow-md">
      <div>
        {/* Top bar with icon & actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-medium border border-brand-dark text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-1 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(notebook)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-medium hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Edit Notebook"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(notebook)}
              className="rounded-md p-1.5 bg-gray-200 text-red-600 hover:bg-brand-medium hover:text-red-800 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Delete Notebook"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          <Link href={`/notebooks/${notebook.id}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            {notebook.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.25rem]">
          {notebook.description || 'No description provided.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3 border-t border-brand-medium flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {formattedDate}</span>
        </div>

        <Link
          href={`/notebooks/${notebook.id}`}
          className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <span>Open</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
