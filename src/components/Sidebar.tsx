'use client';

import React, { useState } from 'react';
import { Conversation, GeneratedFile } from '@/types/chat';
import {
  Plus,
  MessageSquare,
  Trash2,
  Database,
  Folder,
  FileCode,
  FileText,
  Code2,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Terminal,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  files: GeneratedFile[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenFile: (file: GeneratedFile) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  files,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenFile,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'files'>('chats');
  const [isFolderExpanded, setIsFolderExpanded] = useState(true);

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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0f1117] border-r border-[#1e2332] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-[#1e2332] flex items-center justify-between bg-[#121520]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5 font-sans">
                Rdir Studio
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 uppercase tracking-wider">
                  Pro
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 font-mono">Workspace Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all duration-200 group border border-blue-400/20"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Sesi Proyek Baru</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 pb-2 flex gap-1 border-b border-[#1e2332]">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'chats'
                ? 'bg-[#181c2a] border border-[#262c3e] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            Riwayat ({conversations.length})
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'files'
                ? 'bg-[#181c2a] border border-[#262c3e] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            Workspace ({files.length})
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {activeTab === 'chats' ? (
            <>
              <div className="text-[10px] font-semibold text-gray-500 px-3 py-1 uppercase tracking-wider font-mono">
                Sesi Pengembangan
              </div>

              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Belum ada sesi proyek. Klik Sesi Proyek Baru di atas!
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeId;
                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#181c2a] border border-blue-500/40 text-white font-medium shadow-sm'
                          : 'hover:bg-[#151824] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 768) onClose();
                        }}
                        className="flex-1 p-2.5 text-left flex items-center gap-2.5 min-w-0"
                      >
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-blue-400' : 'text-gray-500'
                          }`}
                        />
                        <span className="text-xs truncate">{conv.title}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-opacity"
                        title="Hapus Sesi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            /* Folder / File Explorer View */
            <div className="space-y-2">
              <button
                onClick={() => setIsFolderExpanded(!isFolderExpanded)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                {isFolderExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                )}
                <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="font-mono">project / src</span>
                <span className="ml-auto text-[10px] bg-[#1e2332] text-gray-400 px-1.5 py-0.5 rounded font-mono">
                  {files.length}
                </span>
              </button>

              {isFolderExpanded && (
                <div className="pl-4 space-y-1 border-l border-[#1e2332] ml-3">
                  {files.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      Belum ada file dalam workspace proyek.
                    </div>
                  ) : (
                    files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          onOpenFile(file);
                          if (window.innerWidth < 768) onClose();
                        }}
                        className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 bg-[#141724]/80 hover:bg-[#1a1f30] border border-[#202536] text-gray-200 hover:text-white text-xs transition-all group shadow-sm"
                      >
                        {getFileIcon(file.filename, file.language)}
                        <span className="truncate flex-1 font-mono text-[11px]">{file.filename}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-300 font-semibold px-1.5 py-0.5 bg-blue-950/80 rounded border border-blue-500/30">
                          Inspect
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Database Status Footer */}
        <div className="p-3 border-t border-[#1e2332] bg-[#0c0e14]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141724] border border-[#202536] text-xs text-gray-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gray-200 font-medium truncate font-mono">
                TiDB Cloud Engine
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected (ap-southeast-1)
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
