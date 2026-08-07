import React, { useState } from 'react';
import { ComparisonCriterion } from '../types';
import { Table, Plus, Trash2, SlidersHorizontal, Award } from 'lucide-react';

interface ComparisonTableViewProps {
  initialCriteria: ComparisonCriterion[];
  options: string[];
}

export const ComparisonTableView: React.FC<ComparisonTableViewProps> = ({
  initialCriteria,
  options,
}) => {
  const [criteria, setCriteria] = useState<ComparisonCriterion[]>(initialCriteria);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newImportance, setNewImportance] = useState(3);

  const handleImportanceChange = (id: string, delta: number) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, importance: Math.max(1, Math.min(5, c.importance + delta)) };
        }
        return c;
      })
    );
  };

  const handleScoreChange = (id: string, optionName: string, newScore: number) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            scores: {
              ...(c.scores || {}),
              [optionName]: Math.max(1, Math.min(10, newScore)),
            },
          };
        }
        return c;
      })
    );
  };

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterionName.trim()) return;

    const defaultScores: Record<string, number> = {};
    options.forEach((opt) => {
      defaultScores[opt] = 5;
    });

    const newCrit: ComparisonCriterion = {
      id: `crit-${Date.now()}`,
      name: newCriterionName.trim(),
      importance: newImportance,
      scores: defaultScores,
      notes: {},
    };

    setCriteria([...criteria, newCrit]);
    setNewCriterionName('');
    setNewImportance(3);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  // Calculate Weighted Totals per option
  const optionTotals = options.map((opt) => {
    let totalScore = 0;
    let maxPossible = 0;

    criteria.forEach((crit) => {
      const score = crit.scores?.[opt] ?? 5;
      const weight = crit.importance;
      totalScore += score * weight;
      maxPossible += 10 * weight; // max score is 10
    });

    const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    return {
      optionName: opt,
      totalScore,
      percentage,
    };
  });

  // Find winner
  const highestPercentage = Math.max(...optionTotals.map((t) => t.percentage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tighter font-display">
            <Table className="w-5 h-5 text-teal-400" />
            <span>Multi-Factor Decision Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare options across weighted key criteria. Tweak weights (1-5) and option ratings (1-10) to recalculate scores live.
          </p>
        </div>
      </div>

      {/* Summary Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {optionTotals.map((tot, idx) => {
          const isWinner = tot.percentage === highestPercentage && tot.percentage > 0;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                isWinner
                  ? 'bg-teal-500/10 border-teal-500/40 shadow-lg'
                  : 'bg-[#121214] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                  Option {String.fromCharCode(65 + idx)}
                </span>
                {isWinner && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Award className="w-3 h-3 text-teal-400" /> Top Choice
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-sm truncate mb-3">
                {tot.optionName}
              </h3>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-teal-400 font-mono">
                    {tot.percentage}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {tot.totalScore} weighted pts
                  </div>
                </div>

                {/* Meter bar */}
                <div className="w-24 h-2 bg-[#0a0a0b] rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-teal-400 transition-all duration-500"
                    style={{ width: `${tot.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0b] border-b border-white/10 text-slate-400 text-xs font-mono uppercase tracking-widest">
                <th className="p-4 w-64 min-w-[200px]">Criteria & Importance</th>
                {options.map((opt, idx) => (
                  <th key={idx} className="p-4 min-w-[180px] text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-mono font-bold flex items-center justify-center border border-teal-500/30">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  </th>
                ))}
                <th className="p-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {criteria.map((crit) => (
                <tr key={crit.id} className="hover:bg-white/5 transition-colors">
                  {/* Criteria Column */}
                  <td className="p-4 align-top">
                    <div className="font-bold text-white text-sm mb-1">
                      {crit.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">
                        Weight:
                      </span>
                      <div className="flex items-center gap-1 bg-[#0a0a0b] px-2 py-0.5 rounded border border-white/10 font-mono text-xs">
                        <button
                          onClick={() => handleImportanceChange(crit.id, -1)}
                          disabled={crit.importance <= 1}
                          className="text-slate-400 hover:text-slate-200 disabled:opacity-30 px-1 font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold text-teal-400 w-3 text-center">
                          {crit.importance}x
                        </span>
                        <button
                          onClick={() => handleImportanceChange(crit.id, 1)}
                          disabled={crit.importance >= 5}
                          className="text-slate-400 hover:text-slate-200 disabled:opacity-30 px-1 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Options Scores Columns */}
                  {options.map((opt, optIdx) => {
                    const score = crit.scores?.[opt] ?? 5;
                    const note = crit.notes?.[opt];

                    return (
                      <td key={optIdx} className="p-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-slate-300">
                              Score: {score}/10
                            </span>
                            <span className="text-[10px] font-mono text-teal-400 font-semibold">
                              Weight: {score * crit.importance} pts
                            </span>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={score}
                            onChange={(e) =>
                              handleScoreChange(crit.id, opt, parseInt(e.target.value))
                            }
                            className="w-full accent-teal-400 bg-[#0a0a0b] rounded-lg cursor-pointer h-1.5"
                          />

                          {note && (
                            <p className="text-[11px] text-slate-400 italic leading-snug">
                              "{note}"
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Remove row */}
                  <td className="p-4 align-middle text-center">
                    <button
                      onClick={() => handleRemoveCriterion(crit.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove Criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add custom criterion footer */}
        <div className="bg-[#0a0a0b] p-4 border-t border-white/10">
          <form onSubmit={handleAddCriterion} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Add new criteria (e.g., Financial ROI, Commute Time, Flexibility)..."
              value={newCriterionName}
              onChange={(e) => setNewCriterionName(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-[#121214] border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-400"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Weight:</span>
              <select
                value={newImportance}
                onChange={(e) => setNewImportance(parseInt(e.target.value))}
                className="px-3 py-2 bg-[#121214] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-400"
              >
                <option value={5}>5 (Crucial)</option>
                <option value={4}>4 (High)</option>
                <option value={3}>3 (Moderate)</option>
                <option value={2}>2 (Minor)</option>
                <option value={1}>1 (Low)</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-slate-950 hover:bg-teal-400 font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Factor</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
