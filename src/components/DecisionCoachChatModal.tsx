import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, User, Sparkles, Loader2, MessageSquare, HelpCircle } from 'lucide-react';

interface DecisionCoachChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionTitle?: string;
  context?: string;
}

interface Message {
  sender: 'user' | 'ai';
  content: string;
}

export const DecisionCoachChatModal: React.FC<DecisionCoachChatModalProps> = ({
  isOpen,
  onClose,
  decisionTitle = '',
  context = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          sender: 'ai',
          content: `Hello! I am your AI Decision Coach powered by Gemini 3.1 Pro. Ask me anything about "${
            decisionTitle || 'your dilemma'
          }" — I can help you evaluate hidden trade-offs, mitigate cognitive bias, or suggest additional criteria.`,
        },
      ]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, decisionTitle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Handle ESC key press to exit chatbox
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

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    const userMsg = textToSend.trim();
    setInput('');

    const newMessages: Message[] = [...messages, { sender: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          decisionTitle,
          context,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get AI advisor reply.');

      setMessages((prev) => [...prev, { sender: 'ai', content: data.reply }]);
    } catch (err: any) {
      console.error('Chat advisor error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', content: `Sorry, I ran into an issue: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    handleSendText(input);
  };

  const starterPrompts = [
    "What are the biggest hidden risks?",
    "How can I test my decision safely?",
    "Help me challenge my cognitive bias",
    "What if I regret my choice in 6 months?",
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl h-[620px] bg-[#121214] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">AI Decision Coach Chat</h3>
              <p className="text-[11px] text-teal-400 font-mono">Powered by Gemini 3.1 Pro & Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Press Esc or click to exit"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Exit Chat</span>
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'bg-white/10 text-teal-400 border border-white/10'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-500/20 text-white border border-teal-500/30 rounded-tr-none'
                    : 'bg-[#0a0a0b] text-slate-200 border border-white/10 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing scenario with Gemini...</span>
            </div>
          )}

          {/* Quick Starter Prompts */}
          {messages.length <= 2 && !isLoading && (
            <div className="pt-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>Suggested Questions:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendText(prompt)}
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-white/10 hover:border-teal-500/40 rounded-lg transition-all text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0a0a0b]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for advice, counter-arguments, or risk checks..."
              className="flex-1 px-4 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
