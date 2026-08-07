import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Radio, AlertCircle, ShieldAlert, ExternalLink, CheckCircle } from 'lucide-react';

interface LiveVoiceCounselorModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionTitle?: string;
}

export const LiveVoiceCounselorModal: React.FC<LiveVoiceCounselorModalProps> = ({
  isOpen,
  onClose,
  decisionTitle = '',
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');
  const [error, setError] = useState<string | null>(null);
  const [permissionHelp, setPermissionHelp] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleDisconnect();
    } else {
      checkMicPermission();
    }
  }, [isOpen]);

  const checkMicPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'granted') {
          setMicGranted(true);
        } else if (result.state === 'denied') {
          setMicGranted(false);
          setPermissionHelp(true);
        }
      }
    } catch (e) {
      // Permission API query might not be supported for mic in all browsers
    }
  };

  const requestMicAccess = async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone input.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      setPermissionHelp(false);
      setError(null);
      return stream;
    } catch (err: any) {
      console.error('Mic access error:', err);
      setMicGranted(false);
      setPermissionHelp(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was blocked. Please enable microphone access in your browser or click the lock icon in the address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found on your device. Please plug in a microphone and retry.');
      } else {
        setError('Microphone access is required for Gemini Live Voice Chat.');
      }
      return null;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleConnect = async () => {
    try {
      setError(null);
      setStatus('Requesting Microphone Access...');

      // First test/prompt microphone permission directly
      const stream = await requestMicAccess();
      if (!stream) {
        setStatus('Microphone Access Needed');
        return;
      }

      mediaStreamRef.current = stream;
      setStatus('Connecting to Live Gemini Voice Hotline...');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatus('Live Voice Session Active! Start speaking now.');
        startAudioInput(ws, stream);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
            return;
          }

          if (data.audio) {
            // Play back PCM 24kHz audio from Gemini
            playPcmChunk(data.audio);
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Live API error:', err);
        setError('Voice connection failed. Please ensure your microphone is enabled and try again.');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
        setStatus('Disconnected');
      };
    } catch (err: any) {
      console.error('Connect error:', err);
      setError(err.message || 'Failed to start live voice session.');
    }
  };

  const startAudioInput = async (ws: WebSocket, stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert Int16Array to Base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        ws.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic input processing error:', err);
      setError('Unable to process microphone audio input.');
    }
  };

  const playPcmChunk = (base64Pcm: string) => {
    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioCtx = audioCtxRef.current || new AudioContext({ sampleRate: 24000 });
      const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const handleDisconnect = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsRecording(false);
    setStatus('Disconnected');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-rose-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <h3 className="text-base font-bold text-white font-display">Gemini Live Voice Hotline</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Graphic */}
        <div className="my-6 flex flex-col items-center justify-center gap-3">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all shadow-xl ${
              isConnected
                ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-rose-500/20 animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            {isConnected ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {decisionTitle ? `Discussing: "${decisionTitle}"` : 'Realtime Voice Counseling'}
            </p>
            <p className="text-xs font-mono text-slate-400">{status}</p>
          </div>

          {/* Mic Status indicator pill */}
          <div className="pt-1">
            {micGranted === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                <CheckCircle className="w-3 h-3" /> Microphone Access Granted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                <Mic className="w-3 h-3" /> Microphone Permission Required
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {permissionHelp && (
          <div className="mb-4 p-3 bg-slate-900 border border-white/10 rounded-xl text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>How to Enable Microphone:</span>
            </div>
            <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside pl-1">
              <li>Click the <strong>Lock / Tune icon</strong> in your browser URL bar.</li>
              <li>Toggle <strong>Microphone</strong> to <strong>Allow</strong>.</li>
              <li>Click <strong>Grant Microphone Permission</strong> below to re-test.</li>
            </ol>
            <div className="pt-1 flex gap-2">
              <button
                onClick={requestMicAccess}
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                Grant Microphone Permission
              </button>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="flex flex-col gap-2">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-colors shadow-lg"
            >
              End Live Voice Session
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Start Live Voice Session</span>
            </button>
          )}

          {/* New Tab Option for Iframe restriction fallback */}
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1 pt-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Having mic permission issues? Open app in a new tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};

