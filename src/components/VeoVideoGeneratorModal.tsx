import React, { useState, useEffect } from 'react';
import { Video, X, Sparkles, Loader2, Play, Download, AlertCircle } from 'lucide-react';

interface VeoVideoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrompt?: string;
  optionName?: string;
}

export const VeoVideoGeneratorModal: React.FC<VeoVideoGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultPrompt = '',
  optionName = '',
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt || `Cinematic preview of outcome if choosing ${optionName || 'Option A'}`);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartGeneration = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setWarningMsg(null);
    setVideoUrl(null);
    setStatusText('Step 1/3: Requesting Veo 3 Video Model...');

    try {
      // Step 1: Start operation
      const startRes = await fetch('/api/veo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to initialize Veo 3 video generation.');
      }

      if (startData.isQuotaFallback && startData.videoUrl) {
        setVideoUrl(startData.videoUrl);
        setWarningMsg(startData.warning || 'Displaying outcome video preview.');
        setStatusText(null);
        setIsGenerating(false);
        return;
      }

      if (!startData.operationName) {
        throw new Error('No operation name returned for video generation.');
      }

      const operationName = startData.operationName;
      setStatusText('Step 2/3: Rendering cinematic frames (Veo 3 fast preview)...');

      // Step 2: Poll status until done
      let done = false;
      let attempts = 0;
      while (!done && attempts < 30) {
        attempts++;
        await new Promise((r) => setTimeout(r, 8000)); // wait 8 seconds between polls

        const statusRes = await fetch('/api/veo/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();
        done = statusData.done;
        setStatusText(`Step 2/3: Processing video... (${attempts * 8}s elapsed)`);
      }

      if (!done) {
        throw new Error('Video generation timed out. Please try again.');
      }

      setStatusText('Step 3/3: Downloading video stream...');

      // Step 3: Fetch video blob
      const dlRes = await fetch('/api/veo/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });

      if (!dlRes.ok) {
        throw new Error('Failed to retrieve video stream from server.');
      }

      const blob = await dlRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      setVideoUrl(objectUrl);
      setStatusText(null);
    } catch (err: any) {
      console.error('Veo generation error:', err);
      setError(err.message || 'Veo video generation failed');
      setStatusText(null);
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
      <div className="relative w-full max-w-xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-indigo-400">
            <Video className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white font-display">Veo 3 AI Outcome Simulator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Scenario Description to Animate
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what life or outcome looks like if you make this choice..."
              className="w-full px-3.5 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              Video Aspect Ratio (veo-3.1-fast-generate-preview)
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-2 text-xs font-mono rounded-xl border transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                    : 'bg-[#0a0a0b] text-slate-400 border-white/10'
                }`}
              >
                16:9 Widescreen (Desktop/TV)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-2 text-xs font-mono rounded-xl border transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                    : 'bg-[#0a0a0b] text-slate-400 border-white/10'
                }`}
              >
                9:16 Vertical (Mobile/Reels)
              </button>
            </div>
          </div>

          {/* Status / Loading indicator */}
          {statusText && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-center gap-2 font-mono">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
              <span>{statusText}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {warningMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between font-mono">
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Generated Video Player */}
          {videoUrl && (
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
              <video src={videoUrl} controls autoPlay className="w-full max-h-[300px] object-contain" />
              <div className="p-2 bg-[#0a0a0b] flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Veo 3 AI Outcome Video</span>
                <a
                  href={videoUrl}
                  download="veo-decision-outcome.mp4"
                  className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Veo Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span>Generate Veo 3 Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
