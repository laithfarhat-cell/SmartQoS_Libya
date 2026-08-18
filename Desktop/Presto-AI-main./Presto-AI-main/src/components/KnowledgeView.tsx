import { useState } from 'react';
import { Search, BookOpen, AlertOctagon, Banknote, ChevronDown, ChevronUp } from 'lucide-react';
import { PE_CODES, COMPENSATIONS, FORBIDDEN_CITIES, type PECode } from '@/lib/peData';
import { useUI } from '@/lib/ui';

export default function KnowledgeView() {
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>('PE-01');
  const [view, setView] = useState<'codes' | 'compensations' | 'forbidden'>('codes');

  const bg = isDark ? 'bg-slate-950' : 'bg-[#FAF9F6]';
  const cardBg = isDark ? 'bg-slate-900/60' : 'bg-white/80';
  const border = isDark ? 'border-slate-800' : 'border-slate-200';
  const inputBg = isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const bodyText = isDark ? 'text-slate-300' : 'text-slate-700';

  const t = lang === 'ar'
    ? { searchPh: 'ابحث في دليل الإجراءات...', procedures: 'الإجراءات', comp: 'التعويضات', forbidden: 'ممنوع',
        forbiddenTitle: 'المدن الممنوعة تماماً', forbiddenDesc: 'التعامل والعمليات في هذه المدن ممنوع منعاً باتاً في منصة بريستو:' }
    : { searchPh: 'Search the knowledge base...', procedures: 'Procedures', comp: 'Compensations', forbidden: 'Forbidden',
        forbiddenTitle: 'Strictly Forbidden Cities', forbiddenDesc: 'Operations in these cities are strictly prohibited on Prestoeat:' };

  const filtered = PE_CODES.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.titleAr.includes(search) ||
      p.summary.includes(search)
  );

  return (
    <div className={`h-full overflow-y-auto ${bg} p-4 lg:p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className={`absolute ${lang === 'ar' ? 'right' : 'left'}-3 top-1/2 -translate-y-1/2 w-4 h-4 ${subtext}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPh}
              className={`w-full ${inputBg} border rounded-2xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm focus:outline-none focus:border-orange-500/40`}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('codes')} className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition flex items-center gap-2 ${view === 'codes' ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30' : `${cardBg} ${subtext} border ${border}`}`}>
              <BookOpen className="w-4 h-4" /> {t.procedures}
            </button>
            <button onClick={() => setView('compensations')} className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition flex items-center gap-2 ${view === 'compensations' ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30' : `${cardBg} ${subtext} border ${border}`}`}>
              <Banknote className="w-4 h-4" /> {t.comp}
            </button>
            <button onClick={() => setView('forbidden')} className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition flex items-center gap-2 ${view === 'forbidden' ? 'bg-red-500/15 text-red-500 border border-red-500/30' : `${cardBg} ${subtext} border ${border}`}`}>
              <AlertOctagon className="w-4 h-4" /> {t.forbidden}
            </button>
          </div>
        </div>

        {view === 'codes' && (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PECard key={p.code} pe={p} expanded={expanded === p.code} onToggle={() => setExpanded(expanded === p.code ? null : p.code)} isDark={isDark} cardBg={cardBg} border={border} subtext={subtext} bodyText={bodyText} />
            ))}
          </div>
        )}

        {view === 'compensations' && (
          <div className="space-y-3">
            {COMPENSATIONS.map((c) => (
              <div key={c.label} className={`${cardBg} border ${border} rounded-2xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">{c.label}</h3>
                </div>
                <p className={`text-sm ${bodyText} leading-relaxed`}>{c.values}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'forbidden' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon className="w-6 h-6 text-red-500" />
              <h3 className="font-bold text-red-500">{t.forbiddenTitle}</h3>
            </div>
            <p className={`text-sm ${bodyText} mb-4`}>{t.forbiddenDesc}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FORBIDDEN_CITIES.map((c) => (
                <div key={c} className={`${cardBg} border border-red-500/20 rounded-xl p-3 text-center`}>
                  <p className="font-medium text-red-500">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PECard({ pe, expanded, onToggle, isDark, cardBg, border, subtext, bodyText }: {
  pe: PECode; expanded: boolean; onToggle: () => void; isDark: boolean;
  cardBg: string; border: string; subtext: string; bodyText: string;
}) {
  return (
    <div className={`${cardBg} border ${border} rounded-2xl overflow-hidden`}>
      <button onClick={onToggle} className={`w-full p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'} transition`}>
        <div className="flex items-center gap-3 text-right">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-l from-[#FF6B00] to-[#FFB800] text-white shrink-0">{pe.code}</span>
          <div>
            <p className="font-semibold text-sm">{pe.titleAr}</p>
            <p className={`text-xs ${subtext}`}>{pe.title}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className={`w-5 h-5 ${subtext}`} /> : <ChevronDown className={`w-5 h-5 ${subtext}`} />}
      </button>
      {expanded && (
        <div className={`px-4 pb-4 pt-1 border-t ${border}`}>
          <p className={`text-sm ${subtext} mb-3`}>{pe.summary}</p>
          <ul className="space-y-2">
            {pe.details.map((d, i) => (
              <li key={i} className={`text-sm ${bodyText} leading-relaxed flex gap-2`}>
                <span className="text-orange-500 shrink-0">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
