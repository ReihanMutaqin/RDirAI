'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, CodeArtifact } from '@/types/chat';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { LiveView } from '@/components/LiveView';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free'
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
    }
  }, [activeConvId]);

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

  // Helper to extract code blocks for automatic Live View triggering
  const extractArtifactFromContent = (content: string): CodeArtifact | null => {
    const codeBlockRegex = /```(html|xml|svg|javascript|jsx|js|css)\n([\s\S]*?)```/i;
    const match = content.match(codeBlockRegex);
    if (match) {
      const lang = match[1].toLowerCase();
      const code = match[2].trim();
      return {
        id: `artifact_${Date.now()}`,
        title: `Hasil Kode (${lang.toUpperCase()})`,
        language: lang,
        code,
      };
    }
    return null;
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

    const assistantMsgId = `msg_a_${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      created_at: new Date().toISOString(),
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

      // Update active conversation ID from response header if creating new thread
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          )
        );

        // Auto detect live preview artifact if user asked for code/app
        const artifact = extractArtifactFromContent(accumulated);
        if (artifact) {
          setActiveArtifact(artifact);
        }
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-kimi-bg">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
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
