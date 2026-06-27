import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Bot, Send, User, Brain, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

const AICopilot = () => {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am your CivicLens AI municipal copilot. I can search through Firestore reports, evaluate risk budgets, map resolution guidelines, and query system stats. What can I help you analyze today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const suggestionChips = [
    "Identify high-risk road damage in Zone B",
    "List unresolved Water leaks older than 2 days",
    "Summarize resolution statistics for Zone A",
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      let responseText = "I've searched through our Firestore incident index. ";
      
      if (text.toLowerCase().includes('road') || text.toLowerCase().includes('zone b')) {
        responseText += "Currently, Zone B (Downtown Core) has 3 active road damage incidents. The highest risk is Incident #101 on 5th Avenue near Broadway. Gemini Vision estimates a risk score of 8.2/10. I recommend scheduling immediate asphalt patching before the evening rush hour.";
      } else if (text.toLowerCase().includes('water') || text.toLowerCase().includes('leak')) {
        responseText += "I found 1 active water leakage report (Incident #102 on Elm Street). It has been flagged as critical due to the potential threat of local residential flooding. A plumbing work order was automatically generated.";
      } else {
        responseText += "System diagnostics show 42 active incidents across the city. Average resolution time has improved by 14% since we integrated Gemini-driven automated tagging. Let me know if you would like me to list details for any specific incident.";
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
      toast('AI Copilot generated a response.', 'info');
    }, 1500);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader 
        title="AI Municipal Copilot" 
        subtitle="Chat with Gemini to extract insights, schedule work orders, and summarize incidents."
      />

      <div className="flex-1 grid gap-6 md:grid-cols-4 min-h-0">
        {/* Suggestion Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span>Suggested Queries</span>
              </CardTitle>
              <CardDescription className="text-xs">Quick prompts to ask the copilot.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="text-left text-xs p-2.5 rounded-lg border border-border bg-card hover:bg-secondary hover:text-foreground transition-all duration-200 text-muted-foreground leading-relaxed"
                >
                  "{chip}"
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex gap-2 items-start text-xs text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Copilot operations are logged in backend workflows using Embabel Goal-Oriented Action Planners.</span>
            </CardContent>
          </Card>
        </div>

        {/* Chat Box */}
        <Card className="md:col-span-3 flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-secondary/10 py-4 flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Gemini Assistant</CardTitle>
              <CardDescription className="text-xs">Stateless Copilot Session</CardDescription>
            </div>
          </CardHeader>

          {/* Messages Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 border ${
                    m.role === 'user'
                      ? 'bg-secondary border-border text-muted-foreground'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                      : 'bg-card text-foreground border-border rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-card text-foreground border border-border p-3.5 rounded-2xl rounded-tl-none text-sm animate-pulse-subtle flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-border bg-secondary/15">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask about municipal issues, prioritize work, or check system logs..."
                className="flex-1 bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="submit" variant="primary" icon={Send} className="px-5 rounded-xl">
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AICopilot;
