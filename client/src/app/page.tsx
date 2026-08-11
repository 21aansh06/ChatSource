'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, SignUpButton } from '@clerk/nextjs';
import {
  FileText,
  Globe,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Video,
  Layers,
  Zap,
  ChevronDown,
  Bookmark,
  GraduationCap,
  Code2,
  User
} from 'lucide-react';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Interactive Demo State
  const [activeDemoTab, setActiveDemoTab] = useState<'youtube' | 'pdf' | 'website'>('youtube');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const demoData = {
    youtube: {
      sourceTitle: 'MIT 18.06 Linear Algebra - Lecture 01: Matrix Vector Multiplication',
      sourceType: 'YouTube Video',
      sourceMeta: '1h 24m • Prof. Gilbert Strang',
      icon: Video,
      iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
      question: 'What is the column picture of matrix multiplication explained at 14:20?',
      answer: 'In the column picture, the matrix equation Ax = b means taking a linear combination of the columns of matrix A, where the components of vector x provide the weights/coefficients.',
      citation: {
        id: 1,
        label: '14:20 timestamp',
        detail: 'Prof. Strang: "The linear combination of columns yields the right hand vector b..."',
        badge: '14:20'
      }
    },
    pdf: {
      sourceTitle: 'Attention Is All You Need (Vaswani et al., 2017)',
      sourceType: 'PDF Document',
      sourceMeta: '15 Pages • 2.4 MB PDF',
      icon: FileText,
      iconBg: 'bg-sky-50 border-sky-200 text-sky-600',
      question: 'How is the multi-head attention mechanism computed according to Equation 2?',
      answer: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. It projects queries, keys, and values h times with learned projections.',
      citation: {
        id: 2,
        label: 'Page 4, Section 3.2.2',
        detail: 'Vaswani et al., Page 4: "MultiHead(Q,K,V) = Concat(head_1, ..., head_h)W^O where head_i = Attention(QW_i^Q, KW_i^K, VW_i^V)"',
        badge: 'Page 4'
      }
    },
    website: {
      sourceTitle: 'React 19 Official Documentation — Server Components Architecture',
      sourceType: 'Website Page',
      sourceMeta: 'https://react.dev/reference/rsc',
      icon: Globe,
      iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      question: 'How do React Server Components handle async data streaming without client bundle inflation?',
      answer: 'React Server Components execute exclusively on the server, outputting serializable UI trees streamed to the client over a single HTTP response without adding JavaScript code size to the client bundle.',
      citation: {
        id: 3,
        label: 'react.dev/reference/rsc#streaming',
        detail: 'React Docs: "Server Components are rendered into an intermediate payload format before streaming to client browser DOM..."',
        badge: 'react.dev'
      }
    }
  };

  const currentDemo = demoData[activeDemoTab];

  const faqs = [
    {
      q: 'What formats and sources does ChatSource support?',
      a: 'ChatSource seamlessly ingests PDF files (up to 50MB), YouTube video URLs with auto-extracted transcripts, public website page URLs, and raw markdown/plain text notes.'
    },
    {
      q: 'Can I ask follow-up questions within the same chat session?',
      a: 'Yes. Each notebook supports ongoing multi-turn conversations, preserving previous dialogue context while continuously referencing your uploaded sources.'
    },
    {
      q: 'Are my uploaded documents and data private?',
      a: 'Absolutely. Your notebook data is isolated to your personal workspace account. Your documents are never shared or used to train public LLM models.'
    },
    {
      q: 'Is YouTube transcript ingestion automatic?',
      a: 'Yes. Simply paste any public YouTube video link into your notebook, and ChatSource extracts the transcript and timestamps automatically.'
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50/50 font-sans overflow-x-hidden w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/40">
        {/* Background Accent Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-sky-200/30 via-indigo-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-sky-800 mb-6 sm:mb-8 shadow-2xs backdrop-blur-xs max-w-full">
            <Sparkles className="h-3.5 w-3.5 text-sky-600 animate-pulse shrink-0" />
            <span className="truncate">Your Sources. Your Answers.</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-[1.15] font-heading">
            Understand anything. <br className="hidden sm:inline" />
            <span className="gradient-heading">Just ask.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans px-2">
            Turn long PDFs, YouTube lectures, website links, and meeting notes into interactive conversations with verifiable citations down to the page or timestamp.
          </p>

          {/* CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto px-4">
            {!isLoaded ? (
              <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-200 mx-auto" />
            ) : isSignedIn ? (
              <Link
                href="/notebooks"
                className="cursor-pointer inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 w-full sm:w-auto"
              >
                <span>Go to My Notebooks</span>
                <ArrowRight className="h-4 w-4 text-sky-400" />
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="cursor-pointer inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 w-full sm:w-auto">
                    <span>Try ChatSource Free</span>
                    <ArrowRight className="h-4 w-4 text-sky-400" />
                  </button>
                </SignUpButton>
                <a
                  href="#demo"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 w-full sm:w-auto"
                >
                  <Play className="h-3.5 w-3.5 text-sky-600 fill-sky-600 shrink-0" />
                  <span>Explore Interactive Demo</span>
                </a>
              </>
            )}
          </div>

          {/* Visual Model Diagram: SOURCE -> ASK -> UNDERSTAND */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 text-left">
                {/* Step 1: SOURCE */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 relative group hover:border-sky-300 transition-all">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 font-mono">01. SOURCE</span>
                    <div className="flex gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <Video className="h-3.5 w-3.5 text-rose-500" />
                      <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 font-heading">Ingest Your Materials</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Upload PDFs, YouTube URLs, websites, or notes into isolated notebooks.
                  </p>
                </div>

                {/* Step 2: ASK */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 relative group hover:border-sky-300 transition-all">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 font-mono">02. ASK</span>
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 font-heading">Query Anything</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ask natural questions. ChatSource searches all ready sources at once.
                  </p>
                </div>

                {/* Step 3: UNDERSTAND */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 relative group hover:border-sky-300 transition-all">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 font-mono">03. UNDERSTAND</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 font-heading">Grounded Citation</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Receive answers streaming live with exact page & timestamp proof.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PRODUCT DEMO SECTION */}
      <section id="demo" className="py-12 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Interactive Preview</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              See How Grounded Answers Work
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto px-2">
              Select a sample source type below to test how ChatSource formats grounded answers with verifiable citations.
            </p>

            {/* Compact Responsive Source Type Selector Tabs */}
            <div className="mt-6 inline-flex max-w-full items-center justify-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs font-sans">
              <button
                onClick={() => setActiveDemoTab('youtube')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeDemoTab === 'youtube'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600 shrink-0" />
                <span>
                  <span className="inline sm:hidden">YouTube</span>
                  <span className="hidden sm:inline">YouTube Lecture</span>
                </span>
              </button>

              <button
                onClick={() => setActiveDemoTab('pdf')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeDemoTab === 'pdf'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600 shrink-0" />
                <span>
                  <span className="inline sm:hidden">PDF</span>
                  <span className="hidden sm:inline">PDF Paper</span>
                </span>
              </button>

              <button
                onClick={() => setActiveDemoTab('website')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeDemoTab === 'website'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
                <span>
                  <span className="inline sm:hidden">Website</span>
                  <span className="hidden sm:inline">Website Doc</span>
                </span>
              </button>
            </div>
          </div>

          {/* Demo Card Showcase */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg border shrink-0 ${currentDemo.iconBg}`}>
                  <currentDemo.icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 font-heading">
                    {currentDemo.sourceTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {currentDemo.sourceMeta}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-mono shrink-0">
                Indexed & Ready
              </span>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white">
              {/* User Prompt */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xs max-w-[90%] sm:max-w-[75%]">
                  <div className="flex items-start gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white font-heading">
                        You
                      </div>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed">
                        {currentDemo.question}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistant Grounded Answer */}
              <div className="flex items-start gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-3.5 max-w-full sm:max-w-2xl text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
                  {/* ChatSource Logo + Name */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="text-xs sm:text-[13px] font-bold text-slate-900 font-heading">
                      ChatSource Assistant
                    </div>
                  </div>

                  {/* Answer */}
                  <p className="leading-relaxed">{currentDemo.answer}</p>

                  {/* Verifiable Citation Pill */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5 font-heading">
                      <Bookmark className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Verifiable Citation Proof:</span>
                    </div>

                    <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl bg-slate-50 p-2.5 sm:p-3 border border-slate-200 text-xs w-full overflow-hidden">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                          [{currentDemo.citation.id}]
                        </span>

                        <span className="font-semibold text-slate-700">
                          {currentDemo.citation.label}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 italic break-words sm:truncate max-w-full">
                        &quot;{currentDemo.citation.detail}&quot;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS — PRODUCT WALKTHROUGH MEDIA SLOT */}
      <section className="py-12 sm:py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Product Walkthrough</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              From Raw Content to Clear Answers in Seconds
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto px-2">
              See the complete ChatSource workflow in action across sources, real-time token streaming, and inline reference lookup.
            </p>
          </div>

          {/* Media Player Slot Frame */}
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-4 shadow-xl overflow-hidden">
            {/* Screen Mockup Top Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 mb-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
              </div>
              <span className="font-mono text-[10px] sm:text-[11px] text-slate-500 truncate">chatsource.app / notebook-demo</span>
              <div className="w-8 sm:w-12" />
            </div>

            {/* Screen Recording Video / Media Container Slot */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center text-center p-4 sm:p-8 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-sky-950/40 to-slate-900" />

              <div className="relative z-10 space-y-3 sm:space-y-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mx-auto group-hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-sky-500/20 shrink-0">
                  <Play className="h-6 w-6 sm:h-8 sm:w-8 fill-sky-400 ml-0.5 sm:ml-1" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm sm:text-base text-white font-heading">ChatSource Product Demo Video</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mx-auto px-2">
                    Watch how ChatSource parses documents, ingests URLs, and generates grounded citations in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. USE CASES SECTION */}
      <section className="py-12 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Tailored For Every Workflow</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              Built for Grounded Research & Learning
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto px-2">
              Whether you are analyzing academic literature, reviewing code documentation, or studying YouTube lectures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: Students & Researchers */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
              <div>
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center mb-4">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">Students & Academics</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Turn dense 100-page textbooks and research PDFs into queryable study companions. Verify formulas and citations instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>PDF Page Citation Tracking</span>
              </div>
            </div>

            {/* Card 2: YouTube Learners */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
              <div>
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mb-4">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">YouTube Learners</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Extract transcripts from 2-hour video lectures or podcasts. Jump straight to exact timestamps where topics were discussed.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Clickable Video Timestamps</span>
              </div>
            </div>

            {/* Card 3: Developers & Professionals */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
              <div>
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">Developers & Professionals</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Ingest technical documentation sites, API specs, and internal meeting notes to query across multiple docs simultaneously.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Multi-Website URL Ingestion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHATSOURCE (BENEFITS) */}
      <section className="py-12 sm:py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Why ChatSource</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              Confidence Through Verifiable Proof
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto px-2">
              Never accept unverified AI answers. ChatSource provides exact citations so you can verify every single claim.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Grounded Answers</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Answers are synthesized strictly from your uploaded notebook materials with fallback notices when details are missing.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
                <Bookmark className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Location Citations</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Click any citation badge to view original source passages, PDF page numbers, or YouTube video timestamps.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-3">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Multi-Source Notebooks</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Group PDFs, web URLs, and notes into dedicated notebooks to query all related materials simultaneously.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Real-Time Streaming</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Responses stream token-by-token instantly as the model synthesizes information from your vector index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="py-12 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Got Questions?</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer font-heading gap-3"
                >
                  <span className="pr-2">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-sky-600' : ''
                    }`}
                  />
                </button>

                {activeFaq === idx && (
                  <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA BANNER */}
      <section className="py-12 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300 mb-6 backdrop-blur-xs max-w-full">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Ready to transform how you research?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-heading">
            Your sources. Your answers.
          </h2>

          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed px-2">
            Join students, researchers, developers, and professionals who save hours with grounded AI answers.
          </p>

          <div className="mt-8 flex justify-center px-4">
            {!isLoaded ? (
              <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-800" />
            ) : isSignedIn ? (
              <Link
                href="/notebooks"
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 w-full sm:w-auto"
              >
                <span>Go to My Notebooks</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 w-full sm:w-auto">
                  <span>Start ChatSource Free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="h-6 w-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/favicon.ico"
                alt="ChatSource logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-bold text-slate-900 font-heading">ChatSource</span>
            <span>&copy; {new Date().getFullYear()} — Grounded Workspace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
