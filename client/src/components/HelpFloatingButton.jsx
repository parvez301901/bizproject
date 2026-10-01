import React, { useState } from 'react';
import { HelpCircle, Sparkles, ChevronRight, Compass } from 'lucide-react';

export default function HelpFloatingButton({ onClick, className = '' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className={`select-none font-sans ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Open System Help and Step-by-Step Guide"
        className="group flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all duration-300 hover:shadow-emerald-500/10 hover:border-emerald-500/50 cursor-pointer w-full"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            <HelpCircle className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="tracking-tight">Help & Guide</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-700/60 hidden sm:inline-block">
            Steps
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </div>
  );
}
