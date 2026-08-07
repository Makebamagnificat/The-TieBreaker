import React from 'react';
import { Scale, History, Dices, PlusCircle, Bot, Mic, Image as ImageIcon, Video, Music } from 'lucide-react';

interface HeaderProps {
  onNewDecision: () => void;
  onOpenHistory: () => void;
  onOpenQuickTiebreaker: () => void;
  onOpenLiveVoice: () => void;
  onOpenChatCoach: () => void;
  onOpenVisualizer: () => void;
  onOpenVeo: () => void;
  onOpenLyria: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDecision,
  onOpenHistory,
  onOpenQuickTiebreaker,
  onOpenLiveVoice,
  onOpenChatCoach,
  onOpenVisualizer,
  onOpenVeo,
  onOpenLyria,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-white/10 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <button
          onClick={onNewDecision}
          className="flex items-center gap-3 text-left group focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tighter uppercase font-display">
                The Tiebreaker
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                AI Suite
              </span>
            </div>
          </div>
        </button>

        {/* AI Suite Shortcut Bar */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-[#121214] border border-white/10 rounded-xl text-xs font-mono">
          <button
            onClick={onOpenLiveVoice}
            className="px-2.5 py-1 text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-lg flex items-center gap-1 transition-colors"
            title="Gemini Live Voice Hotline"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Voice Live</span>
          </button>
          <button
            onClick={onOpenChatCoach}
            className="px-2.5 py-1 text-teal-300 hover:text-white hover:bg-teal-500/20 rounded-lg flex items-center gap-1 transition-colors"
            title="AI Decision Coach Chat"
          >
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Coach</span>
          </button>
          <button
            onClick={onOpenVisualizer}
            className="px-2.5 py-1 text-sky-300 hover:text-white hover:bg-sky-500/20 rounded-lg flex items-center gap-1 transition-colors"
            title="Option Visualizer & Aspect Ratio Studio"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Visuals</span>
          </button>
          <button
            onClick={onOpenVeo}
            className="px-2.5 py-1 text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-lg flex items-center gap-1 transition-colors"
            title="Veo 3 AI Outcome Video Generator"
          >
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Veo 3</span>
          </button>
          <button
            onClick={onOpenLyria}
            className="px-2.5 py-1 text-amber-300 hover:text-white hover:bg-amber-500/20 rounded-lg flex items-center gap-1 transition-colors"
            title="Lyria 3 Music & Anthem Studio"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Lyria Music</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenQuickTiebreaker}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
            title="Fast 10-Second Tiebreaker & Coin Flip"
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Quick Tiebreaker</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-300 bg-[#121214] hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            title="View saved decision analyses"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-teal-500 text-slate-950 rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={onNewDecision}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 uppercase tracking-widest bg-white hover:bg-teal-400 rounded-full shadow-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Decision</span>
          </button>
        </div>
      </div>
    </header>
  );
};
