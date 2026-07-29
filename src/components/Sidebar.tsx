'use client';

import React, { useState } from 'react';
import { Conversation, GeneratedFile, CodeArtifact } from '@/types/chat';
import {
  Plus,
  MessageSquare,
  Trash2,
  Database,
  Bot,
  Folder,
  FileCode,
  FileText,
  Code2,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
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
    if (ext === 'svg' || ext === 'png' || ext === 'jpg') return <Sparkles className="w-4 h-4 text-pink-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-kimi-sidebar border-r border-kimi-border flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-kimi-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                RdirAI
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium">
                  v2.5
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Claude & Kimi Style Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all duration-200 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Percakapan Baru</span>
          </button>
        </div>

        {/* Navigation Tabs: Riwayat Chat vs Folder Files (Like Kimi Workspace) */}
        <div className="px-3 pb-2 flex gap-1 border-b border-kimi-border/60">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'chats'
                ? 'bg-kimi-card border border-kimi-border text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat ({conversations.length})
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'files'
                ? 'bg-kimi-card border border-kimi-border text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-purple-400" />
            Folder ({files.length})
          </button>
        </div>

        {/* Sidebar Main Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {activeTab === 'chats' ? (
            /* Chat History View */
            <>
              <div className="text-[11px] font-semibold text-gray-500 px-3 py-1 uppercase tracking-wider">
                Riwayat Chat
              </div>

              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Belum ada percakapan. Mulai percakapan baru di atas!
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeId;
                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center rounded-xl transition-all ${
                        isActive
                          ? 'bg-kimi-card border border-kimi-accent/40 text-white font-medium shadow-sm'
                          : 'hover:bg-kimi-hover text-gray-400 hover:text-gray-200'
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
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-purple-400' : 'text-gray-500'
                          }`}
                        />
                        <span className="text-sm truncate">{conv.title}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-opacity"
                        title="Hapus percakapan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            /* Folder / File Explorer View (Kimi Style) */
            <div className="space-y-2">
              <button
                onClick={() => setIsFolderExpanded(!isFolderExpanded)}
                className="w-full text-left flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                {isFolderExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                )}
                <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span>workspace / src</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded-md">
                  {files.length} file
                </span>
              </button>

              {isFolderExpanded && (
                <div className="pl-4 space-y-1 border-l border-kimi-border ml-3">
                  {files.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      Belum ada file yang dibuat. Minta AI membuat kode HTML, CSS, JS, atau PHP!
                    </div>
                  ) : (
                    files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          onOpenFile(file);
                          if (window.innerWidth < 768) onClose();
                        }}
                        className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 bg-kimi-card/60 hover:bg-kimi-hover border border-kimi-border/40 text-gray-200 hover:text-white text-xs transition-all group shadow-sm"
                      >
                        {getFileIcon(file.filename, file.language)}
                        <span className="truncate flex-1 font-mono">{file.filename}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-purple-300 font-semibold px-1.5 py-0.5 bg-purple-950 rounded">
                          View
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
        <div className="p-3 border-t border-kimi-border bg-kimi-bg/40">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-kimi-card/80 border border-kimi-border text-xs text-gray-400">
            <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gray-300 font-medium truncate">
                TiDB Cloud (MySQL v8.5)
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Active (ap-southeast-1)
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
