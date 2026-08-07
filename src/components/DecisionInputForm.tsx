import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Briefcase,
  Home,
  Compass,
  Car,
  Code2,
  GraduationCap,
  Layers,
  Scale,
  Table,
  Grid,
  SlidersHorizontal,
  Undo2,
  Redo2,
  BrainCircuit,
  Zap,
  Globe,
  MapPin,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  Loader2,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { DecisionAnalysisType, DecisionPreset } from '../types';
import { DECISION_PRESETS } from '../data/presets';

interface DecisionInputFormProps {
  onSubmit: (data: {
    title: string;
    context: string;
    options: string[];
    analysisType: DecisionAnalysisType;
    includeDevilsAdvocate: boolean;
    enableThinking?: boolean;
    useFastModel?: boolean;
    enableSearch?: boolean;
    enableMaps?: boolean;
    mediaAttachments?: { data: string; mimeType: string; name?: string }[];
  }) => void;
  isLoading: boolean;
}

interface FormSnapshot {
  title: string;
  context: string;
  options: string[];
  analysisType: DecisionAnalysisType;
  includeDevilsAdvocate: boolean;
  enableThinking: boolean;
  useFastModel: boolean;
  enableSearch: boolean;
  enableMaps: boolean;
}

const initialFormSnapshot: FormSnapshot = {
  title: '',
  context: '',
  options: ['Option A', 'Option B'],
  analysisType: 'all',
  includeDevilsAdvocate: true,
  enableThinking: false,
  useFastModel: false,
  enableSearch: false,
  enableMaps: false,
};

export const DecisionInputForm: React.FC<DecisionInputFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B']);
  const [analysisType, setAnalysisType] = useState<DecisionAnalysisType>('all');
  const [includeDevilsAdvocate, setIncludeDevilsAdvocate] = useState(true);

  // AI Feature Toggles
  const [enableThinking, setEnableThinking] = useState(false);
  const [useFastModel, setUseFastModel] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [enableMaps, setEnableMaps] = useState(false);

  // Voice Dictation
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Media Attachments
  const [attachments, setAttachments] = useState<{ data: string; mimeType: string; name: string }[]>([]);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<FormSnapshot[]>([initialFormSnapshot]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushHistory = useCallback(
    (newSnapshot: FormSnapshot) => {
      setHistory((prevHistory) => {
        const current = prevHistory[historyIndex];
        if (
          current &&
          current.title === newSnapshot.title &&
          current.context === newSnapshot.context &&
          JSON.stringify(current.options) === JSON.stringify(newSnapshot.options) &&
          current.analysisType === newSnapshot.analysisType &&
          current.includeDevilsAdvocate === newSnapshot.includeDevilsAdvocate &&
          current.enableThinking === newSnapshot.enableThinking &&
          current.useFastModel === newSnapshot.useFastModel &&
          current.enableSearch === newSnapshot.enableSearch &&
          current.enableMaps === newSnapshot.enableMaps
        ) {
          return prevHistory;
        }

        const sliced = prevHistory.slice(0, historyIndex + 1);
        const updated = [...sliced, newSnapshot];
        if (updated.length > 50) updated.shift();
        return updated;
      });

      setHistoryIndex((prevIdx) => Math.min(historyIndex + 1, 49));
    },
    [historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newIdx = historyIndex - 1;
    const target = history[newIdx];
    if (target) {
      setTitle(target.title);
      setContext(target.context);
      setOptions(target.options);
      setAnalysisType(target.analysisType);
      setIncludeDevilsAdvocate(target.includeDevilsAdvocate);
      setEnableThinking(target.enableThinking);
      setUseFastModel(target.useFastModel);
      setEnableSearch(target.enableSearch);
      setEnableMaps(target.enableMaps);
      setHistoryIndex(newIdx);
    }
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const newIdx = historyIndex + 1;
    const target = history[newIdx];
    if (target) {
      setTitle(target.title);
      setContext(target.context);
      setOptions(target.options);
      setAnalysisType(target.analysisType);
      setIncludeDevilsAdvocate(target.includeDevilsAdvocate);
      setEnableThinking(target.enableThinking);
      setUseFastModel(target.useFastModel);
      setEnableSearch(target.enableSearch);
      setEnableMaps(target.enableMaps);
      setHistoryIndex(newIdx);
    }
  }, [canRedo, historyIndex, history]);

  // Keyboard Shortcuts Listener for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleVoiceRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const response = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64Audio, mimeType: 'audio/webm' }),
            });
            const data = await response.json();
            if (data.transcript) {
              if (!title.trim()) {
                setTitle(data.transcript);
              } else {
                setContext((prev) => (prev ? `${prev}\n${data.transcript}` : data.transcript));
              }
            }
            setIsTranscribing(false);
          };
        } catch (err) {
          console.error('Transcription error:', err);
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setAttachments((prev) => [
          ...prev,
          { data: base64Data, mimeType: file.type, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTitle = (val: string) => {
    setTitle(val);
    pushHistory({
      title: val,
      context,
      options,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
    });
  };

  const updateContext = (val: string) => {
    setContext(val);
    pushHistory({
      title,
      context: val,
      options,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
    });
  };

  const handleAddOption = () => {
    if (options.length >= 5) return;
    const updated = [...options, `Option ${String.fromCharCode(65 + options.length)}`];
    setOptions(updated);
    pushHistory({
      title,
      context,
      options: updated,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
    });
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    pushHistory({
      title,
      context,
      options: updated,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    pushHistory({
      title,
      context,
      options: updated,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
    });
  };

  const handleSelectPreset = (preset: DecisionPreset) => {
    setTitle(preset.title);
    setContext(preset.context);
    setOptions(preset.options);
    pushHistory({
      title: preset.title,
      context: preset.context,
      options: preset.options,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!cleanTitle || cleanOptions.length < 2) return;

    onSubmit({
      title: cleanTitle,
      context: context.trim(),
      options: cleanOptions,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
      mediaAttachments: attachments.map((att) => ({ data: att.data, mimeType: att.mimeType })),
    });
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="w-3.5 h-3.5 text-teal-400" />;
      case 'Home': return <Home className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Compass': return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case 'Car': return <Car className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Code2': return <Code2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'GraduationCap': return <GraduationCap className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  return (
    <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
      {/* Hero Banner inside form */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Decision & Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tighter uppercase font-display">
            What decision are you weighing?
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">
            Type or dictate your dilemma. Attach photos, documents, or video to let Gemini evaluate visual trade-offs.
          </p>
        </div>

        {/* Global Form Undo / Redo Controls */}
        <div className="flex items-center gap-1 bg-[#0a0a0b] border border-white/10 rounded-xl p-1.5 shrink-0 self-start">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors flex items-center gap-1.5 text-xs font-mono"
            title="Undo recent change (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Undo</span>
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors flex items-center gap-1.5 text-xs font-mono"
            title="Redo change (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-2">
          Try a sample dilemma:
        </label>
        <div className="flex flex-wrap gap-2">
          {DECISION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#0a0a0b] text-slate-300 hover:text-white border border-white/10 hover:border-teal-500/50 transition-all text-left"
            >
              {getPresetIcon(preset.icon)}
              <span className="truncate max-w-[200px] sm:max-w-[280px]">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Intelligence Mode Controls */}
      <div className="mb-6 p-4 rounded-xl bg-[#0a0a0b] border border-white/10 space-y-3">
        <label className="block text-[11px] font-mono text-teal-400 uppercase tracking-widest">
          Gemini Intelligence & Grounding Modes:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Thinking Mode */}
          <button
            type="button"
            onClick={() => {
              setEnableThinking(!enableThinking);
              if (!enableThinking) setUseFastModel(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all ${
              enableThinking
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                : 'bg-[#121214] text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-left truncate">
              <span className="block truncate">Deep Thinking</span>
              <span className="text-[10px] text-slate-500 block">3.1 Pro (High)</span>
            </div>
          </button>

          {/* Fast Model */}
          <button
            type="button"
            onClick={() => {
              setUseFastModel(!useFastModel);
              if (!useFastModel) setEnableThinking(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all ${
              useFastModel
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                : 'bg-[#121214] text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left truncate">
              <span className="block truncate">Low Latency</span>
              <span className="text-[10px] text-slate-500 block">3.1 Flash Lite</span>
            </div>
          </button>

          {/* Google Search */}
          <button
            type="button"
            onClick={() => setEnableSearch(!enableSearch)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all ${
              enableSearch
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                : 'bg-[#121214] text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-left truncate">
              <span className="block truncate">Web Search</span>
              <span className="text-[10px] text-slate-500 block">Google Search</span>
            </div>
          </button>

          {/* Google Maps */}
          <button
            type="button"
            onClick={() => setEnableMaps(!enableMaps)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all ${
              enableMaps
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                : 'bg-[#121214] text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left truncate">
              <span className="block truncate">Maps Grounding</span>
              <span className="text-[10px] text-slate-500 block">Google Maps</span>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input with Voice Dictation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-300">
              Decision Title or Question <span className="text-rose-400">*</span>
            </label>

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={handleVoiceRecord}
              disabled={isTranscribing}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                  : 'bg-[#0a0a0b] text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Transcribing...</span>
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop Dictating</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-teal-400" />
                  <span>Dictate Dilemma</span>
                </>
              )}
            </button>
          </div>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="e.g., Should I move to Chicago or stay in Austin?"
            className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-400 text-sm"
          />
        </div>

        {/* Options Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-300">
              Choices / Options to Compare <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-500 uppercase">
              {options.length} of 5 options
            </span>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0a0a0b] text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-white/10">
                  {String.fromCharCode(65 + index)}
                </div>
                <input
                  type="text"
                  required
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1} (e.g. Move to Chicago)`}
                  className="flex-1 px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-400 text-sm transition-colors"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-teal-400 hover:text-teal-300 py-1.5 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Choice</span>
            </button>
          )}
        </div>

        {/* Context Input & Multimodal Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-300">
              Context & Priorities
            </label>
            <label className="cursor-pointer text-xs font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Image/Video/Audio</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={3}
            value={context}
            onChange={(e) => updateContext(e.target.value)}
            placeholder="e.g., Top priorities are salary growth, commute, and work-life balance..."
            className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-400 text-sm transition-colors resize-none"
          />

          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1 bg-[#0a0a0b] border border-white/10 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2"
                >
                  {att.mimeType.startsWith('image') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  ) : att.mimeType.startsWith('video') ? (
                    <Film className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                  )}
                  <span className="truncate max-w-[150px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown Type Selector */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-slate-300 mb-2.5">
            Analysis Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {[
              { id: 'all', label: 'Complete Analysis', desc: 'Full multi-dimensional evaluation', icon: Layers },
              { id: 'weighted_criteria', label: 'Weighted Criteria', desc: 'Score ranking by factor importance', icon: SlidersHorizontal },
              { id: 'pros_cons', label: 'Pros & Cons', desc: 'Weighted trade-off list', icon: Scale },
              { id: 'comparison_table', label: 'Comparison Matrix', desc: 'Scored criteria matrix', icon: Table },
              { id: 'swot', label: 'SWOT Analysis', desc: 'Strengths, Weaknesses, Ops, Threats', icon: Grid },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = analysisType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAnalysisType(item.id as DecisionAnalysisType)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg'
                      : 'bg-[#0a0a0b] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs uppercase tracking-tight">{item.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-4 flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !title.trim() || options.filter((o) => o.trim()).length < 2}
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-full shadow-lg disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Synthesizing Decision Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Run Tiebreaker Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
