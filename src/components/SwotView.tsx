import React, { useState } from 'react';
import { OptionSWOT } from '../types';
import { Grid, ShieldAlert, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface SwotViewProps {
  swotAnalyses: OptionSWOT[];
}

export const SwotView: React.FC<SwotViewProps> = ({ swotAnalyses }) => {
  const [selectedOptIdx, setSelectedOptIdx] = useState(0);

  if (!swotAnalyses || swotAnalyses.length === 0) return null;

  const currentSwot = swotAnalyses[selectedOptIdx] || swotAnalyses[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tighter font-display">
            <Grid className="w-5 h-5 text-teal-400" />
            <span>SWOT Strategic Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal factors (Strengths & Weaknesses) and external factors (Opportunities & Threats) for each choice.
          </p>
        </div>

        {/* Option Tabs */}
        {swotAnalyses.length > 1 && (
          <div className="flex items-center gap-1.5 bg-[#121214] p-1 rounded-xl border border-white/10">
            {swotAnalyses.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOptIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                  selectedOptIdx === idx
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {item.optionName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2x2 Grid Layout from Elegant Dark specification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Strengths */}
        <div className="bg-[#121214] p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-white/5">
            <h4 className="text-2xl font-light text-white tracking-tight">Strengths</h4>
            <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">INTERNAL / POSITIVE</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {currentSwot.swot.strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-teal-400 font-bold">+</span>
                <span className="leading-relaxed text-xs text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-[#121214] p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-white/5">
            <h4 className="text-2xl font-light text-white italic font-serif">Weaknesses</h4>
            <span className="text-[10px] text-rose-400 font-mono tracking-widest uppercase">INTERNAL / NEGATIVE</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {currentSwot.swot.weaknesses.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold">−</span>
                <span className="leading-relaxed text-xs text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="bg-[#121214] p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-white/5">
            <h4 className="text-2xl font-light text-white tracking-tight">Opportunities</h4>
            <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">EXTERNAL / POSITIVE</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {currentSwot.swot.opportunities.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-teal-400 font-bold">↑</span>
                <span className="leading-relaxed text-xs text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Threats */}
        <div className="bg-[#121214] p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-white/5">
            <h4 className="text-2xl font-light text-white tracking-tight">Threats</h4>
            <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase">EXTERNAL / NEGATIVE</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {currentSwot.swot.threats.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold">!</span>
                <span className="leading-relaxed text-xs text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
