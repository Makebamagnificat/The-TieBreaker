import React, { useState } from 'react';
import { OptionProsCons, ProConItem } from '../types';
import { ThumbsUp, ThumbsDown, Plus, Trash2, Scale, Info } from 'lucide-react';

interface ProsConsViewProps {
  initialData: OptionProsCons[];
  onDataChange?: (updated: OptionProsCons[]) => void;
}

export const ProsConsView: React.FC<ProsConsViewProps> = ({
  initialData,
  onDataChange,
}) => {
  const [data, setData] = useState<OptionProsCons[]>(initialData);
  const [newText, setNewText] = useState<Record<string, { pro: string; con: string }>>({});
  const [newWeight, setNewWeight] = useState<Record<string, { pro: number; con: number }>>({});

  const handleWeightChange = (
    optionIdx: number,
    type: 'pro' | 'con',
    itemId: string,
    delta: number
  ) => {
    const updated = [...data];
    const targetList = type === 'pro' ? updated[optionIdx].pros : updated[optionIdx].cons;
    const item = targetList.find((i) => i.id === itemId);
    if (item) {
      item.weight = Math.max(1, Math.min(5, item.weight + delta));
      setData(updated);
      onDataChange?.(updated);
    }
  };

  const handleRemoveItem = (
    optionIdx: number,
    type: 'pro' | 'con',
    itemId: string
  ) => {
    const updated = [...data];
    if (type === 'pro') {
      updated[optionIdx].pros = updated[optionIdx].pros.filter((i) => i.id !== itemId);
    } else {
      updated[optionIdx].cons = updated[optionIdx].cons.filter((i) => i.id !== itemId);
    }
    setData(updated);
    onDataChange?.(updated);
  };

  const handleAddItem = (optionIdx: number, type: 'pro' | 'con') => {
    const optName = data[optionIdx].optionName;
    const text = newText[optName]?.[type]?.trim();
    const weight = newWeight[optName]?.[type] || 3;

    if (!text) return;

    const newItem: ProConItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text,
      weight,
      category: 'User Added',
    };

    const updated = [...data];
    if (type === 'pro') {
      updated[optionIdx].pros.push(newItem);
    } else {
      updated[optionIdx].cons.push(newItem);
    }

    setData(updated);
    onDataChange?.(updated);

    // Reset input
    setNewText((prev) => ({
      ...prev,
      [optName]: { ...prev[optName], [type]: '' },
    }));
  };

  const calculateScores = (option: OptionProsCons) => {
    const proScore = option.pros.reduce((acc, curr) => acc + curr.weight, 0);
    const conScore = option.cons.reduce((acc, curr) => acc + curr.weight, 0);
    const net = proScore - conScore;
    return { proScore, conScore, net };
  };

  const getWeightBadgeColor = (weight: number, isPro: boolean) => {
    if (isPro) {
      if (weight >= 4) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      if (weight === 3) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      return 'bg-slate-800 text-slate-300 border-slate-700';
    } else {
      if (weight >= 4) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      if (weight === 3) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getWeightLabel = (weight: number) => {
    switch (weight) {
      case 5: return 'Crucial (5)';
      case 4: return 'High (4)';
      case 3: return 'Moderate (3)';
      case 2: return 'Minor (2)';
      default: return 'Low (1)';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tighter font-display">
            <Scale className="w-5 h-5 text-teal-400" />
            <span>Pros & Cons Comparison</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust impact weights (1 to 5) or add custom items to fine-tune your evaluation balance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((opt, optIdx) => {
          const { proScore, conScore, net } = calculateScores(opt);
          const optName = opt.optionName;

          return (
            <div
              key={optIdx}
              className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              {/* Option Header */}
              <div className="bg-[#0a0a0b] p-5 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-teal-500/10 text-teal-400 font-mono text-xs font-bold flex items-center justify-center border border-teal-500/20">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <h3 className="font-bold text-lg text-white tracking-tight">
                      {opt.optionName}
                    </h3>
                  </div>

                  {/* Net Score Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121214] border border-white/10">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Net Impact:</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        net > 0
                          ? 'text-teal-400'
                          : net < 0
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {net > 0 ? `+${net}` : net}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {opt.summary}
                </p>

                {/* Score Bar */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-teal-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Pros Weight: {proScore}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Cons Weight: {conScore}</span>
                  </div>
                </div>
              </div>

              {/* Pros & Cons Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 p-5 gap-6 md:gap-0">
                {/* PROS COLUMN */}
                <div className="md:pr-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                      <span>Advantages ({opt.pros.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {opt.pros.map((pro) => (
                      <div
                        key={pro.id}
                        className="p-3 rounded-xl bg-[#0a0a0b] border border-white/5 hover:border-teal-500/30 transition-colors group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-teal-400 font-mono text-xs font-bold">+</span>
                            <p className="text-xs text-slate-300 leading-snug flex-1">
                              {pro.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(optIdx, 'pro', pro.id)}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Pro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Weight adjuster */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-md border font-mono text-[10px] ${getWeightBadgeColor(
                              pro.weight,
                              true
                            )}`}
                          >
                            {getWeightLabel(pro.weight)}
                          </span>

                          <div className="flex items-center gap-1 bg-[#121214] px-1.5 py-0.5 rounded-md border border-white/10 font-mono text-xs">
                            <button
                              onClick={() => handleWeightChange(optIdx, 'pro', pro.id, -1)}
                              disabled={pro.weight <= 1}
                              className="px-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-300 w-3 text-center">
                              {pro.weight}
                            </span>
                            <button
                              onClick={() => handleWeightChange(optIdx, 'pro', pro.id, 1)}
                              disabled={pro.weight >= 5}
                              className="px-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Pro input */}
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Add advantage..."
                        value={newText[optName]?.pro || ''}
                        onChange={(e) =>
                          setNewText((prev) => ({
                            ...prev,
                            [optName]: { ...prev[optName], pro: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddItem(optIdx, 'pro');
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#0a0a0b] border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem(optIdx, 'pro')}
                        className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/20"
                        title="Add Pro"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONS COLUMN */}
                <div className="md:pl-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
                      <span>Drawbacks ({opt.cons.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {opt.cons.map((con) => (
                      <div
                        key={con.id}
                        className="p-3 rounded-xl bg-[#0a0a0b] border border-white/5 hover:border-rose-500/30 transition-colors group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-rose-400 font-mono text-xs font-bold">−</span>
                            <p className="text-xs text-slate-300 leading-snug flex-1">
                              {con.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(optIdx, 'con', con.id)}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Con"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Weight adjuster */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-md border font-mono text-[10px] ${getWeightBadgeColor(
                              con.weight,
                              false
                            )}`}
                          >
                            {getWeightLabel(con.weight)}
                          </span>

                          <div className="flex items-center gap-1 bg-[#121214] px-1.5 py-0.5 rounded-md border border-white/10 font-mono text-xs">
                            <button
                              onClick={() => handleWeightChange(optIdx, 'con', con.id, -1)}
                              disabled={con.weight <= 1}
                              className="px-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-300 w-3 text-center">
                              {con.weight}
                            </span>
                            <button
                              onClick={() => handleWeightChange(optIdx, 'con', con.id, 1)}
                              disabled={con.weight >= 5}
                              className="px-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Con input */}
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Add drawback..."
                        value={newText[optName]?.con || ''}
                        onChange={(e) =>
                          setNewText((prev) => ({
                            ...prev,
                            [optName]: { ...prev[optName], con: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddItem(optIdx, 'con');
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#0a0a0b] border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem(optIdx, 'con')}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20"
                        title="Add Con"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
