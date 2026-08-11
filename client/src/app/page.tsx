'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  BookOpen,
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
  Check,
  ExternalLink,
  Bookmark,
  GraduationCap,
  Code2,
  AlignLeft,
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
      q: 'How does ChatSource generate answers grounded in my sources?',
      a: 'When you ask a question inside a notebook, ChatSource searches through your ready ingested material, extracts exact text chunks, and streams an answer backed by specific citation references (page numbers, YouTube timestamps, or section headings).'
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
    },
    {
      q: 'Can I cancel my account or change subscription tiers anytime?',
      a: 'Yes. You can manage your account and subscription preferences anytime from your settings.'
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50/50 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/40">
        {/* Subtle Background Accent Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-sky-200/30 via-indigo-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-4 py-1.5 text-xs font-semibold text-sky-800 mb-8 shadow-2xs backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
            <span>Your Sources. Your Answers.</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-[1.15] font-heading">
            Understand anything. <br className="hidden sm:inline" />
            <span className="gradient-heading">Just ask.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Turn long PDFs, YouTube lectures, website links, and meeting notes into interactive conversations with verifiable citations down to the page or timestamp.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {!isLoaded ? (
              <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-200" />
            ) : isSignedIn ? (
              <Link
                href="/notebooks"
                className="cursor-pointer inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <span>Go to My Notebooks</span>
                <ArrowRight className="h-4 w-4 text-sky-400" />
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="cursor-pointer inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                    <span>Try ChatSource Free</span>
                    <ArrowRight className="h-4 w-4 text-sky-400" />
                  </button>
                </SignUpButton>
                <a
                  href="#demo"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <Play className="h-3.5 w-3.5 text-sky-600 fill-sky-600" />
                  <span>Explore Interactive Demo</span>
                </a>
              </>
            )}
          </div>

          {/* Visual Model Diagram: SOURCE -> ASK -> UNDERSTAND */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Step 1: SOURCE */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 relative group hover:border-sky-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
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
                  <div className="flex items-center justify-between mb-3">
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
                  <div className="flex items-center justify-between mb-3">
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
      <section id="demo" className="py-16 md:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Interactive Preview</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              See How Grounded Answers Work
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Select a sample source type below to test how ChatSource formats grounded answers with verifiable citations.
            </p>

            {/* Source Type Selector Tabs */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1.5 border border-slate-200">
              <button
                onClick={() => setActiveDemoTab('youtube')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeDemoTab === 'youtube'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="h-4 w-4 text-rose-600" />
                <span>YouTube Lecture</span>
              </button>

              <button
                onClick={() => setActiveDemoTab('pdf')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeDemoTab === 'pdf'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-4 w-4 text-sky-600" />
                <span>PDF Paper</span>
              </button>

              <button
                onClick={() => setActiveDemoTab('website')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeDemoTab === 'website'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="h-4 w-4 text-emerald-600" />
                <span>Website Doc</span>
              </button>
            </div>
          </div>

          {/* Demo Card Showcase */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-2xl overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${currentDemo.iconBg}`}>
                  <currentDemo.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-1 font-heading">{currentDemo.sourceTitle}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{currentDemo.sourceMeta}</p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                Indexed & Ready
              </span>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="p-6 space-y-5 bg-slate-900">
              {/* User Prompt */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-sky-600 text-white px-4 py-3 rounded-2xl rounded-tr-xs text-xs sm:text-sm max-w-xl leading-relaxed shadow-sm">
                  {currentDemo.question}
                </div>
              </div>

              {/* Assistant Grounded Answer */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-xs p-5 space-y-3.5 max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed shadow-sm">
                  <p>{currentDemo.answer}</p>

                  {/* Verifiable Citation Pill */}
                  <div className="pt-3 border-t border-slate-700/80">
                    <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 font-heading">
                      <Bookmark className="h-3.5 w-3.5 text-amber-400" />
                      <span>Verifiable Citation Proof:</span>
                    </div>

                    <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl bg-slate-950 p-3 border border-slate-700/60 text-xs w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          [{currentDemo.citation.id}]
                        </span>
                        <span className="font-semibold text-slate-300">{currentDemo.citation.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 italic truncate max-w-xs sm:max-w-md">
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

      {/* 3. HOW IT WORKS — SCREEN-RECORDING / VIDEO MEDIA SLOT */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Product Walkthrough</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              From Raw Content to Clear Answers in Seconds
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              See the complete ChatSource workflow in action across sources, real-time token streaming, and inline reference lookup.
            </p>
          </div>

          {/* Media Player Slot Frame */}
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xl shadow-slate-300/40 overflow-hidden">
            {/* Screen Mockup Top Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
              </div>
              <span className="font-mono text-[11px] text-slate-500">chatsource.app / notebook-demo</span>
              <div className="w-12" />
            </div>

            {/* Screen Recording Video / Media Container Slot */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center text-center p-8 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-sky-950/40 to-slate-900" />

              <div className="relative z-10 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mx-auto group-hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-sky-500/20">
                  <Play className="h-8 w-8 fill-sky-400 ml-1" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-base text-white font-heading">ChatSource Product Demo Video</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Watch how ChatSource parses documents, ingests URLs, and generates grounded citations in real time.
                  </p>
                </div>
              </div>

              {/* 
                TODO: add product demo video here — replace this block with the real screen-recording/video asset
                Example replacement:
                <video controls poster="/assets/demo-thumbnail.png" className="w-full h-full object-cover rounded-xl">
                  <source src="/assets/chatsource-demo.mp4" type="video/mp4" />
                </video>
              */}
            </div>
          </div>
        </div>
      </section>

      {/* 4. USE CASES SECTION */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Tailored For Every Workflow</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              Built for Grounded Research & Learning
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Whether you are analyzing academic literature, reviewing code documentation, or studying YouTube lectures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Students & Researchers */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
              <div>
                <div className="h-11 w-11 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center mb-4">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Students & Academics</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Turn dense 100-page textbooks and research PDFs into queryable study companions. Verify formulas and citations instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>PDF Page Citation Tracking</span>
              </div>
            </div>

            {/* Card 2: YouTube Learners */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
              <div>
                <div className="h-11 w-11 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mb-4">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">YouTube Learners</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Extract transcripts from 2-hour video lectures or podcasts. Jump straight to exact timestamps where topics were discussed.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Clickable Video Timestamps</span>
              </div>
            </div>

            {/* Card 3: Developers & Professionals */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
              <div>
                <div className="h-11 w-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Developers & Professionals</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Ingest technical documentation sites, API specs, and internal meeting notes to query across multiple docs simultaneously.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Multi-Website URL Ingestion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHATSOURCE (BENEFITS) */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Why ChatSource</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              Confidence Through Verifiable Proof
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Never accept unverified AI answers. ChatSource provides exact citations so you can verify every single claim.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Grounded Answers</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Answers are synthesized strictly from your uploaded notebook materials with fallback notices when details are missing.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
                <Bookmark className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Location Citations</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Click any citation badge to view original source passages, PDF page numbers, or YouTube video timestamps.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-3">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">Multi-Source Notebooks</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Group PDFs, web URLs, and notes into dedicated notebooks to query all related materials simultaneously.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
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

      {/* 6. SOCIAL PROOF (CLEARLY MARKED PLACEHOLDERS) */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">User Reviews</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              Loved by Researchers & Learners
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Here is what early research users say about using ChatSource for grounded learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial Placeholder 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                &quot;Being able to click on a citation badge and jump straight to the page number in a 200-page PDF report saves me hours of manual searching.&quot;
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
                  [Placeholder]
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">[User Placeholder — Graduate Researcher]</h5>
                  <p className="text-[11px] text-slate-500">[University Research Lab]</p>
                </div>
              </div>
            </div>

            {/* Testimonial Placeholder 2 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                &quot;I paste YouTube lecture links into ChatSource and ask specific questions. The timestamp references let me double-check the professor&apos;s exact words.&quot;
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
                  [Placeholder]
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">[User Placeholder — Tech Student]</h5>
                  <p className="text-[11px] text-slate-500">[Computer Science Dept]</p>
                </div>
              </div>
            </div>

            {/* Testimonial Placeholder 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                &quot;Combining technical web documentation and raw meeting notes into a single notebook container makes onboarding new codebases twice as fast.&quot;
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
                  [Placeholder]
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">[User Placeholder — Software Engineer]</h5>
                  <p className="text-[11px] text-slate-500">[Product Engineering Team]</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 font-mono">Simple Pricing</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 font-heading">
              Start Free, Upgrade When You Grow
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Everything you need to organize sources and ask grounded questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">Starter</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-heading">Free Tier</h3>
                <p className="text-xs text-slate-500 mt-1">Perfect for individual study and trying out ChatSource.</p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900 font-heading">$0</span>
                  <span className="text-xs text-slate-500 font-medium"> / forever</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Up to 3 Notebook Containers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>PDF, YouTube, Website & Text Sources</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Grounded Location Citations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Real-Time Token Streaming</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <SignUpButton mode="modal">
                  <button className="w-full cursor-pointer py-3 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs">
                    Get Started Free
                  </button>
                </SignUpButton>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl border-2 border-sky-500 bg-white p-7 flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3 right-6 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 font-mono">Pro Workspace</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-heading">Pro Plan</h3>
                <p className="text-xs text-slate-500 mt-1">For intensive research, large PDFs, and unlimited notebooks.</p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900 font-heading">$12</span>
                  <span className="text-xs text-slate-500 font-medium"> / month [Placeholder]</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2 font-medium text-slate-900">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Unlimited Notebook Containers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Large PDF Uploads (up to 50MB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Priority Vector Processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Export Citation Snippets</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <SignUpButton mode="modal">
                  <button className="w-full cursor-pointer py-3 px-4 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md">
                    Start Pro Free Trial
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer font-heading"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-sky-600' : ''
                    }`}
                  />
                </button>

                {activeFaq === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA BANNER */}
      <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1 text-xs font-semibold text-sky-300 mb-6 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready to transform how you research?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-heading">
            Your sources. Your answers.
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join students, researchers, developers, and professionals who save hours with grounded AI answers.
          </p>

          <div className="mt-8 flex justify-center">
            {!isLoaded ? (
              <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-800" />
            ) : isSignedIn ? (
              <Link
                href="/notebooks"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25"
              >
                <span>Go to My Notebooks</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25">
                  <span>Start ChatSource Free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
              CS
            </div>
            <span className="font-bold text-slate-900 font-heading">ChatSource</span>
            <span>&copy; {new Date().getFullYear()} — Grounded RAG Workspace</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
