'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OPENROUTER_MODELS, ModelOption } from '@/types/chat';
import { ChevronDown, Sparkles, Zap, Code, Cpu, Check } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current =
    OPENROUTER_MODELS.find((m) => m.id === selectedModel) || OPENROUTER_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('code')) return <Code className="w-4 h-4 text-emerald-4-00" />;
    if (modelId.includes('flash')) return <Zap className="w-4 h-4 text-amber-400" />;
    if (modelId.includes('550b')) return <Sparkles className="w-4 h-4 text-purple-400" />;
    return <Cpu className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-kimi-card border border-kimi-border hover:border-kimi-accent/50 text-gray-200 text-sm font-medium transition-all shadow-sm"
      >
        {getModelIcon(current.id)}
        <span>{current.name}</span>
        {current.badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {current.badge}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-kimi-card border border-kimi-border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[11px] font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
            Model AI OpenRouter (Gratis)
          </div>
          <div className="space-y-1">
            {OPENROUTER_MODELS.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'bg-kimi-hover border border-kimi-accent/40 text-white'
                      : 'hover:bg-kimi-hover/60 text-gray-300'
                  }`}
                >
                  <div className="mt-0.5">{getModelIcon(model.id)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-100 truncate">
                        {model.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-kimi-accent" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
