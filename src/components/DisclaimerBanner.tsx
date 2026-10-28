import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 border-b border-amber-900/40 px-4 py-2 text-xs font-mono text-slate-300 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/80 text-amber-400 font-bold text-[10px] uppercase tracking-wide">
          Notice
        </span>
        <span className="text-amber-200/90 font-medium">
          Simulated Molecular Encoding Scheme:
        </span>
        <span className="text-slate-400 hidden sm:inline">
          This system models a theoretical 4-state reversible bit-pair mapping (00→A, 01→B, 10→C, 11→D). It is an educational computational simulation, not a physical wet-lab protein synthesis protocol.
        </span>
      </div>

      <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center gap-1">
        <span>Deterministic UTF-8 / Binary</span>
      </div>
    </div>
  );
};
