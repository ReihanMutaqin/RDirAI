'use client';

import React from 'react';
import { GeneratedFile } from '@/types/chat';
import { X, Download, FileCode, Code2, Sparkles, FileText, Folder, Play } from 'lucide-react';

interface AllFilesDrawerProps {
  isOpen: boolean;
  files: GeneratedFile[];
  onClose: () => void;
  onOpenFile: (file: GeneratedFile) => void;
}

export const AllFilesDrawer: React.FC<AllFilesDrawerProps> = ({
  isOpen,
  files,
  onClose,
  onOpenFile,
}) => {
  if (!isOpen) return null;

  const getFileIcon = (filename: string, language: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || language;
    if (ext === 'html' || ext === 'htm') return <FileCode className="w-4 h-4 text-orange-400" />;
    if (ext === 'css') return <Code2 className="w-4 h-4 text-blue-400" />;
    if (ext === 'js' || ext === 'javascript' || ext === 'jsx' || ext === 'ts' || ext === 'tsx')
      return <Code2 className="w-4 h-4 text-yellow-400" />;
    if (ext === 'php') return <FileCode className="w-4 h-4 text-indigo-400" />;
    if (ext === 'svg' || ext === 'png' || ext === 'jpg') return <Sparkles className="w-4 h-4 text-cyan-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const handleDownloadSingle = (file: GeneratedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    files.forEach((file) => {
      const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-[#121520] border-l border-[#202536] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#202536] flex items-center justify-between bg-[#151928]">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-gray-100 font-sans">Semua file ({files.length})</h2>
        </div>

        <div className="flex items-center gap-1">
          {files.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
              title="Unduh Semua File"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1f2436] transition-colors"
            title="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {files.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center">
            <Folder className="w-8 h-8 text-gray-600 mb-2 opacity-50" />
            <span>Belum ada file yang dihasilkan dalam sesi ini.</span>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              onClick={() => onOpenFile(file)}
              className="p-3 rounded-2xl bg-[#181c2a] hover:bg-[#1f2538] border border-[#262c40] text-left transition-all cursor-pointer group flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 rounded-xl bg-[#121522] border border-[#202536] shrink-0">
                  {getFileIcon(file.filename, file.language)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-100 truncate font-mono">
                    {file.filename}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <span className="uppercase">{file.language}</span>
                    <span>•</span>
                    <span>{(file.code.length / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => handleDownloadSingle(file, e)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#282f46] transition-colors"
                  title="Unduh File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenFile(file)}
                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold flex items-center gap-1 transition-all shadow-md shadow-blue-900/30"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  Pratinjau
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
