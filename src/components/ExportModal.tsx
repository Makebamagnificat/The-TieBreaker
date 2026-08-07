import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DecisionAnalysisResult } from '../types';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Printer,
  Award,
  Scale,
  Table,
  Grid,
  SlidersHorizontal,
  Sparkles,
  Zap,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DecisionAnalysisResult;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [activeExportTab, setActiveExportTab] = useState<'pdf' | 'markdown'>('pdf');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  // Calculate Weighted Criteria leaderboard scores
  const totalWeight = (result.comparisonCriteria || []).reduce(
    (sum, c) => sum + (c.importance || 1),
    0
  );

  const weightedRankings = (result.options || []).map((opt) => {
    let weightedSum = 0;
    (result.comparisonCriteria || []).forEach((crit) => {
      const score = crit.scores?.[opt] ?? 5;
      const normWeight = totalWeight > 0 ? crit.importance / totalWeight : 0;
      weightedSum += score * normWeight;
    });
    const finalScore = Math.round(weightedSum * 10); // scale 0 - 100
    return { optionName: opt, finalScore };
  }).sort((a, b) => b.finalScore - a.finalScore);

  const generateMarkdown = () => {
    let md = `# Decision Analysis Report: ${result.decisionTitle}\n`;
    if (result.context) {
      md += `**Context:** ${result.context}\n\n`;
    }
    md += `**Generated Date:** ${new Date(result.createdAt || Date.now()).toLocaleDateString()}\n\n`;

    md += `## 🏆 The Tiebreaker Verdict: ${result.verdict.winner}\n`;
    md += `**Confidence Score:** ${result.verdict.confidenceScore}%\n\n`;
    md += `${result.verdict.verdictSummary}\n\n`;

    md += `### Core Decisive Factors:\n`;
    result.verdict.keyFactors.forEach((f) => {
      md += `- ${f}\n`;
    });
    md += `\n`;

    md += `**When to Choose "${result.verdict.winner}":** ${result.verdict.whenToChooseWinner}\n\n`;
    md += `**When to Pivot to Alternative:** ${result.verdict.whenToChooseAlternative}\n\n`;
    if (result.verdict.devilsAdvocatePoint) {
      md += `**Devil's Advocate Blindspot:** ${result.verdict.devilsAdvocatePoint}\n\n`;
    }

    if (weightedRankings.length > 0) {
      md += `## 🎛️ Weighted Criteria Rankings\n\n`;
      weightedRankings.forEach((r, idx) => {
        md += `1. **${r.optionName}** — ${r.finalScore}/100 weighted pts ${idx === 0 ? '🏆 (Top Choice)' : ''}\n`;
      });
      md += `\n`;
    }

    if (result.prosCons && result.prosCons.length > 0) {
      md += `## ⚖️ Pros & Cons Breakdown\n\n`;
      result.prosCons.forEach((opt) => {
        md += `### ${opt.optionName}\n`;
        md += `*Summary:* ${opt.summary}\n\n`;
        md += `**Pros:**\n`;
        opt.pros.forEach((p) => {
          md += `- [Weight: ${p.weight}/5] ${p.text}\n`;
        });
        md += `\n**Cons:**\n`;
        opt.cons.forEach((c) => {
          md += `- [Weight: ${c.weight}/5] ${c.text}\n`;
        });
        md += `\n`;
      });
    }

    if (result.comparisonCriteria && result.comparisonCriteria.length > 0) {
      md += `## 📊 Multi-Factor Comparison Matrix\n\n`;
      result.comparisonCriteria.forEach((crit) => {
        md += `### Factor: ${crit.name} (Importance Weight: ${crit.importance}/5)\n`;
        result.options.forEach((opt) => {
          const score = crit.scores?.[opt] ?? 'N/A';
          md += `- **${opt}:** ${score}/10\n`;
        });
        md += `\n`;
      });
    }

    if (result.swot && result.swot.length > 0) {
      md += `## 🧩 Strategic SWOT Analyses\n\n`;
      result.swot.forEach((s) => {
        md += `### Option: ${s.optionName}\n`;
        md += `**Strengths:** ${s.swot.strengths.join('; ')}\n`;
        md += `**Weaknesses:** ${s.swot.weaknesses.join('; ')}\n`;
        md += `**Opportunities:** ${s.swot.opportunities.join('; ')}\n`;
        md += `**Threats:** ${s.swot.threats.join('; ')}\n\n`;
      });
    }

    return md;
  };

  const markdownContent = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tiebreaker-Analysis-${result.decisionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Full styled HTML element for printing & PDF generation
  const printableReportHtml = (
    <div
      id="printable-decision-report-root"
      className="hidden print:block p-8 bg-white text-slate-900 font-sans leading-normal max-w-4xl mx-auto"
    >
      {/* Printable Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-slate-500 font-bold mb-1">
            THE TIEBREAKER — EXECUTIVE DECISION REPORT
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {result.decisionTitle}
          </h1>
          {result.context && (
            <p className="text-xs text-slate-600 mt-1 italic">{result.context}</p>
          )}
        </div>
        <div className="text-right font-mono text-xs text-slate-500">
          <div>Date: {new Date(result.createdAt || Date.now()).toLocaleDateString()}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider font-bold text-teal-700">
            {result.options?.length} Options Evaluated
          </div>
        </div>
      </div>

      {/* SECTION 1: THE VERDICT */}
      <div className="mb-8 print-page-break-inside-avoid">
        <div className="p-5 bg-slate-50 border-2 border-slate-900 rounded-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-widest">
              AI TIEBREAKER RECOMMENDATION
            </span>
            <span className="px-3 py-1 bg-teal-800 text-white font-mono text-xs font-bold rounded-full">
              Confidence: {result.verdict.confidenceScore}%
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Winning Choice: {result.verdict.winner}
          </h2>

          <p className="text-xs text-slate-800 leading-relaxed font-medium mb-4">
            {result.verdict.verdictSummary}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-300 text-xs font-mono">
            <div>
              <strong className="text-teal-900 block mb-1">WHEN TO CHOOSE WINNER:</strong>
              <p className="text-slate-700 font-sans">{result.verdict.whenToChooseWinner}</p>
            </div>
            <div>
              <strong className="text-rose-900 block mb-1">WHEN TO PIVOT / ALTERNATIVE:</strong>
              <p className="text-slate-700 font-sans">{result.verdict.whenToChooseAlternative}</p>
            </div>
          </div>
        </div>

        {/* Core Factors & Devil's Advocate */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-slate-300 rounded-lg bg-white">
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider mb-2">
              Key Decisive Drivers
            </h3>
            <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
              {result.verdict.keyFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          {result.verdict.devilsAdvocatePoint && (
            <div className="p-4 border border-amber-300 bg-amber-50/50 rounded-lg">
              <h3 className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider mb-1">
                Devil's Advocate Blindspot
              </h3>
              <p className="text-xs text-slate-800 leading-snug">
                {result.verdict.devilsAdvocatePoint}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: WEIGHTED CRITERIA RANKING */}
      {weightedRankings.length > 0 && (
        <div className="mb-8 print-page-break-inside-avoid">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-3">
            1. Weighted Criteria Leaderboard
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] uppercase">
                <th className="p-2.5">Rank</th>
                <th className="p-2.5">Option</th>
                <th className="p-2.5 text-right">Weighted Rating Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {weightedRankings.map((r, idx) => (
                <tr key={idx} className={idx === 0 ? 'font-bold bg-teal-50/50' : ''}>
                  <td className="p-2.5 font-mono">#{idx + 1}</td>
                  <td className="p-2.5">
                    {r.optionName} {idx === 0 ? '🏆' : ''}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-teal-800">
                    {r.finalScore} / 100 pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SECTION 3: PROS & CONS */}
      {result.prosCons && result.prosCons.length > 0 && (
        <div className="mb-8 print-page-break-inside-avoid">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-3">
            2. Pros & Cons Trade-off Matrix
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {result.prosCons.map((opt, idx) => (
              <div key={idx} className="p-4 border border-slate-300 rounded-lg bg-slate-50">
                <h3 className="font-bold text-sm text-slate-900 mb-1">{opt.optionName}</h3>
                <p className="text-xs text-slate-600 mb-3 italic">{opt.summary}</p>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-mono font-bold text-teal-800 uppercase text-[10px] mb-1.5">
                      + Advantages ({opt.pros.length})
                    </h4>
                    <ul className="space-y-1">
                      {opt.pros.map((p) => (
                        <li key={p.id} className="text-slate-800">
                          • {p.text}{' '}
                          <span className="text-[10px] font-mono text-slate-500">
                            (w: {p.weight}/5)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-mono font-bold text-rose-800 uppercase text-[10px] mb-1.5">
                      − Drawbacks ({opt.cons.length})
                    </h4>
                    <ul className="space-y-1">
                      {opt.cons.map((c) => (
                        <li key={c.id} className="text-slate-800">
                          • {c.text}{' '}
                          <span className="text-[10px] font-mono text-slate-500">
                            (w: {c.weight}/5)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: MULTI-FACTOR COMPARISON MATRIX */}
      {result.comparisonCriteria && result.comparisonCriteria.length > 0 && (
        <div className="mb-8 print-page-break-inside-avoid">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-3">
            3. Multi-Factor Comparison Table
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase">
                <th className="p-2">Criterion</th>
                <th className="p-2 text-center">Weight</th>
                {result.options.map((opt, i) => (
                  <th key={i} className="p-2">
                    {opt}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {result.comparisonCriteria.map((crit) => (
                <tr key={crit.id}>
                  <td className="p-2 font-bold text-slate-900">{crit.name}</td>
                  <td className="p-2 text-center font-mono text-slate-600">{crit.importance}x</td>
                  {result.options.map((opt) => (
                    <td key={opt} className="p-2 font-mono font-bold text-slate-800">
                      {crit.scores?.[opt] ?? 'N/A'}/10
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SECTION 5: SWOT STRATEGIC MATRIX */}
      {result.swot && result.swot.length > 0 && (
        <div className="mb-6 print-page-break-inside-avoid">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-3">
            4. SWOT Strategic Matrix
          </h2>
          {result.swot.map((item, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="font-bold text-xs text-slate-900 mb-2">Option: {item.optionName}</h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 border border-slate-300 bg-slate-50 rounded">
                  <strong className="text-teal-800 block mb-1">STRENGTHS</strong>
                  <ul className="list-disc pl-3 text-slate-700 space-y-0.5">
                    {item.swot.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 border border-slate-300 bg-slate-50 rounded">
                  <strong className="text-rose-800 block mb-1">WEAKNESSES</strong>
                  <ul className="list-disc pl-3 text-slate-700 space-y-0.5">
                    {item.swot.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 border border-slate-300 bg-slate-50 rounded">
                  <strong className="text-teal-800 block mb-1">OPPORTUNITIES</strong>
                  <ul className="list-disc pl-3 text-slate-700 space-y-0.5">
                    {item.swot.opportunities.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 border border-slate-300 bg-slate-50 rounded">
                  <strong className="text-amber-800 block mb-1">THREATS</strong>
                  <ul className="list-disc pl-3 text-slate-700 space-y-0.5">
                    {item.swot.threats.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Footer */}
      <div className="mt-8 pt-4 border-t border-slate-300 text-center font-mono text-[10px] text-slate-500 flex justify-between">
        <span>The Tiebreaker Decision Intelligence Report</span>
        <span>Generated via AI Studio</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Portal printable element directly onto document.body for print rendering */}
      {createPortal(printableReportHtml, document.body)}

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[#121214] border border-white/10 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <h2 className="font-bold text-lg text-white font-display uppercase tracking-tight">
                Export Decision Report & Analysis
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 my-4 bg-[#0a0a0b] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveExportTab('pdf')}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeExportTab === 'pdf'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>PDF Report Preview</span>
            </button>
            <button
              onClick={() => setActiveExportTab('markdown')}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeExportTab === 'markdown'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Markdown Source</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-4">
            {activeExportTab === 'pdf' ? (
              <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 space-y-6 text-xs font-sans shadow-inner">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                      PDF DOCUMENT PREVIEW
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {result.decisionTitle}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-800 text-white font-mono text-[10px] font-bold rounded-full">
                    Winner: {result.verdict.winner} ({result.verdict.confidenceScore}%)
                  </span>
                </div>

                {/* Verdict summary callout */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                  <div className="font-mono font-bold text-teal-800 uppercase text-[10px]">
                    Executive Summary & Verdict
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {result.verdict.verdictSummary}
                  </p>
                </div>

                {/* Section checklist of included modules */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>The Verdict</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Weighted Criteria</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Pros & Cons</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>SWOT Matrix</span>
                  </div>
                </div>

                <div className="text-center font-mono text-slate-500 text-[11px] py-2 border-t border-slate-200">
                  Click <strong>"Download / Print PDF"</strong> below to save as PDF or print.
                </div>
              </div>
            ) : (
              <textarea
                readOnly
                value={markdownContent}
                rows={13}
                className="w-full p-4 bg-[#0a0a0b] border border-white/10 rounded-xl font-mono text-xs text-slate-300 focus:outline-none resize-none leading-relaxed"
              />
            )}
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handlePrintPdf}
              className="w-full sm:flex-1 py-3 bg-white text-slate-950 hover:bg-teal-400 font-bold font-mono text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Print PDF Report</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-4 py-3 bg-[#0a0a0b] hover:bg-white/5 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="w-full sm:w-auto px-4 py-3 bg-[#0a0a0b] hover:bg-white/5 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>.md File</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
