'use client';

import React from 'react';
import Link from 'next/link';
import { Notebook } from '@/lib/api/types';
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
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/50">
      <div>
        {/* Top bar with icon & actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/10 group-hover:bg-slate-800 transition-colors">
            <BookOpen className="h-5 w-5 text-sky-400" />
          </div>

          <div className="flex items-center gap-1 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(notebook)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              title="Edit Notebook"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(notebook)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              title="Delete Notebook"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors font-heading">
          <Link href={`/notebooks/${notebook.id}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md">
            {notebook.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2.25rem]">
          {notebook.description || 'No description provided.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>

        <Link
          href={`/notebooks/${notebook.id}`}
          className="inline-flex items-center gap-1 font-bold text-xs text-slate-900 hover:text-sky-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md"
        >
          <span>Open Notebook</span>
          <ArrowRight className="h-3.5 w-3.5 text-sky-500" />
        </Link>
      </div>
    </div>
  );
}
