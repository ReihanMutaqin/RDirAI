'use client';

import React from 'react';
import { GeneratedFile } from '@/types/chat';
import { FileCode, Code2, Sparkles, FileText, Folder, Play, Eye } from 'lucide-react';

interface FileCardWidgetProps {
  filename?: string;
  language?: string;
  sizeKb?: number;
  isAllFilesFolder?: boolean;
  fileCount?: number;
  onPreview: () => void;
}

export const FileCardWidget: React.FC<FileCardWidgetProps> = ({
  filename = 'file_document.docx',
  language = 'docx',
  sizeKb = 2.13,
  isAllFilesFolder = false,
  fileCount = 1,
  onPreview,
}) => {
  const getFileIcon = () => {
    if (isAllFilesFolder) return <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
    const ext = filename.split('.').pop()?.toLowerCase() || language;
    if (ext === 'html' || ext === 'htm') return <FileCode className="w-5 h-5 text-orange-400" />;
    if (ext === 'css') return <Code2 className="w-5 h-5 text-blue-400" />;
    if (ext === 'js' || ext === 'javascript' || ext === 'jsx' || ext === 'ts' || ext === 'tsx')
      return <Code2 className="w-5 h-5 text-yellow-400" />;
    if (ext === 'php') return <FileCode className="w-5 h-5 text-indigo-400" />;
    if (ext === 'svg' || ext === 'png' || ext === 'jpg') return <Sparkles className="w-5 h-5 text-cyan-400" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div
      onClick={onPreview}
      className="my-3 p-3.5 rounded-2xl bg-white hover:bg-gray-50/50 border border-gray-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm flex items-center justify-between group max-w-xl"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
          {getFileIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-gray-800 truncate font-mono">
            {isAllFilesFolder ? 'Semua file' : filename}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
            {isAllFilesFolder ? `Pratinjau dan unduh file (${fileCount} file)` : `Pratinjau (${sizeKb} KB)`}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        className="ml-3 px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-blue-50 text-gray-600 group-hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-all border border-gray-200 group-hover:border-blue-200 shadow-sm shrink-0"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Pratinjau</span>
      </button>
    </div>
  );
};
