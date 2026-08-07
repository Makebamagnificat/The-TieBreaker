import React, { useState } from 'react';
import { Music, X, Sparkles, Loader2, Play, Pause, Disc } from 'lucide-react';

interface LyriaMusicGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionTitle?: string;
  winnerName?: string;
}

export const LyriaMusicGeneratorModal: React.FC<LyriaMusicGeneratorModalProps> = ({
  isOpen,
  onClose,
  decisionTitle = '',
  winnerName = '',
}) => {
  const [prompt, setPrompt] = useState(
    `An inspiring synthwave soundscape celebrating the choice of "${winnerName || 'Option A'}" for decision "${decisionTitle || 'Career Move'}"`
  );
  const [isFullLength, setIsFullLength] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyricsText, setLyricsText] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    if (audioObj) {
      audioObj.pause();
      setIsPlaying(false);
    }

    try {
      const res = await fetch('/api/lyria/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          fullLength: isFullLength,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Music generation failed.');

      if (data.audioBase64) {
        const mime = data.mimeType || 'audio/wav';
        const url = `data:${mime};base64,${data.audioBase64}`;
        setAudioUrl(url);

        const newAudio = new Audio(url);
        newAudio.onended = () => setIsPlaying(false);
        setAudioObj(newAudio);
      }

      if (data.lyrics) {
        setLyricsText(data.lyrics);
      }
    } catch (err: any) {
      console.error('Lyria error:', err);
      setError(err.message || 'Failed to generate music clip');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioObj) return;
    if (isPlaying) {
      audioObj.pause();
      setIsPlaying(false);
    } else {
      audioObj.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-amber-400">
            <Music className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white font-display">Lyria 3 Decision Anthem Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Music Style & Theme Prompt
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0a0a0b] rounded-xl border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white">Track Duration</span>
              <p className="text-[11px] text-slate-400">lyria-3-clip-preview (30s) vs lyria-3-pro-preview (Full)</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullLength(!isFullLength)}
              className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-colors ${
                isFullLength ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'
              }`}
            >
              {isFullLength ? 'Pro (Full Track)' : 'Clip (30s Short)'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Player Display */}
          {audioUrl && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center transition-all shadow-md"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Disc className={`w-4 h-4 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} />
                    <span>Decision Anthem</span>
                  </h4>
                  <p className="text-xs text-amber-300/80 font-mono">Lyria 3 Audio Stream</p>
                </div>
              </div>
            </div>
          )}

          {lyricsText && (
            <div className="p-3 bg-[#0a0a0b] rounded-xl border border-white/5 text-xs font-mono text-slate-300 max-h-32 overflow-y-auto">
              <span className="text-amber-400 block mb-1">LYRICS / MOTIF:</span>
              <p className="whitespace-pre-wrap">{lyricsText}</p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleGenerateMusic}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Composing Audio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Lyria Music</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
