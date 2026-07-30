'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, CodeArtifact, AttachedFile, GeneratedFile, OPENROUTER_MODELS } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { PhaseTracker } from './PhaseTracker';
import { AllFilesDrawer } from './AllFilesDrawer';
import {
  Menu,
  Send,
  Square,
  Sparkles,
  Code,
  Layout,
  Cpu,
  Zap,
  Terminal,
  FileCode,
  ArrowUpRight,
  Paperclip,
  X,
  FileText,
  AlertCircle,
  Loader2,
  PlayCircle,
  Folder,
  Globe,
  ImageIcon,
  TrendingUp,
  Compass,
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  generatedFiles?: GeneratedFile[];
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  activeSkill: 'none' | 'web_search' | 'deep_research' | 'finance' | 'contents' | 'hyper' | 'image';
  setActiveSkill: (skill: 'none' | 'web_search' | 'deep_research' | 'finance' | 'contents' | 'hyper' | 'image') => void;
  onSendMessage: (text: string, attachments?: AttachedFile[]) => void;
  onContinueGeneration: () => void;
  onStopStream: () => void;
  onOpenSidebar: () => void;
  onOpenArtifact: (artifact: CodeArtifact) => void;
  activeArtifact: CodeArtifact | null;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  generatedFiles = [],
  isLoading,
  selectedModel,
  onSelectModel,
  activeSkill,
  setActiveSkill,
  onSendMessage,
  onContinueGeneration,
  onStopStream,
  onOpenSidebar,
  onOpenArtifact,
  activeArtifact,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAllFilesDrawerOpen, setIsAllFilesDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAutoScrollPaused = useRef(false);

  const lastMessage = messages[messages.length - 1];
  const activePhases =
    isLoading && lastMessage && lastMessage.role === 'assistant'
      ? lastMessage.phases
      : null;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    isAutoScrollPaused.current = !isNearBottom;
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current && !isAutoScrollPaused.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isLoading ? 'auto' : 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      setErrorMessage(null);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    if (!isLoading) {
      onSendMessage(promptText);
    }
  };

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Ukuran file "${file.name}" melebihi batas maksimal 50 MB!`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        const base64Content = e.target?.result as string;
        const newFile: AttachedFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'image/png',
          content: base64Content,
        };
        setAttachments((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const textContent = (e.target?.result as string) || '';
        const newFile: AttachedFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: textContent,
        };
        setAttachments((prev) => [...prev, newFile]);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden bg-grid-pattern-light">
      {/* Kimi-style Right Drawer for "Semua File" */}
      <AllFilesDrawer
        isOpen={isAllFilesDrawerOpen}
        files={generatedFiles}
        onClose={() => setIsAllFilesDrawerOpen(false)}
        onOpenFile={(file) =>
          onOpenArtifact({
            id: file.id,
            title: `File: ${file.filename}`,
            language: file.language,
            code: file.code,
            filename: file.filename,
          })
        }
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-glow-radial pointer-events-none" />

      {/* Top Processing Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600/30 z-30 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 w-1/3 animate-[slide_1.5s_infinite_linear]" />
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-14 border-b border-gray-200 px-4 flex items-center justify-between bg-white/90 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Prominent Real-time Status Badge */}
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium shadow-sm animate-pulse">
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span className="font-semibold font-mono">SEDANG MEMPROSES... ({elapsedSeconds}s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System Ready</span>
            </div>
          )}
        </div>

        {/* Right Header Action Icons (Kimi-style "Semua file" button) */}
        <div className="flex items-center gap-3">
          {activeArtifact && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono">
              <Layout className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[180px]">{activeArtifact.title}</span>
            </div>
          )}

          <button
            onClick={() => setIsAllFilesDrawerOpen(!isAllFilesDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
              isAllFilesDrawerOpen
                ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900'
            }`}
            title="Buka Panel Semua File"
          >
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-sans">Semua file</span>
            <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${isAllFilesDrawerOpen ? 'bg-blue-700 text-white' : 'bg-gray-100 text-blue-600'}`}>
              {generatedFiles.length}
            </span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative z-0"
      >
        {messages.length === 0 ? (
          /* High-End Studio Hero Screen */
          <div className="h-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center py-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Rdir Studio Engine • Development Workspace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4 leading-tight">
              Wujudkan Aplikasi & Web Kelas Dunia
            </h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mb-10 leading-relaxed">
              Arsitektur pengembang otomatis untuk menghasilkan aplikasi web multi-file (HTML, CSS, JS, PHP, SVG) lengkap dengan{' '}
              <strong className="text-blue-600 font-semibold">Live Preview Workspace</strong> & analisis file hingga 50 MB.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan saya halaman Dashboard Analytics menggunakan HTML, CSS, dan Tailwind dengan tampilan dark mode modern dan chart SVG interaktif.'
                  )
                }
                className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Layout className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
                  Fullstack Web Dashboard
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Rancang Dashboard Analytics modern dengan Tailwind CSS & Live Preview.
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan kode kalkulator interaktif lengkap dengan HTML, CSS, dan JavaScript yang langsung bisa dicoba di Live View.'
                  )
                }
                className="bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Code className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors mb-1">
                  Kalkulator / Widget JS
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Buat komponen interaktif JavaScript lengkap dengan logic & UI.
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan sistem modul PHP lengkap dengan koneksi database MySQL, fungsi CRUD, dan tampilan HTML responsif.'
                  )
                }
                className="bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors mb-1">
                  PHP Backend & Engine
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Modul server-side PHP dengan query MySQL & arsitektur clean.
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan ilustrasi logo futuristik bertema AI dalam bentuk format SVG murni.'
                  )
                }
                className="bg-white border border-gray-200 hover:border-cyan-300 hover:shadow-md p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-cyan-600 transition-colors mb-1">
                  SVG Vector Graphic
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Generate aset ikon & ilustrasi vektor format SVG presisi tinggi.
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-transparent pb-6">
            {messages.map((msg, index) => {
              const isLastAssistant = index === messages.length - 1 && msg.role === 'assistant';
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLastAssistant={isLastAssistant}
                  isStreaming={isLoading && isLastAssistant}
                  onOpenArtifact={onOpenArtifact}
                  onOpenAllFiles={() => setIsAllFilesDrawerOpen(true)}
                  onContinueGeneration={onContinueGeneration}
                />
              );
            })}

            {/* High Visibility Animated Processing Card with Embedded Phase Execution Tracker */}
            {isLoading && activeSkill !== 'hyper' && (
              <div className="py-5 px-4 md:px-6 bg-white/90 border-y border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border ${activeSkill === 'image' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {activeSkill === 'image' ? <ImageIcon className="w-5 h-5 animate-pulse" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold flex items-center gap-2 font-mono ${activeSkill === 'image' ? 'text-purple-700' : 'text-blue-700'}`}>
                          <span className={`w-2 h-2 rounded-full animate-ping ${activeSkill === 'image' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                          {activeSkill === 'image' ? `MEMBUAT MAHAKARYA SENI (${elapsedSeconds} detik)` : `PROSES ENGINE SEDANG BERJALAN (${elapsedSeconds} detik)`}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {activeSkill === 'image' ? 'AI sedang meracik prompt visual & merender gambar High-Resolution...' : 'Menyusun arsitektur file workspace & menulis kode secara real-time...'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onStopStream}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                    >
                      <Square className="w-3.5 h-3.5 text-gray-500" />
                      Stop
                    </button>
                  </div>

                  {/* Always Pinned Phase Execution Timeline inside the Processing Card */}
                  {activeSkill !== 'image' && activePhases && activePhases.length > 0 && (
                    <PhaseTracker phases={activePhases} />
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-5 bg-white/90 backdrop-blur border-t border-gray-200 shrink-0 z-10">
        <div className="max-w-4xl mx-auto relative">
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative flex flex-col rounded-2xl bg-white border border-gray-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 shadow-sm transition-all">
            {/* Attached Files Chips Bar */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate max-w-[150px] font-mono text-[11px]">{file.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({formatFileSize(file.size)})</span>
                    <button
                      onClick={() => removeAttachment(file.id)}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Language Selector Header */}
            <div className="px-3 md:px-4 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 font-mono bg-gray-50/50 rounded-t-2xl">
              <div className="hidden sm:flex items-center gap-1.5 md:gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                  HTML5
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-600 border border-cyan-100">
                  CSS3
                </span>
                <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100">
                  JS
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                  PHP
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                  SVG
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Web Search Instan */}
                <button
                  type="button"
                  onClick={() => setActiveSkill(activeSkill === 'web_search' ? 'none' : 'web_search')}
                  disabled={messages.length > 0}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                    activeSkill === 'web_search'
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${messages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Web Search Instan (Cepat)"
                >
                  <Globe className={`w-3.5 h-3.5 ${activeSkill === 'web_search' ? 'text-blue-600' : 'text-gray-400'}`} />
                  Web Search
                  <div className={`ml-1 w-5 h-3 rounded-full relative transition-colors ${activeSkill === 'web_search' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm ${activeSkill === 'web_search' ? 'left-[10px]' : 'left-0.5'}`}></div>
                  </div>
                </button>

                {/* 2. Deep Research */}
                <button
                  type="button"
                  onClick={() => setActiveSkill(activeSkill === 'deep_research' ? 'none' : 'deep_research')}
                  disabled={messages.length > 0}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                    activeSkill === 'deep_research'
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${messages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Riset Internet Mendalam (Exhaustive Research)"
                >
                  <Compass className={`w-3.5 h-3.5 ${activeSkill === 'deep_research' ? 'text-cyan-600' : 'text-gray-400'}`} />
                  Riset Mendalam
                  <div className={`ml-1 w-5 h-3 rounded-full relative transition-colors ${activeSkill === 'deep_research' ? 'bg-cyan-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm ${activeSkill === 'deep_research' ? 'left-[10px]' : 'left-0.5'}`}></div>
                  </div>
                </button>

                {/* 3. Finance Research */}
                <button
                  type="button"
                  onClick={() => setActiveSkill(activeSkill === 'finance' ? 'none' : 'finance')}
                  disabled={messages.length > 0}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                    activeSkill === 'finance'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${messages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Riset Pasar Keuangan, Kripto, & Saham"
                >
                  <TrendingUp className={`w-3.5 h-3.5 ${activeSkill === 'finance' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  Finansial
                  <div className={`ml-1 w-5 h-3 rounded-full relative transition-colors ${activeSkill === 'finance' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm ${activeSkill === 'finance' ? 'left-[10px]' : 'left-0.5'}`}></div>
                  </div>
                </button>

                {/* 4. Baca Link (Contents API) */}
                <button
                  type="button"
                  onClick={() => setActiveSkill(activeSkill === 'contents' ? 'none' : 'contents')}
                  disabled={messages.length > 0}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                    activeSkill === 'contents'
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${messages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Membaca & Ekstraksi Isi Penuh Halaman Web dari Link URL"
                >
                  <FileText className={`w-3.5 h-3.5 ${activeSkill === 'contents' ? 'text-amber-600' : 'text-gray-400'}`} />
                  Baca Link
                  <div className={`ml-1 w-5 h-3 rounded-full relative transition-colors ${activeSkill === 'contents' ? 'bg-amber-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm ${activeSkill === 'contents' ? 'left-[10px]' : 'left-0.5'}`}></div>
                  </div>
                </button>

                {/* 5. Mode Hyper (Fusi Real-time You.com + Ling Engine) */}
                <button
                  type="button"
                  onClick={() => setActiveSkill(activeSkill === 'hyper' ? 'none' : 'hyper')}
                  disabled={messages.length > 0}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                    activeSkill === 'hyper'
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white border-amber-600 shadow-sm shadow-amber-200' 
                      : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                  } ${messages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="⚡ MODE HYPER: Gabungkan Pengetahuan Real-Time Internet You.com dengan Kekuatan Pemrograman Ling 3.0 Flash"
                >
                  <Zap className={`w-3.5 h-3.5 ${activeSkill === 'hyper' ? 'text-yellow-200 animate-bounce' : 'text-amber-500'}`} />
                  Mode Hyper
                  <div className={`ml-1 w-5 h-3 rounded-full relative transition-colors ${activeSkill === 'hyper' ? 'bg-amber-900/40' : 'bg-amber-200'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm ${activeSkill === 'hyper' ? 'left-[10px]' : 'left-0.5'}`}></div>
                  </div>
                </button>

                {/* 4. Mode Gambar */}
                <button
                  type="button"
                  onClick={() => setActiveSkill(activeSkill === 'image' ? 'none' : 'image')}
                  disabled={messages.length > 0}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                    activeSkill === 'image'
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${messages.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Aktifkan Mode Gambar (Generate HD FLUX Image)"
                >
                  <ImageIcon className={`w-3.5 h-3.5 ${activeSkill === 'image' ? 'text-purple-600' : 'text-gray-400'}`} />
                  Mode Gambar
                  <div className={`ml-1 w-5 h-3 rounded-full relative transition-colors ${activeSkill === 'image' ? 'bg-purple-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm ${activeSkill === 'image' ? 'left-[10px]' : 'left-0.5'}`}></div>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              {/* Paperclip File Upload Trigger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-gray-700 transition-colors"
                title="Upload File (Maksimal 50 MB)"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="w-full py-4 pl-1 pr-14 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-36 min-h-[56px] custom-scrollbar font-sans"
              />

              <div className="absolute right-3 bottom-2.5">
                {isLoading ? (
                  <button
                    onClick={onStopStream}
                    className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shadow-sm flex items-center gap-1 text-xs font-medium"
                    title="Hentikan Proses"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && attachments.length === 0}
                    className={`p-2.5 rounded-xl transition-all shadow-sm ${
                      input.trim() || attachments.length > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Kirim Instruksi"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
