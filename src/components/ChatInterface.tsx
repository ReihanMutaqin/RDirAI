'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, CodeArtifact, AttachedFile } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { PhaseTracker } from './PhaseTracker';
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
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onSendMessage: (text: string, attachments?: AttachedFile[]) => void;
  onStopStream: () => void;
  onOpenSidebar: () => void;
  onOpenArtifact: (artifact: CodeArtifact) => void;
  activeArtifact: CodeArtifact | null;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  selectedModel,
  onSendMessage,
  onStopStream,
  onOpenSidebar,
  onOpenArtifact,
  activeArtifact,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current active assistant message phases during processing
  const lastMessage = messages[messages.length - 1];
  const activePhases =
    isLoading && lastMessage && lastMessage.role === 'assistant'
      ? lastMessage.phases
      : null;

  // Timer while processing
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

  const scrollToBottomSmooth = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottomSmooth();
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
    <div className="flex-1 flex flex-col h-full bg-[#0b0c10] relative overflow-hidden bg-grid-pattern">
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
      <header className="h-14 border-b border-[#1e2332] px-4 flex items-center justify-between bg-[#121520]/90 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1f30]"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Prominent Real-time Status Badge */}
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 text-xs font-medium shadow-md shadow-blue-950/40 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="font-semibold font-mono">SEDANG MEMPROSES... ({elapsedSeconds}s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#181c2a] border border-[#262c3e] text-gray-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>System Ready</span>
            </div>
          )}
        </div>

        {activeArtifact && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-mono">
            <Layout className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate max-w-[180px]">{activeArtifact.title}</span>
          </div>
        )}
      </header>

      {/* Messages Scroll Viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth relative z-0"
      >
        {messages.length === 0 ? (
          /* High-End Studio Hero Screen */
          <div className="h-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center py-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161a26] border border-blue-500/30 text-xs text-blue-300 font-medium mb-6 shadow-lg shadow-blue-950/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Rdir Studio Engine • Development Workspace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Wujudkan Aplikasi & Web Kelas Dunia
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mb-10 leading-relaxed">
              Arsitektur pengembang otomatis untuk menghasilkan aplikasi web multi-file (HTML, CSS, JS, PHP, SVG) lengkap dengan{' '}
              <strong className="text-blue-300 font-semibold">Live Preview Workspace</strong> & analisis file hingga 50 MB.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan saya halaman Dashboard Analytics menggunakan HTML, CSS, dan Tailwind dengan tampilan dark mode modern dan chart SVG interaktif.'
                  )
                }
                className="glass-card p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Layout className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-blue-300 transition-colors mb-1">
                  Fullstack Web Dashboard
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Rancang Dashboard Analytics modern dengan Tailwind CSS & Live Preview.
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan kode kalkulator interaktif lengkap dengan HTML, CSS, dan JavaScript yang langsung bisa dicoba di Live View.'
                  )
                }
                className="glass-card p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Code className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-emerald-300 transition-colors mb-1">
                  Kalkulator / Widget JS
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Buat komponen interaktif JavaScript lengkap dengan logic & UI.
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan sistem modul PHP lengkap dengan koneksi database MySQL, fungsi CRUD, dan tampilan HTML responsif.'
                  )
                }
                className="glass-card p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-indigo-300 transition-colors mb-1">
                  PHP Backend & Engine
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Modul server-side PHP dengan query MySQL & arsitektur clean.
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan ilustrasi logo futuristik bertema AI dalam bentuk format SVG murni.'
                  )
                }
                className="glass-card p-4 rounded-2xl transition-all duration-200 group text-left relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-300 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-cyan-300 transition-colors mb-1">
                  SVG Vector Graphic
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Generate aset ikon & ilustrasi vektor format SVG presisi tinggi.
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-transparent pb-6">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onOpenArtifact={onOpenArtifact}
              />
            ))}

            {/* High Visibility Animated Processing Card with Embedded Phase Execution Tracker */}
            {isLoading && (
              <div className="py-5 px-4 md:px-6 bg-[#141826]/90 border-y border-blue-500/40 shadow-2xl">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-200 flex items-center gap-2 font-mono">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                          PROSES ENGINE SEDANG BERJALAN ({elapsedSeconds} detik)
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Menyusun arsitektur file workspace & menulis kode secara real-time...
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onStopStream}
                      className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Batalkan
                    </button>
                  </div>

                  {/* Always Pinned Phase Execution Timeline inside the Processing Card */}
                  {activePhases && activePhases.length > 0 && (
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
      <div className="p-3 md:p-5 bg-[#0b0c10]/90 backdrop-blur border-t border-[#1e2332] shrink-0 z-10">
        <div className="max-w-4xl mx-auto relative">
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative flex flex-col rounded-2xl bg-[#141724] border border-[#222738] focus-within:border-blue-500/60 shadow-2xl transition-all">
            {/* Attached Files Chips Bar */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 border-b border-[#1e2332] flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1a1f30] border border-[#282f44] text-xs text-gray-200 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate max-w-[150px] font-mono text-[11px]">{file.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({formatFileSize(file.size)})</span>
                    <button
                      onClick={() => removeAttachment(file.id)}
                      className="p-0.5 text-gray-400 hover:text-red-400 transition-colors"
                      title="Hapus file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Language Selector Header */}
            <div className="px-4 py-2 border-b border-[#1e2332] flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  HTML5
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  CSS3
                </span>
                <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                  JS
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  PHP
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  SVG
                </span>
              </div>
              <span className="hidden sm:inline text-gray-500">Maks. 50 MB per File</span>
            </div>

            <div className="relative flex items-center">
              {/* Paperclip File Upload Trigger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-blue-300 transition-colors"
                title="Upload File (Maksimal 50 MB)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Deskripsikan web/modul kode atau lampirkan file (Maks 50MB)..."
                rows={1}
                className="w-full py-3.5 pl-1 pr-14 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none max-h-36 min-h-[52px] custom-scrollbar font-sans"
              />

              <div className="absolute right-3 bottom-2.5">
                {isLoading ? (
                  <button
                    onClick={onStopStream}
                    className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg flex items-center gap-1 text-xs font-medium"
                    title="Hentikan Proses"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && attachments.length === 0}
                    className={`p-2.5 rounded-xl transition-all shadow-lg ${
                      input.trim() || attachments.length > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-900/30 border border-blue-400/30'
                        : 'bg-[#1b1f2c] text-gray-600 cursor-not-allowed border border-[#252b3c]'
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
