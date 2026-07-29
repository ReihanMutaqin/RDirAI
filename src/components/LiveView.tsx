'use client';

import React, { useState, useEffect } from 'react';
import { CodeArtifact } from '@/types/chat';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, RefreshCw, X, Download, Sparkles, Terminal, FileCode } from 'lucide-react';

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
    a.download = `${artifact.filename || artifact.title.toLowerCase().replace(/\s+/g, '-') || 'artifact'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build sandboxed HTML template with isolation guarantees
  const generatePreviewHtml = (code: string, language: string) => {
    if (!code || !code.trim()) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="about:blank">
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0b0f17; color: #94a3b8; font-family: system-ui, sans-serif; }
            .card { text-align: center; p-6; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; padding: 2rem; max-width: 320px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3 style="color: #f8fafc; margin-bottom: 0.5rem;">Live View Standby</h3>
            <p style="font-size: 0.875rem;">Menyiapkan pratinjau kode...</p>
          </div>
        </body>
        </html>
      `;
    }

    // SVG Vector Graphics
    if (language === 'svg' || code.trim().startsWith('<svg')) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="about:blank">
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; }
            svg { max-width: 90%; max-height: 90vh; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5)); }
          </style>
        </head>
        <body>${code}</body>
        </html>
      `;
    }

    // PHP Script Handling - Render HTML markup or simulated PHP Output
    if (language === 'php' || code.includes('<?php')) {
      // Clean PHP tags for client-side HTML preview if pure HTML is contained inside
      const strippedPhp = code
        .replace(/<\?php[\s\S]*?\?>/g, '')
        .replace(/<\?[\s\S]*?\?>/g, '')
        .trim();

      if (strippedPhp.length > 20) {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <base href="about:blank">
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 1rem; }</style>
          </head>
          <body>${strippedPhp}</body>
          </html>
        `;
      }

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="about:blank">
          <style>
            body { margin: 0; padding: 1.5rem; background: #0f172a; color: #e2e8f0; font-family: monospace; }
            .header { background: #1e293b; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #334155; margin-bottom: 1rem; color: #a78bfa; font-weight: bold; }
            pre { background: #020617; padding: 1rem; border-radius: 0.5rem; border: 1px solid #1e293b; overflow-x: auto; color: #38bdf8; }
          </style>
        </head>
        <body>
          <div class="header">🐘 PHP Engine Simulation Mode</div>
          <p style="font-size: 0.875rem; color: #94a3b8; font-family: sans-serif; margin-bottom: 1rem;">
            Kode PHP siap dieksekusi di server web (Apache/Nginx/Laravel). Berikut kode sumbernya:
          </p>
          <pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </body>
        </html>
      `;
    }

    // Pure JavaScript without HTML wrapper - wrap in interactive Console Runner
    if (
      (language === 'js' || language === 'javascript' || language === 'ts') &&
      !code.includes('<html') &&
      !code.includes('<div')
    ) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="about:blank">
          <style>
            body { margin: 0; padding: 1rem; background: #020617; color: #f8fafc; font-family: monospace; font-size: 0.875rem; }
            .console-log { border-bottom: 1px solid #1e293b; padding: 0.5rem 0; color: #38bdf8; }
            .console-err { color: #f87171; }
          </style>
        </head>
        <body>
          <div id="output"></div>
          <script>
            const output = document.getElementById('output');
            const log = console.log;
            console.log = function(...args) {
              log(...args);
              const div = document.createElement('div');
              div.className = 'console-log';
              div.textContent = '❯ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              output.appendChild(div);
            };
            try {
              ${code}
            } catch(e) {
              const div = document.createElement('div');
              div.className = 'console-log console-err';
              div.textContent = '❌ Error: ' + e.message;
              output.appendChild(div);
            }
          </script>
        </body>
        </html>
      `;
    }

    // Full HTML Document or Tailwind Web Page
    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      // Inject base tag to prevent relative redirect loop to host app
      if (!code.includes('<base')) {
        return code.replace('<head>', '<head><base href="about:blank">');
      }
      return code;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <base href="about:blank">
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
            title="Download Kode"
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
            sandbox="allow-scripts allow-modals allow-forms"
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
