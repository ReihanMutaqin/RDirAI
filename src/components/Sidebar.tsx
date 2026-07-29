'use client';

import React from 'react';
import { Conversation } from '@/types/chat';
import { Plus, MessageSquare, Trash2, Database, Bot, Sparkles, X } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) => {
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
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Claude & Kimi Style AI</p>
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
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
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
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
