import React, { useState, useEffect, useRef } from 'react';
import { sendCopilotMessage, getCopilotHistory, clearCopilotHistory } from '../services/copilotService';
import { getCurrentUser } from '../services/authService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { Badge } from '../components/ui/Badge';
import { 
  Bot, Send, Trash2, HelpCircle, User, Sparkles, 
  CornerDownLeft, Loader2, ArrowRight, MessageSquare, Clipboard 
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

/**
 * AICopilot page component.
 * Role-aware RAG Chat Copilot for Citizens, Officers, and Admins.
 */
export default function AICopilot() {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const role = currentUser?.role?.toUpperCase() || 'CITIZEN';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getCopilotHistory();
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.warn("Failed to load chat history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    setInput('');
    // Optimistic user update
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await sendCopilotMessage(text);
      if (res.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      toast('Failed to get AI response.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear your Copilot memory?")) return;
    try {
      const res = await clearCopilotHistory();
      if (res.success) {
        setMessages([]);
        toast('Conversation memory cleared.', 'success');
      }
    } catch (err) {
      toast('Failed to clear chat memory.', 'error');
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast('Response copied to clipboard!', 'success');
  };

  // Role Specific Suggestions
  const getSuggestions = () => {
    switch (role) {
      case 'ADMIN':
        return [
          "Suggest resource allocation improvements",
          "Explain why AI recommended Public Works",
          "Identify overloaded officers and suggest reassignments",
          "Predict tomorrow's repair workloads"
        ];
      case 'OFFICER':
        return [
          "What are my critical dispatches and upcoming deadlines?",
          "Explain travel routing to my assigned worksite",
          "Summarize community discussion on my active task",
          "Generate a completion summary draft"
        ];
      case 'CITIZEN':
      default:
        return [
          "Why is my street pothole report delayed?",
          "Explain my hazard risk assessment score",
          "Check duplicate reports in my neighborhood",
          "Summarize community discussion on active issues"
        ];
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 text-slate-900 dark:text-slate-100">
      
      {/* Sidebar: Suggestions & Role info */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        
        {/* User Card */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center font-bold shadow-sm shrink-0">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black block">{currentUser?.name}</h3>
              <Badge className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase mt-1">
                {role} COPILOT ACTIVE
              </Badge>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
            Grounded in active incidents, dispatch tasks, and SLA records using Retrieval-Augmented Generation (RAG).
          </p>
        </Card>

        {/* Suggestion prompt list */}
        <div className="flex-1 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm space-y-3.5 flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-500" />
            Suggested Actions
          </h4>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {getSuggestions().map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={loading}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-850 hover:border-emerald-500/20 transition-all text-[10.5px] font-semibold leading-relaxed group"
              >
                <span>{s}</span>
                <ArrowRight size={10} className="inline ml-1 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-slate-850 dark:text-rose-400 dark:hover:bg-rose-950/20 text-xs py-2 gap-1.5 font-bold mt-auto active:scale-95 shadow-sm"
          >
            <Trash2 size={13} />
            Clear Memory
          </Button>
        </div>
      </div>

      {/* Main Chat Terminal */}
      <div className="flex-1 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full shadow-sm overflow-hidden relative">
        
        {/* Terminal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-emerald-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-slate-700 dark:text-slate-350">
              Copilot Terminal
            </span>
          </div>
          <span className="text-[9px] text-slate-450 font-mono">
            Model: Gemini-Flash-RAG
          </span>
        </div>

        {/* Message Log viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {historyLoading ? (
            <div className="space-y-4 py-4">
              <SkeletonLoader variant="table" count={3} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950/50 text-slate-400 flex items-center justify-center">
                <MessageSquare size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Start an Agentic Session</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Ask about repair timelines, duplicate scores, cost forecasting, or equipment recommended by specialized city agents.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] animate-fade-in ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${
                    isUser 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div className="space-y-1">
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-relaxed border ${
                      isUser 
                        ? 'bg-emerald-500/10 text-slate-800 dark:text-slate-200 border-emerald-500/20 rounded-tr-none font-semibold' 
                        : 'bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border-slate-150 dark:border-slate-850 rounded-tl-none font-medium'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    
                    {!isUser && (
                      <div className="flex gap-2 justify-end opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyText(msg.content)}
                          className="text-[9px] font-bold text-slate-450 hover:text-emerald-500 flex items-center gap-1 transition-colors"
                          title="Copy reply text"
                        >
                          <Clipboard size={10} /> Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing animation block */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] animate-pulse mr-auto">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <Loader2 size={14} className="animate-spin text-emerald-500" />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl rounded-tl-none space-y-1.5 flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Agent Thinking...</span>
                <div className="flex gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input block */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-850 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about municipal dispatches or SLA reports..."
              className="w-full bg-white dark:bg-slate-950/40 border border-slate-250 dark:border-slate-850 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-800 dark:text-slate-250 placeholder-slate-450 focus:outline-none focus:border-emerald-500/50 shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1.5 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg active:scale-95"
            >
              <Send size={12} />
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
}
