'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, CodeArtifact, GeneratedFile, GenerationPhase, AttachedFile, UserProfile } from '@/types/chat';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { LiveView } from '@/components/LiveView';
import { AuthModal } from '@/components/AuthModal';

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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

  useEffect(() => {
    checkCurrentUser();
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
      setGeneratedFiles([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    extractAllFilesFromMessages(messages);
  }, [messages]);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking auth session:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      handleNewConversation();
      fetchConversations();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

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

  // Clean file extraction with deduplication (index.html, style.css, script.js)
  const extractAllFilesFromMessages = (msgList: Message[]) => {
    const fileMap: Map<string, GeneratedFile> = new Map();
    const codeBlockRegex = /```(html|xml|svg|javascript|jsx|js|css|php|python|json|sql)?\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/gi;

    msgList.forEach((msg) => {
      if (msg.role === 'assistant') {
        let match;
        while ((match = codeBlockRegex.exec(msg.content)) !== null) {
          const lang = match[1]?.toLowerCase() || 'html';
          
          let defaultFilename = `index.${lang === 'javascript' || lang === 'jsx' ? 'js' : lang}`;
          if (lang === 'css') defaultFilename = 'style.css';
          if (lang === 'js' || lang === 'javascript') defaultFilename = 'script.js';
          if (lang === 'php') defaultFilename = 'index.php';
          if (lang === 'svg') defaultFilename = 'vector.svg';

          const filename = match[2] || defaultFilename;
          const code = match[3].trim();

          if (code) {
            const existing = fileMap.get(filename);
            if (existing) {
              fileMap.set(filename, {
                ...existing,
                code: existing.code + '\n' + code,
              });
            } else {
              fileMap.set(filename, {
                id: `file_${filename}_${Date.now()}`,
                filename,
                language: lang,
                code,
              });
            }
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

      if (code.length >= 25) {
        return {
          id: `artifact_${Date.now()}`,
          title: filename ? `File: ${filename}` : `${lang.toUpperCase()} Preview`,
          language: lang,
          code,
          filename,
        };
      }
    }
    return null;
  };

  const createPhasesForPrompt = (): GenerationPhase[] => {
    return [
      { id: 1, title: 'Phase 1: Analisis Instruksi & Arsitektur Kode', status: 'in_progress', description: 'Menganalisis permintaan & menyiapkan struktur' },
      { id: 2, title: 'Phase 2: Generasi & Styling Komponen Web', status: 'pending', description: 'Menulis struktur HTML, Tailwind & UI' },
      { id: 3, title: 'Phase 3: Penulisan Skrip Logic & Functionality', status: 'pending', description: 'Menyusun logika JavaScript / PHP Engine' },
      { id: 4, title: 'Phase 4: Sinkronisasi Workspace & Live View', status: 'pending', description: 'Memverifikasi pratinjau & menyelaraskan file' },
    ];
  };

  const handleSendMessage = async (text: string, attachments?: AttachedFile[]) => {
    let fullPromptContent = text;

    if (attachments && attachments.length > 0) {
      const fileContexts = attachments
        .map((att) => {
          if (att.content.startsWith('data:image')) {
            return `\n\n[Lampiran Gambar: ${att.name} (${(att.size / 1024).toFixed(1)} KB)]`;
          }
          return `\n\n[Lampiran File: ${att.name} (${(att.size / 1024).toFixed(1)} KB)]\n\`\`\`\n${att.content}\n\`\`\``;
        })
        .join('\n');

      fullPromptContent = (text ? text + '\n' : '') + fileContexts;
    }

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text || 'File terlampir',
      created_at: new Date().toISOString(),
      attachments,
    };

    const apiUserMsg: Message = {
      ...userMsg,
      content: fullPromptContent,
    };

    const newMessages = [...messages, apiUserMsg];
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const initialPhases = createPhasesForPrompt();

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

        const hasCodeBlock = accumulated.includes('```');
        const hasSecondBlock = (accumulated.match(/```/g) || []).length >= 4;

        const updatedPhases: GenerationPhase[] = initialPhases.map((p) => {
          if (p.id === 1) return { ...p, status: 'completed' };
          if (p.id === 2) return { ...p, status: hasCodeBlock ? 'completed' : 'in_progress' };
          if (p.id === 3) return { ...p, status: hasCodeBlock ? (hasSecondBlock ? 'completed' : 'in_progress') : 'pending' };
          if (p.id === 4) return { ...p, status: hasSecondBlock ? 'in_progress' : 'pending' };
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

      const finalPhases: GenerationPhase[] = initialPhases.map((p) => ({ ...p, status: 'completed' }));
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, phases: finalPhases } : m))
      );
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

  const handleContinueGeneration = () => {
    if (isLoading) return;
    const continuePrompt =
      'Lanjutkan penulisan kode sebelumnya persis dari titik terpotong terakhir tanpa mengulang dari awal. Sambungkan sintaksis dan kode berikut secara utuh.';
    handleSendMessage(continuePrompt);
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
      {/* Auth Modal for Login & Register */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          fetchConversations();
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        files={generatedFiles}
        user={user}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenFile={handleOpenFileInLiveView}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex overflow-hidden">
        <ChatInterface
          messages={messages}
          generatedFiles={generatedFiles}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onSendMessage={handleSendMessage}
          onContinueGeneration={handleContinueGeneration}
          onStopStream={handleStopStream}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenArtifact={(artifact) => setActiveArtifact(artifact)}
          activeArtifact={activeArtifact}
        />

        {/* Live View Split Screen with allFiles workspace bundling */}
        {activeArtifact && (
          <LiveView
            artifact={activeArtifact}
            allFiles={generatedFiles}
            onClose={() => setActiveArtifact(null)}
          />
        )}
      </main>
    </div>
  );
};
