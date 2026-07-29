'use client';

import React from 'react';
import { GenerationPhase } from '@/types/chat';
import { CheckCircle2, Loader2, Circle, Layers, Sparkles } from 'lucide-react';

interface PhaseTrackerProps {
  phases: GenerationPhase[];
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ phases }) => {
  if (!phases || phases.length === 0) return null;

  const completedCount = phases.filter((p) => p.status === 'completed').length;
  const inProgressPhase = phases.find((p) => p.status === 'in_progress');
  const progressPercent = Math.round((completedCount / phases.length) * 100);

  return (
    <div className="my-3 p-4 rounded-2xl bg-[#141826] border border-blue-500/30 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-100 tracking-wide block">
              Tahap Pembuatan Proyek (Phase Execution)
            </span>
            {inProgressPhase && (
              <span className="text-[11px] text-blue-300 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Aktif: {inProgressPhase.title}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-1 rounded-md border border-blue-500/30">
          {progressPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden my-3 border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out shadow-sm shadow-blue-500/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Phase Steps Grid */}
      <div className="grid grid-cols-1 gap-2 mt-2">
        {phases.map((phase) => {
          return (
            <div
              key={phase.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                phase.status === 'completed'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : phase.status === 'in_progress'
                  ? 'bg-blue-950/60 border-blue-500/60 text-blue-100 shadow-md animate-pulse'
                  : 'bg-[#0f111a] border-[#1e2332] text-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {phase.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : phase.status === 'in_progress' ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{phase.title}</div>
                  {phase.description && (
                    <div className="text-[10px] text-gray-400 truncate">
                      {phase.description}
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                  phase.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : phase.status === 'in_progress'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {phase.status === 'completed'
                  ? 'Selesai'
                  : phase.status === 'in_progress'
                  ? 'Sedang Jalan'
                  : 'Menunggu'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
