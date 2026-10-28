import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FastForward,
  Database,
  Gauge,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ControlDockProps {
  onEncode: () => void;
  onRetrieve: () => void;
  onReset: () => void;
  canEncode: boolean;
  canRetrieve: boolean;
  isProcessing: boolean;
  mode: string;
  speed: 'slow' | 'normal' | 'fast' | 'instant';
  setSpeed: (speed: 'slow' | 'normal' | 'fast' | 'instant') => void;
  hasStoredData: boolean;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  onEncode,
  onRetrieve,
  onReset,
  canEncode,
  canRetrieve,
  isProcessing,
  mode,
  speed,
  setSpeed,
  hasStoredData,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[940px] px-3 pointer-events-none">
      <div className="flex flex-col items-center">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 shadow-lg backdrop-blur-none transition hover:bg-slate-800"
          title="Toggle Dock Visibility (Zen Mode)"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Dock</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Dock</span>
            </>
          )}
        </button>

        {/* Unified Bottom Dock */}
        {!isCollapsed && (
          <div className="pointer-events-auto w-full bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 md:p-3.5 shadow-2xl backdrop-blur-none flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Primary Execution Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onEncode}
                disabled={!canEncode || isProcessing}
                className={`px-3.5 py-2 rounded-xl font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
                  canEncode && !isProcessing
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-md shadow-cyan-950'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
                title="Convert text to binary and synthesize simulated molecular sequence"
              >
                <Sparkles className="w-4 h-4" />
                <span>Encode</span>
              </button>

              <button
                onClick={onRetrieve}
                disabled={!canRetrieve || isProcessing}
                className={`px-3.5 py-2 rounded-xl font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
                  canRetrieve && !isProcessing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-md shadow-emerald-950'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
                title="Read stored molecular code and reconstruct verified UTF-8 text"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Retrieve Data</span>
              </button>

              <button
                onClick={onReset}
                disabled={isProcessing}
                className="px-3 py-2 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition"
                title="Clear current data and reset 3D chamber simulation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>

            {/* Middle: Animation Speed Multiplier */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 font-mono">
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Speed:</span>
              </div>
              <div className="flex items-center gap-1">
                {(['slow', 'normal', 'fast', 'instant'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                      speed === s
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {s === 'slow' ? '0.5x' : s === 'normal' ? '1x' : s === 'fast' ? '3x' : 'Max'}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: State & Persistence Telemetry */}
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Storage:</span>
                <span className={hasStoredData ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                  {hasStoredData ? 'Active Vault' : 'Empty'}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-1 text-slate-500 border-l border-slate-800 pl-3">
                <span>Phase:</span>
                <span className="text-cyan-300 uppercase">{mode}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
