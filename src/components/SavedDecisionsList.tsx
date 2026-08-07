import React, { useState, useMemo } from 'react';
import { SavedDecision } from '../types';
import { X, History, Trash2, CheckCircle2, ArrowRight, Calendar, Search, PieChart, BarChart2, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

interface SavedDecisionsListProps {
  isOpen: boolean;
  onClose: () => void;
  savedDecisions: SavedDecision[];
  onSelectDecision: (decision: SavedDecision) => void;
  onDeleteDecision: (id: string) => void;
  onUpdateResolution: (id: string, isResolved: boolean, chosenOption?: string) => void;
}

export const SavedDecisionsList: React.FC<SavedDecisionsListProps> = ({
  isOpen,
  onClose,
  savedDecisions,
  onSelectDecision,
  onDeleteDecision,
  onUpdateResolution,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(true);

  // Compute outcome distribution statistics
  const stats = useMemo(() => {
    let optionAWins = 0;
    let optionBWins = 0;
    let optionCPlusWins = 0;
    let resolvedCount = 0;
    const total = savedDecisions.length;

    savedDecisions.forEach((d) => {
      if (d.isResolved) resolvedCount++;
      const winner = d.result?.verdict?.winner || d.chosenOption;
      if (winner && d.options && d.options.length > 0) {
        const idx = d.options.findIndex(
          (opt) => opt.toLowerCase().trim() === winner.toLowerCase().trim()
        );
        if (idx === 0) optionAWins++;
        else if (idx === 1) optionBWins++;
        else if (idx >= 2) optionCPlusWins++;
        else optionAWins++; // Default fallback
      }
    });

    const inProgressCount = total - resolvedCount;
    const resolvedPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
    const optionAPct = total > 0 ? Math.round((optionAWins / total) * 100) : 0;
    const optionBPct = total > 0 ? Math.round((optionBWins / total) * 100) : 0;
    const optionCPct = total > 0 ? Math.round((optionCPlusWins / total) * 100) : 0;

    return {
      total,
      resolvedCount,
      inProgressCount,
      resolvedPct,
      optionAWins,
      optionBWins,
      optionCPlusWins,
      optionAPct,
      optionBPct,
      optionCPct,
    };
  }, [savedDecisions]);

  if (!isOpen) return null;

  const filtered = savedDecisions.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.options.some((o) => o.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121214] border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl relative">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 bg-[#0a0a0b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-lg text-white font-display uppercase tracking-tight">
              Saved Decision Analyses
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outcome Distribution Chart Card */}
        {savedDecisions.length > 0 && (
          <div className="p-4 border-b border-white/10 bg-[#0a0a0b]/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Outcome Distribution
                </span>
              </div>
              <button
                onClick={() => setShowChart(!showChart)}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>{showChart ? 'Hide' : 'Show'} Chart</span>
                {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showChart && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#0a0a0b] border border-white/10 space-y-4">
                {/* Stats summary pill row */}
                <div className="grid grid-cols-3 gap-2 text-center border-b border-white/5 pb-3">
                  <div className="p-2 rounded-lg bg-[#121214] border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Total</div>
                    <div className="text-sm font-mono font-bold text-white">{stats.total}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121214] border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Resolved</div>
                    <div className="text-sm font-mono font-bold text-teal-400">{stats.resolvedCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121214] border border-white/5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Pending</div>
                    <div className="text-sm font-mono font-bold text-amber-400">{stats.inProgressCount}</div>
                  </div>
                </div>

                {/* Distribution Bar Chart */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Winner Position breakdown:</span>
                    <span className="text-teal-400 font-bold">{stats.total} decisions</span>
                  </div>

                  {/* Multi-segment distribution bar */}
                  <div className="w-full h-3.5 bg-[#121214] rounded-full overflow-hidden flex border border-white/10">
                    {stats.optionAPct > 0 && (
                      <div
                        style={{ width: `${stats.optionAPct}%` }}
                        className="bg-teal-400 h-full transition-all"
                        title={`Option A Winner: ${stats.optionAWins} (${stats.optionAPct}%)`}
                      />
                    )}
                    {stats.optionBPct > 0 && (
                      <div
                        style={{ width: `${stats.optionBPct}%` }}
                        className="bg-amber-400 h-full transition-all"
                        title={`Option B Winner: ${stats.optionBWins} (${stats.optionBPct}%)`}
                      />
                    )}
                    {stats.optionCPct > 0 && (
                      <div
                        style={{ width: `${stats.optionCPct}%` }}
                        className="bg-indigo-400 h-full transition-all"
                        title={`Option C+ Winner: ${stats.optionCPlusWins} (${stats.optionCPct}%)`}
                      />
                    )}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                      <span>Option A (1st):</span>
                      <strong className="text-white ml-auto">{stats.optionAWins} ({stats.optionAPct}%)</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span>Option B (2nd):</span>
                      <strong className="text-white ml-auto">{stats.optionBWins} ({stats.optionBPct}%)</strong>
                    </div>

                    {stats.optionCPlusWins > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-300 col-span-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                        <span>Option C / 3rd+ Choice:</span>
                        <strong className="text-white ml-auto">{stats.optionCPlusWins} ({stats.optionCPct}%)</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter decisions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              {savedDecisions.length === 0
                ? 'No saved decision analyses yet.'
                : 'No decisions match your search filter.'}
            </div>
          ) : (
            filtered.map((decision) => {
              const formattedDate = new Date(decision.createdAt).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric', year: 'numeric' }
              );

              return (
                <div
                  key={decision.id}
                  className="p-4 rounded-2xl bg-[#0a0a0b] border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formattedDate}
                      </span>
                      {decision.isResolved ? (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono font-bold uppercase tracking-wider border border-teal-500/20">
                          Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-semibold uppercase tracking-wider border border-amber-500/20">
                          In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-sm mb-2 group-hover:text-teal-400 transition-colors">
                      {decision.title}
                    </h3>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {decision.options.map((opt, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono bg-[#121214] text-slate-400 px-2 py-0.5 rounded border border-white/10"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>

                    {decision.result?.verdict && (
                      <div className="text-xs font-mono text-teal-300 bg-teal-500/10 p-2 rounded-lg border border-teal-500/20 mb-3">
                        Winner: <strong className="text-white">{decision.result.verdict.winner}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => onSelectDecision(decision)}
                      className="text-xs font-mono font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <span>View Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdateResolution(
                            decision.id,
                            !decision.isResolved,
                            decision.result?.verdict?.winner
                          )
                        }
                        className={`text-xs font-mono px-2 py-1 rounded-md border uppercase tracking-wider ${
                          decision.isResolved
                            ? 'bg-[#121214] text-slate-400 border-white/10 hover:text-white'
                            : 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20'
                        }`}
                        title={decision.isResolved ? 'Mark as Pending' : 'Mark as Resolved'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                        {decision.isResolved ? 'Resolved' : 'Mark Done'}
                      </button>

                      <button
                        onClick={() => onDeleteDecision(decision.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
