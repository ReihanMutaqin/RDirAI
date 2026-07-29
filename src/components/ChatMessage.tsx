'use client';

import React, { useState } from 'react';
import { Message, CodeArtifact, AttachedFile } from '@/types/chat';
import { PhaseTracker } from './PhaseTracker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { User, Terminal, Copy, Check, Play, FileText, Image as ImageIcon, FileCode, PlayCircle } from 'lucide-react';

import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  message: Message;
  isLastAssistant?: boolean;
  onOpenArtifact?: (artifact: CodeArtifact) => void;
  onContinueGeneration?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistant,
  onOpenArtifact,
  onContinueGeneration,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: AttachedFile) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-cyan-400" />;
    if (file.name.match(/\.(html|css|js|jsx|ts|tsx|php|py|json|sql)$/i))
      return <FileCode className="w-4 h-4 text-blue-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  // Helper to check if output ended abruptly / code block unclosed
  const checkIsTruncated = (content: string) => {
    if (!content) return false;
    const backtickCount = (content.match(/```/g) || []).length;
    // Odd number of ``` means a code block was cut off in the middle
    if (backtickCount % 2 !== 0) return true;

    // Ends with incomplete code statements
    const trimmed = content.trim();
    if (
      trimmed.endsWith('require_once') ||
      trimmed.endsWith('include') ||
      trimmed.endsWith('{') ||
      trimmed.endsWith('(') ||
      trimmed.endsWith(',') ||
      trimmed.endsWith(';') === false
    ) {
      if (backtickCount > 0) return true;
    }
    return false;
  };

  const isTruncated = !isUser && (checkIsTruncated(message.content) || (isLastAssistant && message.content.length > 500));

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-all duration-200 ease-out ${
        isUser ? 'bg-transparent' : 'bg-[#141724]/50 border-y border-[#202536]'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30 border border-blue-400/30">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-900/20">
              <div className="w-full h-full bg-[#10121a] rounded-[10px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-blue-300" />
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
              className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-[#1a1f30] transition-colors"
              title="Salin Teks"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Attached Files rendering in user message bubble */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {message.attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181c2a] border border-[#262c40] text-xs text-gray-200 shadow-sm"
                >
                  {getFileIcon(file)}
                  <div className="flex flex-col min-w-0 max-w-[220px]">
                    <span className="truncate font-mono font-medium">{file.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                      <div className="my-3 rounded-xl overflow-hidden border border-[#222738] bg-[#090b10] shadow-xl transition-all duration-200">
                        {/* Code Block Header */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#121520] border-b border-[#202536] text-xs text-gray-400">
                          <span className="font-mono text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
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
                                className="px-2.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 transition-all shadow-md shadow-blue-950/30 border border-blue-400/30"
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
                    <code className="bg-[#1a1e2c] text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono border border-blue-500/20" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Continue Generation Quick Button */}
          {isTruncated && onContinueGeneration && (
            <div className="pt-3">
              <button
                onClick={onContinueGeneration}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-950/40 border border-blue-400/30 transition-all group"
              >
                <PlayCircle className="w-4 h-4 text-cyan-300 fill-cyan-400/20 transition-transform group-hover:scale-110" />
                <span>▶ Lanjutkan Penulisan Kode (Continue Generation)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
