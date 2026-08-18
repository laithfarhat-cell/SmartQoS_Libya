import { useState } from 'react';
import { X, Send, Bug } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { sanitizeText } from '@/lib/security';

export default function DevFeedbackModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

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
    setSent(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-400" /> إرسال ملاحظة للمطور
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <p className="text-emerald-400 text-center py-6">تم إرسال ملاحظتك. شكراً يا غالي!</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="عنوان المشكلة"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/40"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اشرح المشكلة أو الاقتراح..."
              rows={4}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-500/40"
            />
            <button
              type="submit"
              disabled={!subject.trim() || !message.trim()}
              className="w-full bg-gradient-to-l from-[#FF6B00] to-[#FF8800] hover:from-[#FF7B10] hover:to-[#FF9900] disabled:opacity-40 text-white font-medium py-2.5 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> إرسال
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
