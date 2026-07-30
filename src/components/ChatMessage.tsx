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
import { User, Terminal, Copy, Check, Play, FileText, Image as ImageIcon, FileCode, PlayCircle, Download, Clock, Coins, ChevronDown, Zap, Maximize2, ExternalLink, Sparkles } from 'lucide-react';

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

const VisualAssetCard: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rdirai_visual_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(src, '_blank');
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLogo = (alt || '').toLowerCase().includes('logo') || src.toLowerCase().includes('logo');

  return (
    <>
      <div className="relative group my-5 max-w-lg rounded-2xl overflow-hidden border border-purple-200/80 bg-slate-900 shadow-xl shadow-purple-950/20 transition-all duration-300 hover:shadow-purple-900/30 hover:border-purple-400/50">
        {/* Card Header Badge */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-purple-300 uppercase">
              {isLogo ? '🎨 Desain Logo Vector' : '✨ Desain Visual FLUX HD'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            FLUX HD Engine
          </span>
        </div>

        {/* Image Container */}
        <div className="relative overflow-hidden cursor-pointer bg-slate-950" onClick={() => setIsOpen(true)}>
          <img
            src={src}
            alt={alt || 'RdirAI Visual Asset'}
            className="w-full h-auto object-cover max-h-96 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              className="p-2.5 rounded-xl bg-white text-slate-900 font-medium text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
            >
              <Maximize2 className="w-4 h-4 text-purple-600" />
              Inspeksi Fullscreen
            </button>
          </div>
        </div>

        {/* Toolbar Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-purple-900/40 text-xs text-slate-400">
          <span className="truncate max-w-[200px] text-[11px] font-mono text-slate-400">
            {alt || 'Visual Asset'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Salin Link Gambar"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50"
            >
              <Download className="w-3.5 h-3.5" />
              Download HD
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Inspector Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-sm text-slate-200 font-mono">
                  {alt || 'Inspeksi Visual Asset'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              <img src={src} alt={alt} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Resolusi: 1280x1280 (FLUX HD Engine)</span>
              <div className="flex items-center gap-3">
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Link Asli
                </a>
                <button
                  onClick={handleDownload}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PNG HD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
    const cleanLang = (lang || '').toLowerCase();

    // Do NOT treat chart, json, markdown, or text blocks as downloadable code files
    if (!cleanLang || ['chart', 'json', 'markdown', 'md', 'text', 'txt', 'bash', 'sh'].includes(cleanLang)) {
      return '';
    }

    // Fix generic/numbered filenames (file_1.html, index_2.html) -> standard web file names
    if (!rawName || rawName.match(/^(file|index|code|snippet)[\-_]?\d*/i)) {
      if (cleanLang === 'css') return 'style.css';
      if (['js', 'javascript', 'jsx', 'ts', 'tsx'].includes(cleanLang)) return 'script.js';
      if (cleanLang === 'php') return 'index.php';
      if (cleanLang === 'svg') return 'vector.svg';
      if (cleanLang === 'html' || cleanLang === 'xml') return 'index.html';
      return '';
    }

    return rawName.trim();
  };

  // Extract generated code files from content to display Kimi-style File Cards
  const getCreatedFiles = (content: string) => {
    if (isUser || !content) return [];
    const filesMap = new Map<string, { filename: string; language: string; code: string }>();
    const codeBlockRegex = /```(html|xml|svg|javascript|jsx|js|css|php|python|json|chart|markdown)?\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)(?:```|$)/gi;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const lang = match[1]?.toLowerCase() || '';
      const filename = normalizeFilename(match[2], lang);
      if (!filename) continue; // Skip non-web-file blocks (like chart JSON)

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
                  <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
                    <table className="w-full text-left text-xs border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }: any) => (
                  <thead className="bg-slate-950 text-white font-bold uppercase text-[11px] tracking-wider border-b border-slate-800" {...props} />
                ),
                th: ({ node, ...props }: any) => (
                  <th className="px-4 py-3.5 font-mono font-bold text-purple-300 bg-slate-950" {...props} />
                ),
                tr: ({ node, ...props }: any) => (
                  <tr className="border-b border-slate-100 hover:bg-purple-50/60 transition-colors odd:bg-white even:bg-slate-50/70" {...props} />
                ),
                td: ({ node, ...props }: any) => (
                  <td className="px-4 py-3 font-sans text-slate-900 font-semibold" {...props} />
                ),
                h1: ({node, ...props}: any) => <h1 className="text-xl font-extrabold text-slate-950 mt-6 mb-3 tracking-tight border-b border-slate-200 pb-2" {...props} />,
                h2: ({node, ...props}: any) => <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3 tracking-tight border-b border-slate-200 pb-1.5" {...props} />,
                h3: ({node, ...props}: any) => <h3 className="text-base font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2" {...props} />,
                h4: ({node, ...props}: any) => <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2" {...props} />,
                p: ({node, ...props}: any) => <p className="text-slate-800 font-medium leading-relaxed mb-4 text-sm" {...props} />,
                li: ({node, ...props}: any) => <li className="text-slate-800 font-medium leading-relaxed mb-1 text-sm" {...props} />,
                strong: ({node, ...props}: any) => <strong className="font-bold text-slate-950 bg-purple-50/80 px-1.5 py-0.5 rounded border border-purple-200/60" {...props} />,
                img: ({node, src, alt, ...props}: any) => {
                  if (!src) return null;
                  
                  // Filter out junk UI icons (thumbs, emojis, social share buttons)
                  const isJunkIcon = /thumbs|like|dislike|emoji|avatar|icon|button|share|facebook|twitter|whatsapp|1x1|micro|tiny/i.test(src) || /thumbs|like|dislike|emoji|avatar|icon/i.test(alt || '');
                  if (isJunkIcon) return null;

                  const isAiGenerated = src.includes('pollinations.ai') || src.includes('flux') || src.includes('data:image/svg+xml') || (alt || '').toLowerCase().includes('flux') || (alt || '').toLowerCase().includes('desain logo');
                  
                  if (!isAiGenerated) {
                    return (
                      <div className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-w-md shadow-sm">
                        <img src={src} alt={alt || 'Gambar Web'} className="w-full max-h-64 object-cover" loading="lazy" />
                        {alt && <div className="px-3 py-1.5 text-[11px] font-medium text-slate-600 bg-white border-t border-slate-100 truncate">{alt}</div>}
                      </div>
                    );
                  }

                  return <VisualAssetCard src={src} alt={alt} />;
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

                        {/* Code Content (Capped at 256px height to prevent infinite page scroll) */}
                        {isStreaming && isLastAssistant ? (
                          <div className="p-3 bg-[#18181c] flex items-center justify-between text-xs font-mono text-gray-400">
                            <div className="flex items-center gap-2 text-cyan-400">
                              <FileCode className="w-4 h-4 animate-pulse" />
                              <span className="font-semibold">Menulis Kode {lang.toUpperCase()}...</span>
                            </div>
                            <span className="text-[11px] text-gray-500 font-mono">Disembunyikan saat memproses</span>
                          </div>
                        ) : (
                          <pre className="p-3 max-h-64 overflow-y-auto overflow-x-auto text-[13px] font-mono text-gray-200 leading-relaxed scrollbar-thin">
                            <code>{children}</code>
                          </pre>
                        )}
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

          {/* Continue Generation Quick Button (Only show when streaming is finished/stopped AND code is truncated) */}
          {!isStreaming && isTruncated && onContinueGeneration && (
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
