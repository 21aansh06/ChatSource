'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSourceMutation } from '../api/use-sources';
import { SourceType } from '@/lib/api/types';
import { FileText, Globe, AlignLeft, Upload, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schemas for the 3 tabs
const pdfSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
});

const websiteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  url: z.string().url('Please enter a valid website URL starting with http:// or https://'),
});

const textSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  rawText: z.string().min(10, 'Raw text must be at least 10 characters').max(50000, 'Text cannot exceed 50,000 characters'),
});

interface AddSourceDialogProps {
  notebookId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddSourceDialog({ notebookId, isOpen, onClose }: AddSourceDialogProps) {
  const [activeTab, setActiveTab] = useState<SourceType>('PDF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const createMutation = useCreateSourceMutation(notebookId);

  // Forms for each tab
  const pdfForm = useForm<z.infer<typeof pdfSchema>>({
    resolver: zodResolver(pdfSchema),
    defaultValues: { title: '' },
  });

  const websiteForm = useForm<z.infer<typeof websiteSchema>>({
    resolver: zodResolver(websiteSchema),
    defaultValues: { title: '', url: '' },
  });

  const textForm = useForm<z.infer<typeof textSchema>>({
    resolver: zodResolver(textSchema),
    defaultValues: { title: '', rawText: '' },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setFileError('Only PDF files are supported.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileError('File size exceeds 50MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!pdfForm.getValues('title')) {
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      pdfForm.setValue('title', cleanTitle);
    }
  };

  const onSubmitPDF = async (data: z.infer<typeof pdfSchema>) => {
    if (!selectedFile) {
      setFileError('Please select a PDF file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', 'PDF');
    formData.append('file', selectedFile);

    try {
      await createMutation.mutateAsync(formData);
      handleClose();
    } catch (err: any) {
      console.error('PDF Source Creation Error:', err);
    }
  };

  const onSubmitWebsite = async (data: z.infer<typeof websiteSchema>) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', 'WEBSITE');
    formData.append('url', data.url);

    try {
      await createMutation.mutateAsync(formData);
      handleClose();
    } catch (err: any) {
      console.error('Website Source Creation Error:', err);
    }
  };

  const onSubmitText = async (data: z.infer<typeof textSchema>) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', 'TEXT');
    formData.append('rawText', data.rawText);

    try {
      await createMutation.mutateAsync(formData);
      handleClose();
    } catch (err: any) {
      console.error('Raw Text Source Creation Error:', err);
    }
  };

  const handleClose = () => {
    pdfForm.reset();
    websiteForm.reset();
    textForm.reset();
    setSelectedFile(null);
    setFileError(null);
    createMutation.reset();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Source Container"
      description="Sources are indexed into background chunks for notebook chat."
    >
      <div className="space-y-4">
        {/* Source Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-brand-medium p-1 border border-brand-dark">
          <button
            type="button"
            onClick={() => setActiveTab('PDF')}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeTab === 'PDF'
                ? "bg-card text-foreground shadow-xs border border-brand-dark"
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>PDF Document</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WEBSITE')}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeTab === 'WEBSITE'
                ? "bg-card text-foreground shadow-xs border border-brand-dark"
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
          >
            <Globe className="h-4 w-4" />
            <span>Website Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TEXT')}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeTab === 'TEXT'
                ? "bg-card text-foreground shadow-xs border border-brand-dark"
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
          >
            <AlignLeft className="h-4 w-4" />
            <span>Raw Text</span>
          </button>
        </div>

        {/* Global Mutation Error Display */}
        {createMutation.isError && (
          <div className="rounded-md bg-brand-medium border border-brand-dark p-3 text-xs text-foreground font-semibold">
            {createMutation.error?.message || 'Failed to submit source. Please check backend connection.'}
          </div>
        )}

        {/* TAB 1: PDF UPLOAD */}
        {activeTab === 'PDF' && (
          <form onSubmit={pdfForm.handleSubmit(onSubmitPDF)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Source Title</label>
              <Input
                {...pdfForm.register('title')}
                placeholder="e.g. Annual Financial Report 2025"
                disabled={createMutation.isPending}
              />
              {pdfForm.formState.errors.title && (
                <p className="text-xs text-foreground font-semibold">{pdfForm.formState.errors.title.message}</p>
              )}
            </div>

            {/* File Dropzone / Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">PDF File Upload</label>
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors bg-brand-light",
                  selectedFile ? "border-foreground bg-brand-medium/50" : "border-brand-dark hover:border-foreground"
                )}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={createMutation.isPending}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-10 w-10 rounded-lg bg-brand-medium border border-brand-dark flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold truncate max-w-[220px]">{selectedFile.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-foreground ml-2" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-brand-medium border border-brand-dark flex items-center justify-center text-foreground">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-foreground">Click to select PDF</span> or drag & drop file
                    </div>
                    <p className="text-[11px] text-muted-foreground">Supports PDF documents up to 50MB</p>
                  </div>
                )}
              </div>
              {fileError && <p className="text-xs text-foreground font-semibold">{fileError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-medium">
              <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !selectedFile} className="gap-1.5">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading PDF...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Upload & Ingest PDF</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: WEBSITE URL SUBMISSION */}
        {activeTab === 'WEBSITE' && (
          <form onSubmit={websiteForm.handleSubmit(onSubmitWebsite)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Source Title</label>
              <Input
                {...websiteForm.register('title')}
                placeholder="e.g. TanStack Query Documentation"
                disabled={createMutation.isPending}
              />
              {websiteForm.formState.errors.title && (
                <p className="text-xs text-foreground font-semibold">{websiteForm.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Website URL</label>
              <Input
                {...websiteForm.register('url')}
                placeholder="https://example.com/article"
                type="url"
                disabled={createMutation.isPending}
              />
              {websiteForm.formState.errors.url && (
                <p className="text-xs text-foreground font-semibold">{websiteForm.formState.errors.url.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-medium">
              <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-1.5">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scraping URL...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Ingest Website URL</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: RAW TEXT SUBMISSION */}
        {activeTab === 'TEXT' && (
          <form onSubmit={textForm.handleSubmit(onSubmitText)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Source Title</label>
              <Input
                {...textForm.register('title')}
                placeholder="e.g. Architecture Overview Notes"
                disabled={createMutation.isPending}
              />
              {textForm.formState.errors.title && (
                <p className="text-xs text-foreground font-semibold">{textForm.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Raw Text Content</label>
              <Textarea
                {...textForm.register('rawText')}
                placeholder="Paste raw markdown, meeting notes, code summaries, or transcripts here..."
                rows={6}
                disabled={createMutation.isPending}
              />
              {textForm.formState.errors.rawText && (
                <p className="text-xs text-foreground font-semibold">{textForm.formState.errors.rawText.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-medium">
              <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-1.5">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Text...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Ingest Raw Text</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
