'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, CodeArtifact, AttachedFile } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
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
  Image as ImageIcon,
  AlertCircle,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (
      file.type.startsWith('text/') ||
      file.type.includes('json') ||
      file.type.includes('xml') ||
      file.name.match(/\.(js|jsx|ts|tsx|html|css|php|py|json|md|txt|sql|csv|svg)$/i)
    ) {
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
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
    } else {
      // Base64 for images / binary documents
      reader.onload = (e) => {
        const base64Content = e.target?.result as string;
        const newFile: AttachedFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          content: base64Content,
        };
        setAttachments((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
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
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] relative overflow-hidden bg-grid-pattern">
      {/* Hidden File Input (Max 50MB) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-glow-radial pointer-events-none" />

      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#1e2230] px-4 flex items-center justify-between bg-[#101218]/80 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1e2b]"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Clean Header Bar */}
        </div>

        {activeArtifact && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono">
            <Layout className="w-3.5 h-3.5 text-purple-400" />
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181b26] border border-purple-500/30 text-xs text-purple-300 font-medium mb-6 shadow-lg shadow-purple-900/20">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Rdir Studio Engine • Enterprise Web & Code Builder</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Wujudkan Aplikasi & Web Kelas Dunia
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mb-10 leading-relaxed">
              Arsitektur pengembang otomatis untuk menghasilkan aplikasi web multi-file (HTML, CSS, JS, PHP, SVG) lengkap dengan{' '}
              <strong className="text-purple-300 font-semibold">Live Preview Workspace</strong> & analisis file hingga 50 MB.
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
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Layout className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-purple-300 transition-colors mb-1">
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
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-pink-400 transition-colors" />
                </div>
                <div className="text-sm font-bold text-gray-100 group-hover:text-pink-300 transition-colors mb-1">
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

            {isLoading && (
              <div className="py-5 px-4 md:px-6 bg-[#12151f]/50 border-y border-[#1e2334]">
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                    <Terminal className="w-4 h-4 animate-spin text-purple-200" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300 font-mono">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                    Membangun kode & memproses tahapan proyek...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Luxury Glassmorphic Input Area with File Attachments */}
      <div className="p-3 md:p-5 bg-[#0c0d10]/90 backdrop-blur border-t border-[#1e2230] shrink-0 z-10">
        <div className="max-w-4xl mx-auto relative">
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="relative flex flex-col rounded-2xl bg-[#141722] border border-[#242a3e] focus-within:border-purple-500/60 shadow-2xl transition-all">
            {/* Attached Files Chips Bar */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 border-b border-[#1e2434] flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1a1f30] border border-[#2c334a] text-xs text-gray-200 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate max-w-[150px] font-mono text-[11px]">{file.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({formatFileSize(file.size)})</span>
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

            {/* Quick Language Tag Selector Header */}
            <div className="px-4 py-2 border-b border-[#1e2434] flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  HTML5
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  CSS3
                </span>
                <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                  JS
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  PHP
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  SVG
                </span>
              </div>
              <span className="hidden sm:inline text-gray-500">Maks. 50 MB per File</span>
            </div>

            <div className="relative flex items-center">
              {/* Paperclip File Upload Trigger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-purple-300 transition-colors"
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
                    className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg"
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
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-purple-900/40 border border-purple-400/30'
                        : 'bg-[#1e2230] text-gray-600 cursor-not-allowed border border-[#2a2f42]'
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
