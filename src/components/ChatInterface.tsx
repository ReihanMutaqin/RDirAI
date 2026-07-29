'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, CodeArtifact } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ModelSelector } from './ModelSelector';
import {
  Menu,
  Send,
  Square,
  Sparkles,
  Bot,
  Code,
  Layout,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onSendMessage: (text: string) => void;
  onStopStream: () => void;
  onOpenSidebar: () => void;
  onOpenArtifact: (artifact: CodeArtifact) => void;
  activeArtifact: CodeArtifact | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  selectedModel,
  onSelectModel,
  onSendMessage,
  onStopStream,
  onOpenSidebar,
  onOpenArtifact,
  activeArtifact,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSendMessage(input);
        setInput('');
      }
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    if (!isLoading) {
      onSendMessage(promptText);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-kimi-bg relative overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-kimi-border px-4 flex items-center justify-between bg-kimi-sidebar/40 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-kimi-hover"
          >
            <Menu className="w-5 h-5" />
          </button>

          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
          />
        </div>

        {activeArtifact && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs">
            <Layout className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-[150px]">{activeArtifact.title}</span>
          </div>
        )}
      </header>

      {/* Messages Scroll Viewport */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          /* Welcome Screen (Claude / Kimi style) */
          <div className="h-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-600/30 mb-6 animate-pulse">
              <Bot className="w-9 h-9 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Apa yang ingin Anda buat hari ini dengan{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                RdirAI
              </span>
              ?
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-xl mb-8">
              Platform AI canggih berbasis OpenRouter dengan kemampuan penalaran mendalam dan{' '}
              <strong className="text-purple-300 font-semibold">Live View Preview</strong> secara real-time.
            </p>

            {/* Quick Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan saya halaman Dashboard Analytics menggunakan HTML, CSS, dan Tailwind dengan tampilan dark mode modern dan chart SVG interaktif.'
                  )
                }
                className="p-3.5 rounded-2xl bg-kimi-card border border-kimi-border hover:border-purple-500/50 hover:bg-kimi-hover transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-1">
                  <Layout className="w-4 h-4" />
                  Live View Web App
                </div>
                <div className="text-xs text-gray-300 line-clamp-2">
                  Buat Dashboard Analytics modern dengan Tailwind & Live Preview
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan kode kalkulator interaktif lengkap dengan HTML, CSS, dan JavaScript yang langsung bisa dicoba di Live View.'
                  )
                }
                className="p-3.5 rounded-2xl bg-kimi-card border border-kimi-border hover:border-purple-500/50 hover:bg-kimi-hover transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                  <Code className="w-4 h-4" />
                  Kalkulator Interaktif
                </div>
                <div className="text-xs text-gray-300 line-clamp-2">
                  Kode HTML/JS Widget kalkulator yang bisa langsung digunakan
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Buatkan ilustrasi logo futuristik bertema AI dalam bentuk format SVG murni.'
                  )
                }
                className="p-3.5 rounded-2xl bg-kimi-card border border-kimi-border hover:border-purple-500/50 hover:bg-kimi-hover transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold mb-1">
                  <Sparkles className="w-4 h-4" />
                  Desain SVG Vector
                </div>
                <div className="text-xs text-gray-300 line-clamp-2">
                  Generate grafis vector SVG logo AI futuristik
                </div>
              </button>

              <button
                onClick={() =>
                  handleQuickPrompt(
                    'Jelaskan konsep arsitektur Microservices dan beri contoh penerapannya dalam Node.js.'
                  )
                }
                className="p-3.5 rounded-2xl bg-kimi-card border border-kimi-border hover:border-purple-500/50 hover:bg-kimi-hover transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                  <Cpu className="w-4 h-4" />
                  Penalaran & Analisis Kode
                </div>
                <div className="text-xs text-gray-300 line-clamp-2">
                  Diskusi arsitektur software & praktik terbaik Node.js
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
              <div className="py-5 px-4 md:px-6 bg-kimi-card/20">
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                    RdirAI sedang berpikir dan mengetik...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Area */}
      <div className="p-3 md:p-4 bg-kimi-bg/80 backdrop-blur border-t border-kimi-border shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center rounded-2xl bg-kimi-card border border-kimi-border focus-within:border-purple-500/60 shadow-xl transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan sesuatu atau minta buatkan web app HTML/JS (Shift+Enter untuk baris baru)..."
              rows={1}
              className="w-full py-3.5 pl-4 pr-12 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none max-h-32 min-h-[50px] custom-scrollbar"
            />

            <div className="absolute right-2 bottom-2">
              {isLoading ? (
                <button
                  onClick={onStopStream}
                  className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors shadow-md"
                  title="Hentikan Response"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (input.trim()) {
                      onSendMessage(input);
                      setInput('');
                    }
                  }}
                  disabled={!input.trim()}
                  className={`p-2 rounded-xl transition-all shadow-md ${
                    input.trim()
                      ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>RdirAI didukung oleh OpenRouter Free Models & Database TiDB Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
};
