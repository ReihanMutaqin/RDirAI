'use client';

import React, { useState } from 'react';
import { Message, CodeArtifact } from '@/types/chat';
import { PhaseTracker } from './PhaseTracker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { User, Terminal, Copy, Check, Play, Sparkles } from 'lucide-react';

import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  message: Message;
  onOpenArtifact?: (artifact: CodeArtifact) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onOpenArtifact }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-all duration-200 ease-out ${
        isUser ? 'bg-transparent' : 'bg-[#12151f]/50 border-y border-[#1c202e]'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-purple-500/20">
              <div className="w-full h-full bg-[#101218] rounded-[10px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-purple-300" />
              </div>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-200 tracking-tight">
                {isUser ? 'Anda' : 'Rdir Studio Engineer'}
              </span>
            </div>

            <button
              onClick={handleCopyMessage}
              className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-[#1a1e2b] transition-colors"
              title="Salin Teks"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Phase Execution Timeline Tracker if present */}
          {message.phases && message.phases.length > 0 && (
            <PhaseTracker phases={message.phases} />
          )}

          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-200 transition-opacity duration-150">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeHighlight, rehypeKatex]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  const lang = match ? match[1] : '';

                  const isLivePreviewable =
                    ['html', 'xml', 'svg', 'javascript', 'js', 'jsx', 'css', 'php'].includes(lang.toLowerCase()) ||
                    codeText.includes('<html') ||
                    codeText.includes('<div') ||
                    codeText.includes('<svg') ||
                    codeText.includes('<?php');

                  if (!inline && match) {
                    return (
                      <div className="my-3 rounded-xl overflow-hidden border border-[#24293a] bg-[#090b10] shadow-xl transition-all duration-200">
                        {/* Code Block Header */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#121520] border-b border-[#202534] text-xs text-gray-400">
                          <span className="font-mono text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
                            {lang}
                          </span>

                          <div className="flex items-center gap-2">
                            {isLivePreviewable && onOpenArtifact && (
                              <button
                                onClick={() =>
                                  onOpenArtifact({
                                    id: `artifact_${Date.now()}`,
                                    title: `${lang.toUpperCase()} Preview`,
                                    language: lang || 'html',
                                    code: codeText,
                                  })
                                }
                                className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 transition-all shadow-md shadow-purple-900/30 border border-purple-400/30"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Live View
                              </button>
                            )}

                            <button
                              onClick={() => navigator.clipboard.writeText(codeText)}
                              className="hover:text-white p-0.5 transition-colors"
                              title="Copy Code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Code Content */}
                        <pre className="p-3 overflow-x-auto text-xs font-mono text-gray-200 leading-relaxed">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="bg-[#1c202e] text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono border border-purple-500/20" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
