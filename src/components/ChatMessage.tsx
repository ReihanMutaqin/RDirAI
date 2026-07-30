'use client';

import React, { useState } from 'react';
import { Message, CodeArtifact, AttachedFile } from '@/types/chat';
import { PhaseTracker } from './PhaseTracker';
import { FileCardWidget } from './FileCardWidget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { User, Terminal, Copy, Check, Play, FileText, Image as ImageIcon, FileCode, PlayCircle, Download, Clock, Coins, ChevronDown, Zap } from 'lucide-react';

import 'katex/dist/katex.min.css';

import { ChartWidget } from './ChartWidget';

interface ChatMessageProps {
  message: Message;
  isLastAssistant?: boolean;
  isStreaming?: boolean;
  onOpenArtifact?: (artifact: CodeArtifact) => void;
  onOpenAllFiles?: () => void;
  onContinueGeneration?: () => void;
}

const HyperThinkingCard: React.FC<{
  content: string;
  isStreaming?: boolean;
}> = ({ content, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [seconds, setSeconds] = useState(0);

  React.useEffect(() => {
    let timer: any;
    if (isStreaming) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isStreaming]);

  const tokenCount = Math.max(12, Math.round(content.length / 3.6));
  const timeDisplay = isStreaming ? seconds.toFixed(1) : Math.max(1.2, content.length / 55).toFixed(1);

  return (
    <div className="my-2.5 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-white shadow-sm overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-mono font-medium text-amber-900 hover:bg-amber-100/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 text-amber-500 ${isStreaming ? 'animate-bounce' : ''}`} />
          <span className="font-bold text-amber-950 tracking-tight">
            {isStreaming ? '⚡ Mode Hyper Berpikir...' : '⚡ Mode Hyper Process Log'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 border border-amber-200 text-amber-900 text-[11px] font-semibold">
            <Clock className={`w-3 h-3 ${isStreaming ? 'animate-spin text-amber-600' : 'text-amber-500'}`} />
            {timeDisplay}s
          </span>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 border border-amber-200 text-amber-900 text-[11px] font-semibold">
            <Coins className="w-3 h-3 text-amber-600" />
            ~{tokenCount} Tokens
          </span>

          <ChevronDown className={`w-3.5 h-3.5 text-amber-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed border-t border-amber-200/60 max-h-52 overflow-y-auto whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistant,
  isStreaming,
  onOpenArtifact,
  onOpenAllFiles,
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

  const checkIsTruncated = (content: string) => {
    if (!content) return false;
    const backtickCount = (content.match(/```/g) || []).length;
    if (backtickCount % 2 !== 0) return true;

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

  const normalizeFilename = (rawName: string | undefined, lang: string): string => {
    const cleanLang = (lang || 'html').toLowerCase();

    // Fix generic/numbered filenames (file_1.html, index_2.html) -> standard web file names
    if (!rawName || rawName.match(/^(file|index|code|snippet)[\-_]?\d*/i)) {
      if (cleanLang === 'css') return 'style.css';
      if (['js', 'javascript', 'jsx', 'ts', 'tsx'].includes(cleanLang)) return 'script.js';
      if (cleanLang === 'php') return 'index.php';
      if (cleanLang === 'svg') return 'vector.svg';
      return 'index.html';
    }

    return rawName.trim();
  };

  // Extract generated code files from content to display Kimi-style File Cards
  const getCreatedFiles = (content: string) => {
    if (isUser || !content) return [];
    const filesMap = new Map<string, { filename: string; language: string; code: string }>();
    const codeBlockRegex = /```(html|xml|svg|javascript|jsx|js|css|php|python|json|sql)?\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/gi;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const lang = match[1]?.toLowerCase() || 'html';
      const filename = normalizeFilename(match[2], lang);
      const code = match[3].trim();
      if (code.length >= 10) {
        const existing = filesMap.get(filename);
        if (existing) {
          filesMap.set(filename, { ...existing, code: existing.code + '\n' + code });
        } else {
          filesMap.set(filename, { filename, language: lang, code });
        }
      }
    }
    return Array.from(filesMap.values());
  };

  const createdFiles = getCreatedFiles(message.content);
  const isTruncated = !isUser && checkIsTruncated(message.content);

  // Check if content is currently streaming an incomplete Pollinations image Markdown
  const hasPollinations = message.content.includes('image.pollinations.ai');
  const isImageStreaming = hasPollinations && (!message.content.includes(')') || message.content.endsWith('(') || message.content.endsWith('%20'));

  // Clean up content for display so raw unparsed URL text doesn't show during stream
  let displayContent = message.content;
  if (hasPollinations) {
    if (isImageStreaming) {
      displayContent = displayContent.replace(/!\[.*?\]\(https:\/\/image\.pollinations\.ai\/[^\)]*/g, '').trim();
    }
  }

  const isHyperMode = !isUser && (message.content.includes('MODE HYPER') || message.content.startsWith('> ⚡'));
  let mainBodyContent = displayContent;
  if (isHyperMode && displayContent.startsWith('> ⚡ *MODE HYPER AKTIF...*\n\n')) {
    mainBodyContent = displayContent.replace('> ⚡ *MODE HYPER AKTIF...*\n\n', '');
  }

  // During active code generation stream in Hyper mode, hide raw code text to keep UI minimized like Claude
  const isCodeStreaming = isStreaming && isLastAssistant && createdFiles.length > 0;

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-all duration-200 ease-out ${
        isUser ? 'bg-transparent' : 'bg-white border-y border-gray-100'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm border border-gray-300">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
              <div className="w-full h-full flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-800 tracking-tight">
                {isUser ? 'Anda' : 'RdirAI'}
              </span>
            </div>

            <button
              onClick={handleCopyMessage}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
              title="Salin Teks"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Attached Files rendering in user message bubble */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {message.attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 shadow-sm"
                >
                  {getFileIcon(file)}
                  <div className="flex flex-col min-w-0 max-w-[220px]">
                    <span className="truncate font-mono font-medium">{file.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Streaming Image Skeleton Placeholder */}
          {isImageStreaming && (
            <div className="w-full max-w-md h-64 rounded-xl bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 animate-pulse border border-purple-200 flex flex-col items-center justify-center gap-3 my-4 text-purple-600 shadow-sm">
              <ImageIcon className="w-8 h-8 animate-bounce text-purple-500" />
              <span className="text-xs font-semibold font-mono tracking-wide">Merender Gambar FLUX HD...</span>
            </div>
          )}

          {/* Claude-style Minimized Thinking Process Card for Hyper Mode */}
          {isHyperMode && (
            <HyperThinkingCard
              content={displayContent}
              isStreaming={isLastAssistant && isStreaming}
            />
          )}

          {/* Markdown Content (Hidden while raw code is streaming in Hyper Mode to keep UI minimized like Claude) */}
          {mainBodyContent && !isCodeStreaming && (
            <div className="prose max-w-none text-sm leading-relaxed text-gray-700 transition-opacity duration-150">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={{
                table: ({ node, ...props }: any) => (
                  <div className="my-5 overflow-x-auto rounded-xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/20 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }: any) => (
                  <thead className="bg-slate-900 text-slate-100 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-800" {...props} />
                ),
                th: ({ node, ...props }: any) => (
                  <th className="px-4 py-3 font-mono font-medium text-blue-300" {...props} />
                ),
                tr: ({ node, ...props }: any) => (
                  <tr className="border-b border-gray-100 hover:bg-blue-50/60 transition-colors odd:bg-white even:bg-slate-50/50" {...props} />
                ),
                td: ({ node, ...props }: any) => (
                  <td className="px-4 py-3 font-sans text-gray-700 font-medium" {...props} />
                ),
                h3: ({node, ...props}: any) => <h3 className="text-[15px] font-semibold text-gray-800 mt-6 mb-2" {...props} />,
                h4: ({node, ...props}: any) => <h4 className="text-[14px] font-semibold text-gray-700 mt-5 mb-2" {...props} />,
                p: ({node, ...props}: any) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
                img: ({node, ...props}: any) => {
                  return (
                    <div className="relative group inline-block my-4 max-w-full">
                      <img className="rounded-xl shadow-md max-w-full border border-gray-100" {...props} />
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const response = await fetch(props.src);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `rdirai_image_${Date.now()}.png`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (err) {
                            window.open(props.src, '_blank');
                          }
                        }}
                        className="absolute top-3 right-3 bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
                        title="Download Gambar"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  );
                },
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  const lang = match ? match[1] : '';

                  // Render ChartWidget if code block is language-chart or contains valid chart JSON
                  if (!inline && (lang === 'chart' || lang === 'json' || codeText.trim().startsWith('{'))) {
                    try {
                      const parsed = JSON.parse(codeText.trim());
                      if (parsed && parsed.data && Array.isArray(parsed.data) && (parsed.type === 'bar' || parsed.type === 'pie' || parsed.type === 'donut')) {
                        return <ChartWidget type={parsed.type} title={parsed.title} subtitle={parsed.subtitle} data={parsed.data} />;
                      }
                    } catch (e) {}
                  }

                  const isLivePreviewable =
                    ['html', 'xml', 'svg', 'javascript', 'js', 'jsx', 'css', 'php'].includes(lang.toLowerCase()) ||
                    codeText.includes('<html') ||
                    codeText.includes('<div') ||
                    codeText.includes('<svg') ||
                    codeText.includes('<?php');

                  if (!inline && match) {
                    return (
                      <div className="my-3 rounded-xl overflow-hidden border border-gray-200 bg-[#1e1e24] shadow-sm transition-all duration-200">
                        {/* Code Block Header */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#282c34] border-b border-[#3e4451] text-xs text-gray-400">
                          <span className="font-mono text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
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
                                className="px-2.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 transition-all shadow-sm"
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
                        <pre className="p-3 overflow-x-auto text-[13px] font-mono text-gray-200 leading-relaxed">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[13px] font-mono border border-gray-200" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {mainBodyContent}
            </ReactMarkdown>
          </div>
          )}

          {/* Kimi-style Interactive File Cards inside message bubble */}
          {createdFiles.length > 0 && (
            <div className="pt-2 space-y-2">
              {createdFiles.map((file, idx) => (
                <FileCardWidget
                  key={`file_card_${idx}`}
                  filename={file.filename}
                  language={file.language}
                  sizeKb={Number((file.code.length / 1024).toFixed(2))}
                  onPreview={() =>
                    onOpenArtifact &&
                    onOpenArtifact({
                      id: `artifact_${Date.now()}_${idx}`,
                      title: `File: ${file.filename}`,
                      language: file.language,
                      code: file.code,
                      filename: file.filename,
                    })
                  }
                />
              ))}

              {/* Kimi-style "Semua file" summary card */}
              {onOpenAllFiles && createdFiles.length > 1 && (
                <FileCardWidget
                  isAllFilesFolder={true}
                  fileCount={createdFiles.length}
                  onPreview={onOpenAllFiles}
                />
              )}
            </div>
          )}

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
