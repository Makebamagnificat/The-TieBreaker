import React, { useState } from 'react';
import { ComparisonCriterion } from '../types';
import { SlidersHorizontal, Plus, Trash2, Award, Trophy, Info, Sparkles, TrendingUp, BarChart2 } from 'lucide-react';

interface WeightedCriteriaViewProps {
  initialCriteria: ComparisonCriterion[];
  options: string[];
}

export const WeightedCriteriaView: React.FC<WeightedCriteriaViewProps> = ({
  initialCriteria,
  options,
}) => {
  // If no initial criteria, provide default realistic decision criteria
  const defaultCriteria: ComparisonCriterion[] = initialCriteria.length > 0 ? initialCriteria : [
    {
      id: 'crit-1',
      name: 'Financial Cost & ROI',
      importance: 5,
      scores: options.reduce((acc, opt, i) => ({ ...acc, [opt]: 8 - i }), {}),
      notes: {},
    },
    {
      id: 'crit-2',
      name: 'Ease of Implementation',
      importance: 4,
      scores: options.reduce((acc, opt, i) => ({ ...acc, [opt]: 6 + (i % 3) }), {}),
      notes: {},
    },
    {
      id: 'crit-3',
      name: 'Long-term Strategic Value',
      importance: 5,
      scores: options.reduce((acc, opt, i) => ({ ...acc, [opt]: 7 + (i % 2) }), {}),
      notes: {},
    },
    {
      id: 'crit-4',
      name: 'Risk & Reversibility',
      importance: 3,
      scores: options.reduce((acc, opt, i) => ({ ...acc, [opt]: 5 + i }), {}),
      notes: {},
    },
  ];

  const [criteria, setCriteria] = useState<ComparisonCriterion[]>(defaultCriteria);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newImportance, setNewImportance] = useState(3);

  // Total weight across all criteria
  const totalWeight = criteria.reduce((sum, c) => sum + c.importance, 0);

  // Calculate weighted score & ranking for each option
  const optionRankings = options.map((opt) => {
    let weightedScoreSum = 0;
    const criterionContributions: { criterionName: string; weightPercent: number; score: number; weightedPoints: number }[] = [];

    criteria.forEach((crit) => {
      const score = crit.scores?.[opt] ?? 5; // 1 to 10 rating scale
      const normWeight = totalWeight > 0 ? crit.importance / totalWeight : 0;
      const weightedPoints = score * normWeight; // Scale 0-10
      weightedScoreSum += weightedPoints;

      criterionContributions.push({
        criterionName: crit.name,
        weightPercent: Math.round(normWeight * 100),
        score,
        weightedPoints,
      });
    });

    // Score on 0 - 100 scale
    const finalScore = Math.round(weightedScoreSum * 10);

    return {
      optionName: opt,
      finalScore,
      weightedScoreSum,
      contributions: criterionContributions.sort((a, b) => b.weightedPoints - a.weightedPoints),
    };
  });

  // Sort rankings descending
  const sortedRankings = [...optionRankings].sort((a, b) => b.finalScore - a.finalScore);

  const handleImportanceChange = (id: string, weight: number) => {
    const validWeight = Math.max(1, Math.min(10, weight));
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, importance: validWeight } : c))
    );
  };

  const handleScoreChange = (critId: string, optionName: string, score: number) => {
    const validScore = Math.max(1, Math.min(10, score));
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id === critId) {
          return {
            ...c,
            scores: {
              ...(c.scores || {}),
              [optionName]: validScore,
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
      defaultScores[opt] = 6;
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
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tighter font-display">
            <SlidersHorizontal className="w-5 h-5 text-teal-400" />
            <span>Weighted Criteria Ranking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Assign importance weights (1-10) to decision factors to compute normalized option rankings.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#121214] px-3 py-1.5 rounded-xl border border-white/10">
          <span>Active Criteria:</span>
          <span className="text-teal-400 font-bold">{criteria.length}</span>
          <span className="text-slate-600">|</span>
          <span>Total Weight:</span>
          <span className="text-teal-400 font-bold">{totalWeight} pts</span>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Calculated Ranking Leaderboard</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Based on normalized weighted scores
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRankings.map((item, rankIdx) => {
            const isWinner = rankIdx === 0;
            const rankBadgeColor =
              rankIdx === 0
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : rankIdx === 1
                ? 'bg-slate-800 text-slate-300 border-white/10'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

            return (
              <div
                key={item.optionName}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isWinner
                    ? 'bg-[#121214] border-teal-500/40 shadow-xl shadow-teal-500/5 ring-1 ring-teal-500/20'
                    : 'bg-[#121214] border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider flex items-center gap-1 ${rankBadgeColor}`}
                    >
                      {isWinner ? <Award className="w-3 h-3 text-teal-400" /> : null}
                      Rank #{rankIdx + 1}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
                        Top Recommendation
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-white tracking-tight mb-2">
                    {item.optionName}
                  </h4>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-mono font-extrabold text-teal-400">
                      {item.finalScore}
                    </span>
                    <span className="text-xs font-mono text-slate-500">/ 100 weighted pts</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-[#0a0a0b] rounded-full overflow-hidden border border-white/10 mb-4">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isWinner ? 'bg-teal-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${item.finalScore}%` }}
                    />
                  </div>

                  {/* Top Contributing Criteria */}
                  <div className="space-y-1.5 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                      Key Factors Driving Score:
                    </span>
                    {item.contributions.slice(0, 2).map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs font-mono text-slate-300"
                      >
                        <span className="truncate max-w-[160px] text-slate-400">{c.criterionName}</span>
                        <span className="text-teal-300 font-semibold">{c.score}/10 ({c.weightPercent}% weight)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Criteria Weight Configurator Section */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-400" />
              <span>Criteria Importance Adjuster</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag or adjust importance weights (1 = Minor factor, 10 = Critical dealbreaker)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteria.map((crit) => {
            const normWeightPercent =
              totalWeight > 0 ? Math.round((crit.importance / totalWeight) * 100) : 0;

            return (
              <div
                key={crit.id}
                className="p-4 rounded-xl bg-[#0a0a0b] border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {crit.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      {normWeightPercent}% Share
                    </span>
                    {criteria.length > 1 && (
                      <button
                        onClick={() => handleRemoveCriterion(crit.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete Criterion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Weight slider & controls */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Importance Weight:</span>
                    <span className="text-teal-400 font-bold">{crit.importance} / 10</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={crit.importance}
                      onChange={(e) =>
                        handleImportanceChange(crit.id, parseInt(e.target.value))
                      }
                      className="flex-1 accent-teal-400 bg-[#121214] h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center gap-1 bg-[#121214] border border-white/10 rounded-lg px-2 py-0.5">
                      <button
                        onClick={() => handleImportanceChange(crit.id, crit.importance - 1)}
                        disabled={crit.importance <= 1}
                        className="text-slate-400 hover:text-white text-xs disabled:opacity-30 font-mono"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono text-white font-bold px-1">
                        {crit.importance}
                      </span>
                      <button
                        onClick={() => handleImportanceChange(crit.id, crit.importance + 1)}
                        disabled={crit.importance >= 10}
                        className="text-slate-400 hover:text-white text-xs disabled:opacity-30 font-mono"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Criterion Form */}
        <form
          onSubmit={handleAddCriterion}
          className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3"
        >
          <input
            type="text"
            placeholder="Add new decision criterion (e.g. Scalability, Security, Time-to-market)..."
            value={newCriterionName}
            onChange={(e) => setNewCriterionName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-mono text-slate-500 uppercase">Weight:</span>
            <select
              value={newImportance}
              onChange={(e) => setNewImportance(parseInt(e.target.value))}
              className="px-3 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 font-mono"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => (
                <option key={w} value={w}>
                  {w} {w >= 8 ? '(Critical)' : w >= 5 ? '(Medium)' : '(Low)'}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 bg-white text-slate-950 hover:bg-teal-400 font-bold text-xs font-mono uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Criterion</span>
            </button>
          </div>
        </form>
      </div>

      {/* Option Performance Rating Matrix */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Option Performance Ratings (1 - 10)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Rate how well each option satisfies each decision criterion (1 = Poor, 10 = Outstanding).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0b] border-b border-white/10 text-slate-400 text-xs font-mono uppercase tracking-widest">
                <th className="p-4 w-64 min-w-[200px]">Criterion</th>
                <th className="p-4 w-28 text-center">Weight</th>
                {options.map((opt, idx) => (
                  <th key={idx} className="p-4 min-w-[160px] text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-mono font-bold flex items-center justify-center border border-teal-500/30">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {criteria.map((crit) => {
                const normWeightPercent =
                  totalWeight > 0 ? Math.round((crit.importance / totalWeight) * 100) : 0;

                return (
                  <tr key={crit.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 align-middle">
                      <span className="font-bold text-white text-sm block">{crit.name}</span>
                    </td>
                    <td className="p-4 align-middle text-center font-mono">
                      <span className="px-2.5 py-1 bg-[#0a0a0b] text-teal-400 rounded-md border border-white/10 text-xs font-bold">
                        {crit.importance}/10 ({normWeightPercent}%)
                      </span>
                    </td>
                    {options.map((opt) => {
                      const currentScore = crit.scores?.[opt] ?? 5;

                      return (
                        <td key={opt} className="p-4 align-middle">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-slate-400">Score:</span>
                              <span className="text-teal-400 font-bold">{currentScore} / 10</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={currentScore}
                              onChange={(e) =>
                                handleScoreChange(crit.id, opt, parseInt(e.target.value))
                              }
                              className="w-full accent-teal-400 bg-[#0a0a0b] rounded-lg cursor-pointer h-1.5"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
