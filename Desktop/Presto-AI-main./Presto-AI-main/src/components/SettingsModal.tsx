import { useState } from 'react';
import { X, KeyRound, Save, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { getGeminiKey, setGeminiKey } from '@/lib/gemini';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(getGeminiKey());
  const [saved, setSaved] = useState(false);

  function save() {
    setGeminiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function clear() {
    setGeminiKey('');
    setKey('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-400" /> الإعدادات
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> مفتاح Google Gemini API
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
              dir="ltr"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/40"
            />
            <p className="text-xs text-slate-500 mt-2">
              يُحفظ محلياً في متصفحك فقط. لو تركته فارغ، يستعمل التطبيق محرك ذكاء احتياطي.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> احصل على مفتاح من Google AI Studio
          </a>

          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 bg-gradient-to-l from-[#FF6B00] to-[#FF8800] hover:from-[#FF7B10] hover:to-[#FF9900] text-white font-medium py-2.5 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> حفظ
            </button>
            <button
              onClick={clear}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> مسح
            </button>
          </div>
          {saved && <p className="text-emerald-400 text-sm text-center">تم الحفظ بنجاح!</p>}
        </div>
      </div>
    </div>
  );
}
