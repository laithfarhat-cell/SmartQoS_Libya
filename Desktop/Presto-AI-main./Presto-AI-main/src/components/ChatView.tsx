import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RotateCcw, Loader2, Bot, User } from 'lucide-react';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useUI } from '@/lib/ui';
import { streamGeminiReply } from '@/lib/gemini';
import { sanitizeText } from '@/lib/security';

const GREETING = 'مرحبا معك Presto AI كيف يمكنني مساعدتك ؟';

const QUICK_ACTIONS = [
  'إجراء PE-01 (إلغاء الطلب)',
  'إجراء PE-05 (عدم رد الزبون)',
  'تعويضات السائقين والمطاعم',
  'المدن الممنوعة التعامل معها',
  'طلب تحويل للمالية /المالية',
];

export default function ChatView() {
  const { user } = useAuth();
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const bg = isDark ? 'bg-slate-950' : 'bg-[#FAF9F6]';
  const headerBg = isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/60 border-slate-200';
  const inputBg = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const bubbleBg = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';
  const userBubbleBg = 'bg-orange-500/15 border-orange-500/20';
  const quickBg = isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        const greeting: ChatMessage = {
          id: 'welcome',
          user_email: user.email,
          role: 'assistant',
          content: GREETING,
          created_at: new Date().toISOString(),
        };
        setMessages([greeting]);
        await supabase.from('chat_messages').insert({
          user_email: user.email,
          role: 'assistant',
          content: greeting.content,
        });
      }
      setLoadingHistory(false);
    })();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, partial]);

  async function handleSend(text?: string) {
    const content = sanitizeText((text ?? input).trim());
    if (!content || streaming || !user) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_email: user.email,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    await supabase.from('chat_messages').insert({ user_email: user.email, role: 'user', content });

    setStreaming(true);
    setPartial('');
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    const history = [...messages, userMsg].map((m) => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

    await streamGeminiReply(history, (chunk) => {
      accumulated += chunk;
      setPartial(accumulated);
    }, controller.signal);

    const finalContent = accumulated || 'تمام يا غالي، ما قدرت أفهم السؤال. تقدر توضح أكثر؟';
    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_email: user.email,
      role: 'assistant',
      content: finalContent,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, aiMsg]);
    setPartial('');
    setStreaming(false);
    await supabase.from('chat_messages').insert({ user_email: user.email, role: 'assistant', content: finalContent });
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setStreaming(false);
    if (partial) {
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_email: user?.email ?? '',
        role: 'assistant',
        content: partial,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, aiMsg]);
      setPartial('');
      if (user) supabase.from('chat_messages').insert({ user_email: user.email, role: 'assistant', content: partial }).then();
    }
  }

  async function clearChat() {
    if (!user) return;
    await supabase.from('chat_messages').delete().eq('user_email', user.email);
    const greeting: ChatMessage = {
      id: 'welcome',
      user_email: user.email,
      role: 'assistant',
      content: GREETING,
      created_at: new Date().toISOString(),
    };
    setMessages([greeting]);
    await supabase.from('chat_messages').insert({ user_email: user.email, role: 'assistant', content: greeting.content });
  }

  const t = lang === 'ar'
    ? { agentName: 'Presto AI - وكيل العمليات', active: 'نشط الآن', newChat: 'محادثة جديدة', inputPh: 'اكتب رسالتك هنا...', poweredBy: 'مدعوم بـ Google Gemini • اللهجة الليبية الأصيلة' }
    : { agentName: 'Presto AI - Ops Agent', active: 'Active now', newChat: 'New chat', inputPh: 'Type your message...', poweredBy: 'Powered by Google Gemini • Authentic Libyan dialect' };

  return (
    <div className={`h-full flex flex-col ${bg}`}>
      {/* chat header */}
      <div className={`px-6 py-3 border-b ${headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB800] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 ${isDark ? 'border-slate-950' : 'border-[#FAF9F6]'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">{t.agentName}</p>
            <p className="text-xs text-emerald-500">{t.active}</p>
          </div>
        </div>
        <button onClick={clearChat} className={`${subtext} hover:text-orange-500 text-xs flex items-center gap-1`}>
          <RotateCcw className="w-3.5 h-3.5" /> {t.newChat}
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4">
        <div className="max-w-3xl mx-auto w-full">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} isDark={isDark} />)
          )}
          {streaming && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB800] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className={`${bubbleBg} border rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]`}>
                {partial ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{partial}<span className="inline-block w-1.5 h-4 bg-orange-500 animate-pulse mr-0.5 align-middle" /></p>
                ) : (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* quick actions */}
      <div className="px-4 lg:px-6 pb-2">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              onClick={() => !streaming && handleSend(q)}
              disabled={streaming}
              className={`text-xs px-3 py-1.5 rounded-full border ${quickBg} hover:border-orange-500/40 hover:text-orange-500 transition disabled:opacity-40`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* input */}
      <div className={`px-4 lg:px-6 py-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.inputPh}
              rows={1}
              className={`w-full ${inputBg} border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition max-h-32`}
            />
          </div>
          {streaming ? (
            <button
              onClick={stopStreaming}
              className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-2xl transition"
            >
              <span className="block w-4 h-4 bg-white rounded-sm" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="bg-gradient-to-l from-[#FF6B00] to-[#FF8800] hover:from-[#FF7B10] hover:to-[#FF9900] disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition shadow-lg shadow-orange-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className={`text-center text-xs ${subtext} mt-2 flex items-center justify-center gap-1`}>
          <Sparkles className="w-3 h-3" /> {t.poweredBy}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, isDark }: { message: ChatMessage; isDark: boolean }) {
  const isUser = message.role === 'user';
  const bubbleBg = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? (isDark ? 'bg-slate-700' : 'bg-slate-200') : 'bg-gradient-to-br from-[#FF6B00] to-[#FFB800]'}`}>
        {isUser ? <User className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'bg-orange-500/15 border border-orange-500/20 rounded-2xl rounded-tl-sm' : `${bubbleBg} border rounded-2xl rounded-tr-sm`} px-4 py-3`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
