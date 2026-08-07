import React, { useState } from 'react';
import { X, Dices, Sparkles, RefreshCw, ArrowRight, HelpCircle } from 'lucide-react';

interface QuickCoinFlipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCoinFlipModal: React.FC<QuickCoinFlipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [priority, setPriority] = useState('');

  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'A' | 'B' | null>(null);

  const [aiAdvice, setAiAdvice] = useState<{
    winner: string;
    reasoning: string;
    acceptedTradeoff: string;
    gutCheckTest: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!isOpen) return null;

  const handleRunQuickTiebreaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionA.trim() || !optionB.trim()) return;

    // Trigger coin flip animation
    setIsFlipping(true);
    setCoinResult(null);
    setAiAdvice(null);

    // Random coin result
    const flip = Math.random() > 0.5 ? 'A' : 'B';

    setTimeout(() => {
      setCoinResult(flip);
      setIsFlipping(false);
    }, 1200);

    // Fetch quick AI tiebreaker reasoning
    setLoadingAi(true);
    try {
      const res = await fetch('/api/quick-tiebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          tiebreakerCriteria: priority.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiAdvice(data);
      }
    } catch (err) {
      console.error('Quick tiebreaker error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121214] border border-white/10 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Dices className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter font-display">
              10-Second Quick Tiebreaker
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Stuck between two choices? Flip the coin & get fast AI reasoning.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunQuickTiebreaker} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                Option A
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Order Pizza"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                Option B
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cook at home"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
              Main Priority / Constraint <span className="text-slate-600 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Save money, save time, health..."
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={isFlipping || !optionA.trim() || !optionB.trim()}
            className="w-full py-3 bg-white hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            <Dices className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
            <span>{isFlipping ? 'Flipping Coin...' : 'Flip Coin & Ask Tiebreaker'}</span>
          </button>
        </form>

        {/* Coin flip animation & results section */}
        {(isFlipping || coinResult || aiAdvice) && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
            {/* Visual Coin */}
            <div className="flex flex-col items-center justify-center">
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 via-teal-300 to-white text-slate-950 font-black font-mono text-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 border-4 border-teal-400 transition-transform ${
                  isFlipping ? 'animate-bounce scale-110' : ''
                }`}
              >
                {isFlipping ? '?' : coinResult === 'A' ? 'A' : 'B'}
              </div>
              <div className="text-xs text-teal-400 font-mono uppercase tracking-wider mt-2">
                {isFlipping
                  ? 'Coin is in the air...'
                  : `Coin Landed on: ${coinResult === 'A' ? optionA : optionB}`}
              </div>
            </div>

            {/* AI Reasoning */}
            {loadingAi ? (
              <div className="p-4 rounded-xl bg-[#0a0a0b] border border-white/10 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-teal-400" />
                <span>AI evaluating quick tiebreaker...</span>
              </div>
            ) : (
              aiAdvice && (
                <div className="p-4 rounded-2xl bg-[#0a0a0b] border border-teal-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-teal-400 uppercase tracking-widest text-[11px]">
                      AI Recommendation
                    </span>
                    <span className="font-mono font-bold text-white bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">
                      {aiAdvice.winner}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-normal">
                    {aiAdvice.reasoning}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-1 font-mono">
                    <strong className="text-rose-400">Trade-off accepted:</strong> {aiAdvice.acceptedTradeoff}
                  </div>

                  <div className="text-[11px] text-amber-300 italic pt-1 border-t border-white/10 font-mono">
                    <strong className="text-amber-400">Gut-check test:</strong> "{aiAdvice.gutCheckTest}"
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
