'use client';

import React from 'react';
import { GenerationPhase } from '@/types/chat';
import { CheckCircle2, Loader2, Circle, Layers } from 'lucide-react';

interface PhaseTrackerProps {
  phases: GenerationPhase[];
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ phases }) => {
  if (!phases || phases.length === 0) return null;

  const completedCount = phases.filter((p) => p.status === 'completed').length;
  const progressPercent = Math.round((completedCount / phases.length) * 100);

  return (
    <div className="my-4 p-4 rounded-2xl bg-[#121520] border border-[#222738] shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-gray-200 tracking-wide">
            Tahap Pembuatan (Phase Execution)
          </span>
        </div>
        <span className="text-xs font-mono font-semibold text-blue-400">
          {progressPercent}% Selesai
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Phase Steps Grid */}
      <div className="space-y-2">
        {phases.map((phase) => {
          return (
            <div
              key={phase.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                phase.status === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : phase.status === 'in_progress'
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-200 shadow-md animate-pulse'
                  : 'bg-slate-950/40 border-slate-800 text-gray-500'
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
                  <div className="text-xs font-medium truncate">{phase.title}</div>
                  {phase.description && (
                    <div className="text-[11px] text-gray-400 truncate">
                      {phase.description}
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold uppercase ${
                  phase.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : phase.status === 'in_progress'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {phase.status === 'completed'
                  ? 'Selesai'
                  : phase.status === 'in_progress'
                  ? 'Proses'
                  : 'Menunggu'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
