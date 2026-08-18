import { useState, useEffect } from 'react';
import { Bug, Send, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { supabase, type DevTicket } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useUI } from '@/lib/ui';
import { sanitizeText } from '@/lib/security';

export default function DevView() {
  const { user } = useAuth();
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<DevTicket[]>([]);
  const [sent, setSent] = useState(false);

  const bg = isDark ? 'bg-slate-950' : 'bg-[#FAF9F6]';
  const cardBg = isDark ? 'bg-slate-900/60' : 'bg-white/80';
  const border = isDark ? 'border-slate-800' : 'border-slate-200';
  const inputBg = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

  const t = lang === 'ar'
    ? {
        title: 'إرسال ملاحظة للمطور', subjectPh: 'عنوان الملاحظة أو المشكلة',
        messagePh: 'اشرح المشكلة أو الاقتراح بالتفصيل...', send: 'إرسال',
        sentMsg: 'تم إرسال ملاحظتك. شكراً يا غالي!', prevTickets: 'تذاكرك السابقة',
        noTickets: 'لا توجد تذاكر بعد',
        resolved: 'تم الحل', dismissed: 'مرفوض', pending: 'قيد الانتظار', inProgress: 'قيد المعالجة',
      }
    : {
        title: 'Send Feedback to Developer', subjectPh: 'Bug or feedback title',
        messagePh: 'Describe the issue or suggestion...', send: 'Send',
        sentMsg: 'Feedback sent. Thank you!', prevTickets: 'Your Previous Tickets',
        noTickets: 'No tickets yet',
        resolved: 'Resolved', dismissed: 'Dismissed', pending: 'Pending', inProgress: 'In Progress',
      };

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    if (!user) return;
    const { data } = await supabase
      .from('dev_tickets')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });
    if (data) setTickets(data as DevTicket[]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const s = sanitizeText(subject).trim();
    const m = sanitizeText(message).trim();
    if (!s || !m) return;
    await supabase.from('dev_tickets').insert({
      user_email: user.email,
      user_name: user.name,
      subject: s,
      message: m,
    });
    setSubject('');
    setMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    loadTickets();
  }

  function statusInfo(status: DevTicket['status']) {
    if (status === 'resolved') return { icon: <CheckCircle2 className="w-3 h-3" />, label: t.resolved, cls: 'bg-emerald-500/15 text-emerald-500' };
    if (status === 'dismissed') return { icon: <XCircle className="w-3 h-3" />, label: t.dismissed, cls: isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500' };
    if (status === 'in_progress') return { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: t.inProgress, cls: 'bg-amber-500/15 text-amber-500' };
    return { icon: <Clock className="w-3 h-3" />, label: t.pending, cls: 'bg-amber-500/15 text-amber-500' };
  }

  return (
    <div className={`h-full overflow-y-auto ${bg} p-4 lg:p-6`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`${cardBg} border ${border} rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold">{t.title}</h2>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.subjectPh}
              className={`w-full ${inputBg} border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/40`}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePh}
              rows={4}
              className={`w-full ${inputBg} border rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-500/40`}
            />
            <button
              type="submit"
              disabled={!subject.trim() || !message.trim()}
              className="w-full bg-gradient-to-l from-[#FF6B00] to-[#FF8800] hover:from-[#FF7B10] hover:to-[#FF9900] disabled:opacity-40 text-white font-medium py-2.5 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {t.send}
            </button>
            {sent && <p className="text-emerald-500 text-sm text-center">{t.sentMsg}</p>}
          </form>
        </div>

        <div>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-3`}>{t.prevTickets}</h3>
          {tickets.length === 0 ? (
            <p className={`${subtext} text-sm text-center py-8`}>{t.noTickets}</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((tk) => {
                const si = statusInfo(tk.status);
                return (
                  <div key={tk.id} className={`${cardBg} border ${border} rounded-2xl p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{tk.subject}</p>
                        <p className={`text-xs ${subtext} mt-1`}>{tk.message}</p>
                        <p className={`text-xs ${subtext} mt-2 flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {new Date(tk.created_at).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en')}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full shrink-0 ${si.cls}`}>
                        {si.icon}
                        {si.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
