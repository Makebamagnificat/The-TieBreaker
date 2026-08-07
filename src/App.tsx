import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DecisionInputForm } from './components/DecisionInputForm';
import { VerdictCard } from './components/VerdictCard';
import { ProsConsView } from './components/ProsConsView';
import { ComparisonTableView } from './components/ComparisonTableView';
import { WeightedCriteriaView } from './components/WeightedCriteriaView';
import { SwotView } from './components/SwotView';
import { QuickCoinFlipModal } from './components/QuickCoinFlipModal';
import { SavedDecisionsList } from './components/SavedDecisionsList';
import { ExportModal } from './components/ExportModal';

// AI Studio Modals
import { OptionVisualizerModal } from './components/OptionVisualizerModal';
import { VeoVideoGeneratorModal } from './components/VeoVideoGeneratorModal';
import { LyriaMusicGeneratorModal } from './components/LyriaMusicGeneratorModal';
import { DecisionCoachChatModal } from './components/DecisionCoachChatModal';
import { LiveVoiceCounselorModal } from './components/LiveVoiceCounselorModal';

import {
  DecisionAnalysisResult,
  DecisionAnalysisType,
  SavedDecision,
} from './types';
import {
  getSavedDecisions,
  saveDecision,
  deleteSavedDecision,
  updateDecisionResolution,
} from './utils/storage';

import {
  Sparkles,
  Scale,
  Table,
  Grid,
  Award,
  SlidersHorizontal,
  Bookmark,
  Share2,
  PlusCircle,
  AlertCircle,
  BrainCircuit,
  Globe,
  MapPin,
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'input' | 'result'>('input');
  const [analysisResult, setAnalysisResult] = useState<DecisionAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<DecisionAnalysisType | 'verdict'>('verdict');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // AI Feature Modals
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [visualizerTarget, setVisualizerTarget] = useState<string>('');

  const [isVeoOpen, setIsVeoOpen] = useState(false);
  const [veoTarget, setVeoTarget] = useState<string>('');

  const [isLyriaOpen, setIsLyriaOpen] = useState(false);
  const [lyriaTarget, setLyriaTarget] = useState<string>('');

  const [isChatCoachOpen, setIsChatCoachOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  // Storage
  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSavedDecisions(getSavedDecisions());
  }, []);

  const handleRunAnalysis = async (formData: {
    title: string;
    context: string;
    options: string[];
    analysisType: DecisionAnalysisType;
    includeDevilsAdvocate: boolean;
    enableThinking?: boolean;
    useFastModel?: boolean;
    enableSearch?: boolean;
    enableMaps?: boolean;
    mediaAttachments?: { data: string; mimeType: string }[];
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate decision analysis.');
      }

      const fullResult: DecisionAnalysisResult = {
        ...data,
        createdAt: new Date().toISOString(),
      };

      setAnalysisResult(fullResult);
      setActiveView('result');
      setActiveTab('verdict');
      setCurrentSavedId(null);
      setIsSaved(false);

      // Auto-save to history
      const savedItem: SavedDecision = {
        id: `decision-${Date.now()}`,
        title: formData.title,
        context: formData.context,
        options: formData.options,
        analysisType: formData.analysisType,
        result: fullResult,
        createdAt: fullResult.createdAt,
        updatedAt: fullResult.createdAt,
        isResolved: false,
      };

      const updatedList = saveDecision(savedItem);
      setSavedDecisions(updatedList);
      setCurrentSavedId(savedItem.id);
      setIsSaved(true);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while analyzing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrent = () => {
    if (!analysisResult) return;

    if (currentSavedId && isSaved) {
      return;
    }

    const savedItem: SavedDecision = {
      id: currentSavedId || `decision-${Date.now()}`,
      title: analysisResult.decisionTitle,
      context: analysisResult.context || '',
      options: analysisResult.options,
      analysisType: 'all',
      result: analysisResult,
      createdAt: analysisResult.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isResolved: false,
    };

    const updatedList = saveDecision(savedItem);
    setSavedDecisions(updatedList);
    setCurrentSavedId(savedItem.id);
    setIsSaved(true);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = deleteSavedDecision(id);
    setSavedDecisions(updated);
    if (id === currentSavedId) {
      setIsSaved(false);
    }
  };

  const handleSelectFromHistory = (saved: SavedDecision) => {
    setAnalysisResult(saved.result);
    setCurrentSavedId(saved.id);
    setIsSaved(true);
    setActiveView('result');
    setActiveTab('verdict');
    setIsHistoryOpen(false);
  };

  const handleToggleResolution = (id: string, isResolved: boolean, chosenOption?: string) => {
    const updated = updateDecisionResolution(id, isResolved, chosenOption);
    setSavedDecisions(updated);
  };

  const handleStartNew = () => {
    setActiveView('input');
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const openVisualizerForOption = (optionName?: string) => {
    setVisualizerTarget(optionName || (analysisResult ? analysisResult.options[0] : ''));
    setIsVisualizerOpen(true);
  };

  const openVeoForOption = (optionName?: string) => {
    setVeoTarget(optionName || (analysisResult ? analysisResult.options[0] : ''));
    setIsVeoOpen(true);
  };

  const openLyriaForWinner = (winnerName?: string) => {
    setLyriaTarget(winnerName || (analysisResult ? analysisResult.verdict.winner : ''));
    setIsLyriaOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Header
        onNewDecision={handleStartNew}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenQuickTiebreaker={() => setIsQuickModalOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenChatCoach={() => setIsChatCoachOpen(true)}
        onOpenVisualizer={() => openVisualizerForOption()}
        onOpenVeo={() => openVeoForOption()}
        onOpenLyria={() => openLyriaForWinner()}
        savedCount={savedDecisions.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-mono font-bold uppercase tracking-wider underline hover:text-rose-100 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: INPUT FORM */}
        {activeView === 'input' && (
          <div className="max-w-4xl mx-auto">
            <DecisionInputForm onSubmit={handleRunAnalysis} isLoading={isLoading} />
          </div>
        )}

        {/* VIEW 2: ANALYSIS RESULT */}
        {activeView === 'result' && analysisResult && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Toolbar & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs text-teal-400 font-mono tracking-widest uppercase mb-1">
                  <span>Decision Scenario</span>
                  <span>•</span>
                  <span>{new Date(analysisResult.createdAt).toLocaleDateString()}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
                  {analysisResult.decisionTitle}
                </h1>
                {analysisResult.context && (
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl italic">
                    "{analysisResult.context}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveCurrent}
                  className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors border ${
                    isSaved
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      : 'bg-[#121214] text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{isSaved ? 'Saved in History' : 'Save Analysis'}</span>
                </button>

                <button
                  onClick={() => setIsExportOpen(true)}
                  className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-slate-300 bg-[#121214] hover:bg-white/5 border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Export</span>
                </button>

                <button
                  onClick={handleStartNew}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-white hover:bg-teal-400 rounded-full shadow-lg flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Decision</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs for Views */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
              {[
                { id: 'verdict', label: 'The Tiebreaker Verdict', icon: Award },
                { id: 'weighted_criteria', label: 'Weighted Criteria', icon: SlidersHorizontal },
                { id: 'pros_cons', label: 'Pros & Cons', icon: Scale },
                { id: 'comparison_table', label: 'Comparison Matrix', icon: Table },
                { id: 'swot', label: 'SWOT Analysis', icon: Grid },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab View Render */}
            <div>
              {activeTab === 'verdict' && (
                <div className="space-y-8">
                  <VerdictCard
                    verdict={analysisResult.verdict}
                    decisionTitle={analysisResult.decisionTitle}
                    onOpenVisualizer={openVisualizerForOption}
                    onOpenVeo={openVeoForOption}
                    onOpenLyria={openLyriaForWinner}
                    onOpenChatCoach={() => setIsChatCoachOpen(true)}
                    onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
                  />

                  {/* Summary Preview of Pros/Cons & Matrix below Verdict */}
                  {analysisResult.prosCons && analysisResult.prosCons.length > 0 && (
                    <div className="pt-6">
                      <ProsConsView initialData={analysisResult.prosCons} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'weighted_criteria' && (
                <WeightedCriteriaView
                  initialCriteria={analysisResult.comparisonCriteria || []}
                  options={analysisResult.options || []}
                />
              )}

              {activeTab === 'pros_cons' && (
                <ProsConsView initialData={analysisResult.prosCons || []} />
              )}

              {activeTab === 'comparison_table' && (
                <ComparisonTableView
                  initialCriteria={analysisResult.comparisonCriteria || []}
                  options={analysisResult.options || []}
                />
              )}

              {activeTab === 'swot' && (
                <SwotView swotAnalyses={analysisResult.swotAnalyses || []} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0b] py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>THE TIEBREAKER — AI-POWERED DECISION ANALYSIS & SUITE</p>
          <p className="text-[11px] text-slate-600">
            POWERED BY GEMINI 3.1 PRO, IMAGEN 3, VEO 3, LYRIA 3 & LIVE API
          </p>
        </div>
      </footer>

      {/* Quick Tiebreaker Modal */}
      <QuickCoinFlipModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
      />

      {/* Saved History Drawer */}
      <SavedDecisionsList
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedDecisions={savedDecisions}
        onSelectDecision={handleSelectFromHistory}
        onDeleteDecision={handleDeleteSaved}
        onUpdateResolution={handleToggleResolution}
      />

      {/* Export Modal */}
      {analysisResult && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          result={analysisResult}
        />
      )}

      {/* Imagen 3 Option Visualizer Modal */}
      <OptionVisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
        optionName={visualizerTarget}
        decisionTitle={analysisResult?.decisionTitle}
      />

      {/* Veo 3 Outcome Video Generator Modal */}
      <VeoVideoGeneratorModal
        isOpen={isVeoOpen}
        onClose={() => setIsVeoOpen(false)}
        optionName={veoTarget}
      />

      {/* Lyria 3 Music Generator Modal */}
      <LyriaMusicGeneratorModal
        isOpen={isLyriaOpen}
        onClose={() => setIsLyriaOpen(false)}
        decisionTitle={analysisResult?.decisionTitle}
        winnerName={lyriaTarget}
      />

      {/* AI Decision Coach Chat Modal */}
      <DecisionCoachChatModal
        isOpen={isChatCoachOpen}
        onClose={() => setIsChatCoachOpen(false)}
        decisionTitle={analysisResult?.decisionTitle}
        context={analysisResult?.context}
      />

      {/* Gemini Live Voice Counselor Modal */}
      <LiveVoiceCounselorModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        decisionTitle={analysisResult?.decisionTitle}
      />
    </div>
  );
}
