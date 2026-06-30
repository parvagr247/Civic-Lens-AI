import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendCopilotMessage, getCopilotHistory, clearCopilotHistory } from '../../services/copilotService';
import { getCurrentUser } from '../../services/authService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import { 
  Bot, Send, Trash2, HelpCircle, User, Sparkles, 
  Loader2, X, MessageSquare, Clipboard, ArrowRight, Circle
} from 'lucide-react';

/**
 * CivicLensAssistant floating helper widget.
 * Persistently floats in the bottom-right corner of authenticated layouts.
 */
export default function CivicLensAssistant() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const role = currentUser?.role?.toUpperCase() || 'CITIZEN';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Load chat history once open
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
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    
    // Add message optimistically
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await sendCopilotMessage(text);
      if (res.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      toast('Failed to get assistant response.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'report') {
      navigate('/analyze');
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: 'Report a new issue' },
        { role: 'assistant', content: "I've navigated you to the reporting canvas. You can upload a photo of the incident here, and our vision AI will classify it instantly!" }
      ]);
    } else if (action === 'track') {
      navigate('/track');
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: 'Track my report' },
        { role: 'assistant', content: "I've navigated you to the tracking page. Enter your unique Report ID to check status logs and assignments." }
      ]);
    } else if (action === 'support') {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'Contact support' },
        { role: 'assistant', content: "You can contact our municipal support desk at support@civiclens.gov or visit the City Hall Annex, Grid 1 during office hours." }
      ]);
    } else if (action === 'updates') {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'Show recent updates' },
        { role: 'assistant', content: "Recent Updates:\n• Redesigned settings layout.\n• Added incident support upvoting in community feeds.\n• Restricted db health status indicators to administrators." }
      ]);
    } else {
      handleSendMessage(action);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Clear your conversation history with CivicLens Assistant?")) return;
    try {
      const res = await clearCopilotHistory();
      if (res.success) {
        setMessages([]);
        toast('Conversation memory cleared.', 'success');
      }
    } catch (err) {
      toast('Failed to clear memory.', 'error');
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast('Response copied to clipboard!', 'success');
  };

  // Get Page specific context tip
  const getContextTip = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      return "Viewing Dashboard: Ask me to explain active report statuses or resolution timelines!";
    }
    if (path.includes('/analyze')) {
      return "Reporting Issue: Ask me what photo file types are accepted or how categories are determined!";
    }
    if (path.includes('/track')) {
      return "Tracking Report: Enter a Report ID in the console or ask me how to retrieve lost IDs!";
    }
    if (path.includes('/profile')) {
      return "Viewing Profile: Ask me about contribution points, ranks, unlocked badges, or user profiles!";
    }
    if (path.includes('/settings')) {
      return "Viewing Settings: Ask me about layout compact modes, timezone modifications, or accessibility features!";
    }
    if (path.includes('/feed')) {
      return "Viewing Community Feed: Ask me about incident upvotes, user comment moderation, or scoring points!";
    }
    return null;
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-955 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 border border-emerald-400/20 font-bold text-xs"
        title="CivicLens Assistant Helper"
      >
        <Bot size={16} className={isOpen ? 'rotate-180 transition-transform duration-300' : ''} />
        <span>CivicLens Assistant</span>
      </button>

      {/* Floating Chat Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] sm:w-[410px] h-[72vh] max-h-[580px] flex flex-col bg-slate-950/95 dark:bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-sm shrink-0">
                <Bot size={16} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white leading-none">CivicLens Assistant</span>
                <span className="block text-[9px] text-slate-500 mt-1 flex items-center gap-1 leading-none font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Assistant status: Online
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900/60 transition-colors"
                title="Clear Conversation History"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors"
                title="Minimize Drawer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Context Aware Banner */}
          {getContextTip() && (
            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-[10px] text-emerald-400 leading-normal flex items-start gap-1.5 font-bold">
              <Sparkles size={11} className="shrink-0 mt-0.5" />
              <span>{getContextTip()}</span>
            </div>
          )}

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fetching logs...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Welcome Message & suggested triggers */
              <div className="space-y-4 text-left py-2">
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                    <Bot size={12} />
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-2xl rounded-tl-none border border-slate-850 text-xs text-slate-350 leading-relaxed font-semibold">
                    <p>Hi! I'm the CivicLens Assistant.</p>
                    <p className="mt-1">I can help you:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>Report a civic issue</li>
                      <li>Track an existing report</li>
                      <li>Explain report statuses</li>
                      <li>Answer questions about CivicLens</li>
                      <li>Guide you through the platform</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Suggested Questions</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { label: 'Report a new issue', action: 'report' },
                      { label: 'Track my report', action: 'track' },
                      { label: 'How does AI classify issues?', action: 'How does AI classify issues?' },
                      { label: 'What happens after I submit a report?', action: 'What happens after I submit a report?' },
                      { label: 'Contact support', action: 'support' },
                      { label: 'Show recent updates', action: 'updates' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(item.action)}
                        className="w-full text-left px-3 py-2 bg-slate-900/30 hover:bg-slate-900 rounded-xl border border-slate-850 hover:border-emerald-500/25 transition-all text-[10.5px] font-semibold text-slate-400 hover:text-white flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                        <ArrowRight size={10} className="text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={idx} 
                    className={`flex gap-2.5 max-w-[85%] animate-fade-in ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                      isUser 
                        ? 'bg-emerald-500 text-slate-955 border-emerald-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      {isUser ? <User size={12} /> : <Bot size={12} />}
                    </div>

                    <div className="space-y-1">
                      <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                        isUser 
                          ? 'bg-emerald-500/10 text-slate-200 border-emerald-500/25 rounded-tr-none font-semibold' 
                          : 'bg-slate-900/30 text-slate-350 border-slate-850 rounded-tl-none font-medium'
                      }`}>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                      
                      {!isUser && (
                        <div className="flex gap-2 justify-end opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyText(msg.content)}
                            className="text-[8px] font-bold text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                            title="Copy reply text"
                          >
                            <Clipboard size={9} /> Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking Animation */}
            {loading && (
              <div className="flex gap-2.5 max-w-[80%] animate-pulse mr-auto">
                <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                  <Loader2 size={12} className="animate-spin text-emerald-500" />
                </div>
                <div className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl rounded-tl-none space-y-1 flex flex-col justify-center">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Assistant Thinking...</span>
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/20">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me a question or query report statuses..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-350 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-955 rounded-lg active:scale-95 transition-all"
              >
                <Send size={11} />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
