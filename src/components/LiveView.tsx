'use client';

import React, { useState, useEffect } from 'react';
import { CodeArtifact } from '@/types/chat';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, RefreshCw, X, Download, Sparkles } from 'lucide-react';

interface LiveViewProps {
  artifact: CodeArtifact | null;
  onClose: () => void;
}

export const LiveView: React.FC<LiveViewProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setIframeKey((prev) => prev + 1);
  }, [artifact]);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/\s+/g, '-') || 'artifact'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build sandboxed HTML template with Tailwind CSS CDN included by default for rich web app artifact preview
  const generatePreviewHtml = (code: string, language: string) => {
    if (language === 'svg') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f0f11; }
            svg { max-width: 90%; max-height: 90vh; }
          </style>
        </head>
        <body>${code}</body>
        </html>
      `;
    }

    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return code;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 1rem; }
        </style>
      </head>
      <body>
        ${code}
      </body>
      </html>
    `;
  };

  return (
    <div
      className={`bg-kimi-card border-l border-kimi-border flex flex-col transition-all duration-300 z-30 ${
        isFullscreen
          ? 'fixed inset-0 w-full h-full'
          : 'w-full lg:w-[540px] xl:w-[640px] h-full'
      }`}
    >
      {/* Header Bar */}
      <div className="p-3 border-b border-kimi-border flex items-center justify-between bg-kimi-sidebar/80 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-gray-200 truncate flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {artifact.title || 'Live Preview Artifact'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 uppercase font-mono">
            {artifact.language}
          </span>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-1">
          <div className="flex bg-kimi-bg p-0.5 rounded-lg border border-kimi-border">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'code'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Kode
            </button>
          </div>

          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-kimi-hover transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-kimi-hover transition-colors"
            title="Copy Kode"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-kimi-hover transition-colors"
            title="Download Kode HTML"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-kimi-hover transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-kimi-hover transition-colors"
            title="Tutup Live View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {activeTab === 'preview' ? (
          <iframe
            key={iframeKey}
            title={artifact.title}
            srcDoc={generatePreviewHtml(artifact.code, artifact.language)}
            className="w-full h-full border-0 bg-slate-950"
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
          />
        ) : (
          <div className="w-full h-full p-4 overflow-auto custom-scrollbar font-mono text-xs text-gray-200 bg-slate-950 leading-relaxed">
            <pre>
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
