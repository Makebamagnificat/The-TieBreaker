import React, { useState } from 'react';
import { Sparkles, X, Image as ImageIcon, Download, RefreshCw, Wand2, Layers } from 'lucide-react';

interface OptionVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrompt?: string;
  optionName?: string;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Widescreen' },
  { id: '9:16', label: '9:16 Portrait' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '3:4', label: '3:4 Vertical' },
  { id: '21:9', label: '21:9 Ultrawide' },
];

export const OptionVisualizerModal: React.FC<OptionVisualizerModalProps> = ({
  isOpen,
  onClose,
  defaultPrompt = '',
  optionName = '',
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt || `Visual representation of ${optionName || 'decision option'}`);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [is4K, setIs4K] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setWarningMsg(null);

    try {
      const res = await fetch('/api/generate-option-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          quality: is4K ? '4K' : '1K',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate visual');
      }

      setImageUrl(data.imageUrl);
      if (data.warning) {
        setWarningMsg(data.warning);
      }
    } catch (err: any) {
      console.error('Image gen error:', err);
      setError(err.message || 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-teal-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white font-display">AI Visualizer & Image Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Visual Concept Prompt
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Modern minimalist eco-friendly apartment with city views"
              className="w-full px-3.5 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              Aspect Ratio Controls (Gemini 3.1 Flash Image)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    aspectRatio === ar.id
                      ? 'bg-teal-500/20 text-teal-400 border-teal-500/50 font-bold'
                      : 'bg-[#0a0a0b] text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0b] rounded-xl border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white">4K Studio Quality</span>
              <p className="text-[11px] text-slate-400">Uses gemini-3-pro-image preview for ultra high resolution</p>
            </div>
            <button
              type="button"
              onClick={() => setIs4K(!is4K)}
              className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-colors ${
                is4K ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'
              }`}
            >
              {is4K ? '4K On' : '1K Standard'}
            </button>
          </div>

          {/* Error & Warning display */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {warningMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Output Image Preview */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-900 group">
              <img src={imageUrl} alt="Generated option visual" className="w-full object-contain max-h-[350px]" />
              <div className="absolute top-2 right-2 flex gap-2">
                <a
                  href={imageUrl}
                  download="decision-option-visual.png"
                  className="p-2 bg-slate-950/80 hover:bg-slate-950 text-white rounded-lg backdrop-blur-sm transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Rendering Image...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate AI Visual</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
