import React from 'react';
import { TiebreakerVerdict } from '../types';
import { Award, CheckCircle2, ShieldAlert, Compass, HelpCircle, Sparkles, Image as ImageIcon, Video, Music, Bot, Mic } from 'lucide-react';

interface VerdictCardProps {
  verdict: TiebreakerVerdict;
  decisionTitle: string;
  onOpenVisualizer?: (optionName?: string) => void;
  onOpenVeo?: (optionName?: string) => void;
  onOpenLyria?: (winnerName?: string) => void;
  onOpenChatCoach?: () => void;
  onOpenLiveVoice?: () => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  verdict,
  decisionTitle,
  onOpenVisualizer,
  onOpenVeo,
  onOpenLyria,
  onOpenChatCoach,
  onOpenLiveVoice,
}) => {
  return (
    <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md space-y-6">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Tiebreaker Verdict</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tighter uppercase font-display mt-0.5">
              {verdict.winner}
            </h2>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="bg-[#0a0a0b] px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              AI Confidence
            </div>
            <div className="text-lg font-bold text-teal-400 font-mono">
              {verdict.confidenceScore}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-teal-400"
                strokeDasharray={`${verdict.confidenceScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Verdict Summary */}
      <div className="space-y-6">
        <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium bg-[#0a0a0b] p-4 rounded-xl border border-white/10">
          {verdict.verdictSummary}
        </p>

        {/* AI Action Toolbar for this Verdict */}
        <div className="p-3 bg-[#0a0a0b] border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider">AI Studio Actions for Winner:</span>
          <div className="flex flex-wrap items-center gap-2">
            {onOpenVisualizer && (
              <button
                onClick={() => onOpenVisualizer(verdict.winner)}
                className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>Imagen 3 Visual</span>
              </button>
            )}

            {onOpenVeo && (
              <button
                onClick={() => onOpenVeo(verdict.winner)}
                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Veo 3 Video</span>
              </button>
            )}

            {onOpenLyria && (
              <button
                onClick={() => onOpenLyria(verdict.winner)}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>Lyria 3 Anthem</span>
              </button>
            )}

            {onOpenChatCoach && (
              <button
                onClick={onOpenChatCoach}
                className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Bot className="w-3.5 h-3.5 text-teal-400" />
                <span>Chat Coach</span>
              </button>
            )}

            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>Live Voice</span>
              </button>
            )}
          </div>
        </div>

        {/* Key Decisive Factors */}
        <div>
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
            Core Decisive Factors
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {verdict.keyFactors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0a0a0b] border border-white/10 text-xs text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Tree: When to Choose Winner vs Alternatives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wide">
              <Compass className="w-4 h-4" />
              <span>Choose "{verdict.winner}" IF:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {verdict.whenToChooseWinner}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
              <Compass className="w-4 h-4" />
              <span>Pivot to Alternative IF:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {verdict.whenToChooseAlternative}
            </p>
          </div>
        </div>

        {/* Devil's Advocate Blindspot */}
        {verdict.devilsAdvocatePoint && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-rose-300 uppercase tracking-widest">
                Devil's Advocate Blindspot Challenge
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {verdict.devilsAdvocatePoint}
              </p>
            </div>
          </div>
        )}

        {/* Gut-Check Reflection Question */}
        {verdict.gutCheckQuestion && (
          <div className="p-4 rounded-xl bg-[#0a0a0b] border border-teal-500/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest">
                Final Gut-Check Reflection
              </div>
              <p className="text-xs text-slate-200 mt-1 italic font-medium leading-relaxed">
                "{verdict.gutCheckQuestion}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
