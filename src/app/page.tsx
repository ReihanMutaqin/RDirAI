'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, CodeArtifact, GeneratedFile, GenerationPhase } from '@/types/chat';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { LiveView } from '@/components/LiveView';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'inclusionai/ling-3.0-flash:free'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<CodeArtifact | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch initial conversations from TiDB database
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
      setGeneratedFiles([]);
    }
  }, [activeConvId]);

  // Extract all files from messages into workspace folder
  useEffect(() => {
    extractAllFilesFromMessages(messages);
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations?id=${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleNewConversation = () => {
    if (isLoading) handleStopStream();
    setActiveConvId(null);
    setMessages([]);
    setGeneratedFiles([]);
    setActiveArtifact(null);
  };

  const handleSelectConversation = (id: string) => {
    if (isLoading) handleStopStream();
    setActiveConvId(id);
    setActiveArtifact(null);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // Extract code blocks from content into files array for Sidebar Folder Explorer
  const extractAllFilesFromMessages = (msgList: Message[]) => {
    const fileMap: Map<string, GeneratedFile> = new Map();
    const codeBlockRegex = /```(html|xml|svg|javascript|jsx|js|css|php|python|json|sql)?\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/gi;

    msgList.forEach((msg) => {
      if (msg.role === 'assistant') {
        let match;
        let count = 1;
        while ((match = codeBlockRegex.exec(msg.content)) !== null) {
          const lang = match[1]?.toLowerCase() || 'html';
          const filename = match[2] || `file_${count}.${lang === 'javascript' ? 'js' : lang}`;
          const code = match[3].trim();

          if (code) {
            fileMap.set(filename, {
              id: `file_${filename}_${Date.now()}`,
              filename,
              language: lang,
              code,
            });
            count++;
          }
        }
      }
    });

    setGeneratedFiles(Array.from(fileMap.values()));
  };

  const extractArtifactFromContent = (content: string): CodeArtifact | null => {
    const codeBlockRegex = /```(html|xml|svg|javascript|jsx|js|css|php)\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/i;
    const match = content.match(codeBlockRegex);
    if (match) {
      const lang = match[1].toLowerCase();
      const filename = match[2] || `index.${lang === 'javascript' ? 'js' : lang}`;
      const code = match[3].trim();
      return {
        id: `artifact_${Date.now()}`,
        title: filename ? `File: ${filename}` : `${lang.toUpperCase()} Preview`,
        language: lang,
        code,
        filename,
      };
    }
    return null;
  };

  // Generate multi-phase execution timeline for code requests
  const createPhasesForPrompt = (promptText: string): GenerationPhase[] => {
    const lower = promptText.toLowerCase();
    if (
      lower.includes('buat') ||
      lower.includes('web') ||
      lower.includes('html') ||
      lower.includes('code') ||
      lower.includes('aplikasi') ||
      lower.includes('dashboard') ||
      lower.includes('php')
    ) {
      return [
        { id: 1, title: 'Phase 1: Analisis Kebutuhan & Struktur HTML/PHP', status: 'in_progress' },
        { id: 2, title: 'Phase 2: Desain Visual & Styling CSS/Tailwind', status: 'pending' },
        { id: 3, title: 'Phase 3: Implementasi Logic JavaScript & Functionality', status: 'pending' },
        { id: 4, title: 'Phase 4: Integrasi Workspace & Live View Preview', status: 'pending' },
      ];
    }
    return [];
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const initialPhases = createPhasesForPrompt(text);

    const assistantMsgId = `msg_a_${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      created_at: new Date().toISOString(),
      phases: initialPhases,
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          messages: newMessages,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      const returnedConvId = response.headers.get('X-Conversation-Id');
      if (returnedConvId && returnedConvId !== activeConvId) {
        setActiveConvId(returnedConvId);
        fetchConversations();
      }

      if (!response.body) {
        throw new Error('Readable stream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let pendingAnimation: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Dynamic phase progress update as response arrives
        const updatedPhases = initialPhases.map((p) => {
          if (accumulated.length > 500 && p.id === 1) return { ...p, status: 'completed' as const };
          if (accumulated.length > 500 && accumulated.length <= 1500 && p.id === 2)
            return { ...p, status: 'in_progress' as const };
          if (accumulated.length > 1500 && p.id === 2) return { ...p, status: 'completed' as const };
          if (accumulated.length > 1500 && accumulated.length <= 3000 && p.id === 3)
            return { ...p, status: 'in_progress' as const };
          if (accumulated.length > 3000 && p.id === 3) return { ...p, status: 'completed' as const };
          if (accumulated.length > 3000 && p.id === 4) return { ...p, status: 'in_progress' as const };
          return p;
        });

        if (pendingAnimation) cancelAnimationFrame(pendingAnimation);
        pendingAnimation = requestAnimationFrame(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulated, phases: updatedPhases }
                : m
            )
          );

          const artifact = extractArtifactFromContent(accumulated);
          if (artifact) {
            setActiveArtifact(artifact);
          }
        });
      }

      // Mark all phases completed at stream end
      if (initialPhases.length > 0) {
        const finalPhases = initialPhases.map((p) => ({ ...p, status: 'completed' as const }));
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, phases: finalPhases } : m))
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Streaming Error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    'Maaf, terjadi kesalahan saat terhubung ke server OpenRouter. Silakan coba lagi.',
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      fetchConversations();
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleOpenFileInLiveView = (file: GeneratedFile) => {
    setActiveArtifact({
      id: file.id,
      title: `File: ${file.filename}`,
      language: file.language,
      code: file.code,
      filename: file.filename,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-kimi-bg">
      {/* Sidebar Navigation & Folder Workspace Explorer */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        files={generatedFiles}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenFile={handleOpenFileInLiveView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex overflow-hidden">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onSendMessage={handleSendMessage}
          onStopStream={handleStopStream}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenArtifact={(artifact) => setActiveArtifact(artifact)}
          activeArtifact={activeArtifact}
        />

        {/* Live View Split Screen (Claude Artifacts style) */}
        {activeArtifact && (
          <LiveView
            artifact={activeArtifact}
            onClose={() => setActiveArtifact(null)}
          />
        )}
      </main>
    </div>
  );
};
