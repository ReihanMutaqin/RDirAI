'use client';

import React, { useState, useEffect } from 'react';
import { CodeArtifact } from '@/types/chat';
import { Eye, Code2, Copy, Check, Maximize2, Minimize2, RefreshCw, X, Download, Sparkles, Terminal, FileCode } from 'lucide-react';

interface LiveViewProps {
  artifact: CodeArtifact | null;
  allFiles?: { filename: string; language: string; code: string }[];
  onClose: () => void;
}

export const LiveView: React.FC<LiveViewProps> = ({ artifact, allFiles = [], onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setIframeKey((prev) => prev + 1);
  }, [artifact, allFiles]);

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
    a.download = `${artifact.filename || artifact.title.toLowerCase().replace(/\s+/g, '-') || 'index'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build high-definition sandboxed HTML preview with Tailwind CSS, FontAwesome, Google Fonts & bundled workspace files
  const generatePreviewHtml = (code: string, language: string) => {
    if (!code || !code.trim()) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="about:blank">
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0b0f17; color: #94a3b8; font-family: system-ui, sans-serif; }
            .card { text-align: center; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; padding: 2rem; max-width: 320px; }
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

    // Gather bundled CSS and JS from workspace files
    let bundledCss = '';
    let bundledJs = '';

    allFiles.forEach((f) => {
      if (f.language === 'css' || f.filename.endsWith('.css')) {
        bundledCss += `\n/* ${f.filename} */\n` + f.code;
      }
      if (
        (f.language === 'js' || f.language === 'javascript' || f.filename.endsWith('.js')) &&
        !f.filename.endsWith('.json')
      ) {
        bundledJs += `\n/* ${f.filename} */\n` + f.code;
      }
    });

    // Handle CSS preview directly
    if (language === 'css') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="about:blank">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>${code}</style>
        </head>
        <body class="bg-slate-950 text-slate-100 p-8 font-sans">
          <div class="max-w-xl mx-auto space-y-4">
            <h1 class="text-2xl font-bold text-blue-400">CSS Styling Live Preview</h1>
            <p class="text-slate-400">Aturan CSS telah diterapkan pada halaman ini secara langsung.</p>
            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <button class="btn border px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500">Contoh Tombol Styled</button>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // PHP Script Handling - Render HTML markup or simulated PHP Output
    if (language === 'php' || code.includes('<?php')) {
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; }
              ${bundledCss}
            </style>
          </head>
          <body>
            ${strippedPhp}
            ${bundledJs ? `<script>${bundledJs}</script>` : ''}
          </body>
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
          <div style="margin-bottom: 1rem; padding: 0.5rem; background: #1e293b; border-radius: 0.375rem; color: #facc15; font-weight: bold;">
            ⚡ JavaScript Console Output
          </div>
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

    // Full HTML Document or Component HTML
    let finalHtml = code;

    // Inject Tailwind CDN, FontAwesome, & Google Fonts into <head> if missing
    const headAssets = `
      <base href="about:blank">
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      ${bundledCss ? `<style>${bundledCss}</style>` : ''}
    `;

    if (finalHtml.includes('<!DOCTYPE html>') || finalHtml.includes('<html')) {
      if (finalHtml.includes('<head>')) {
        finalHtml = finalHtml.replace('<head>', `<head>${headAssets}`);
      } else {
        finalHtml = finalHtml.replace('<html', `<html><head>${headAssets}</head`);
      }
    } else {
      finalHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          ${headAssets}
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #0b0c10; color: #f8fafc; }
          </style>
        </head>
        <body>
          ${finalHtml}
          ${bundledJs ? `<script>${bundledJs}</script>` : ''}
        </body>
        </html>
      `;
    }

    // Inject bundled JS before </body> if missing
    if (bundledJs && !finalHtml.includes(bundledJs)) {
      if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', `<script>${bundledJs}</script></body>`);
      } else {
        finalHtml += `<script>${bundledJs}</script>`;
      }
    }

    return finalHtml;
  };

  const previewHtml = generatePreviewHtml(artifact.code, artifact.language);

  return (
    <div
      className={`bg-[#0f1117] border-l border-[#1e2332] flex flex-col transition-all duration-300 z-20 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'w-full md:w-[50vw] lg:w-[45vw] h-full'
      }`}
    >
      {/* Header Bar */}
      <div className="h-14 border-b border-[#1e2332] px-4 flex items-center justify-between bg-[#121520] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-gray-100 truncate font-mono">
              {artifact.filename || artifact.title}
            </h2>
            <p className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Preview Mode
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#181c2a] p-1 rounded-xl border border-[#262c3e]">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Kode
            </button>
          </div>

          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
            title="Refresh Live View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
            title="Salin Kode"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
            title="Unduh File"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
            title={isFullscreen ? 'Kecilkan Layar' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
            title="Tutup Live View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-hidden relative bg-[#0b0c10]">
        {activeTab === 'preview' ? (
          <iframe
            key={iframeKey}
            srcDoc={previewHtml}
            className="w-full h-full border-0 bg-[#0b0c10]"
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            title="Live Preview Output"
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 font-mono text-xs text-gray-200 bg-[#090b10] custom-scrollbar">
            <pre>
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
