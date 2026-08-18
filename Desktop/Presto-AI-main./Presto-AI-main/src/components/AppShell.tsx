import { useState, type ReactNode } from 'react';
import {
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  CircleDot,
  Bug,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';
import { useAuth, isAdmin } from '@/lib/auth';
import { useUI } from '@/lib/ui';

const LOGO_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTmgBhcqC9M317SMZaLHOFgxRDjIFpsl5emeWX0cM0_0UxwRppRG_37EuA&s=10';

export type TabId = 'chat' | 'dashboard' | 'knowledge' | 'dev';

const TABS_AR: { id: TabId; label: string; icon: typeof MessageSquare; adminOnly?: boolean }[] = [
  { id: 'chat', label: 'محادثة الوكيل', icon: MessageSquare },
  { id: 'dashboard', label: 'لوحة التحكم والأمان', icon: LayoutDashboard, adminOnly: true },
  { id: 'knowledge', label: 'دليل الإجراءات', icon: BookOpen },
  { id: 'dev', label: 'الدعم البرمجي', icon: Bug },
];

const TABS_EN: { id: TabId; label: string; icon: typeof MessageSquare; adminOnly?: boolean }[] = [
  { id: 'chat', label: 'AI Agent Chat', icon: MessageSquare },
  { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, adminOnly: true },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'dev', label: 'Dev Support', icon: Bug },
];

type Props = {
  tab: TabId;
  onTab: (t: TabId) => void;
  online: boolean;
  onToggleOnline: () => void;
  onOpenSettings: () => void;
  onOpenDevFeedback: () => void;
  children: ReactNode;
};

export default function AppShell({
  tab,
  onTab,
  online,
  onToggleOnline,
  onOpenSettings,
  onOpenDevFeedback,
  children,
}: Props) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme, lang, toggleLang, dir } = useUI();
  const [mobileOpen, setMobileOpen] = useState(false);

  const TABS = lang === 'ar' ? TABS_AR : TABS_EN;
  // إخفاء التبويبات الخاصة بالإدارة عن الموظف العادي
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin(user));

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-slate-950' : 'bg-[#FAF9F6]';
  const sidebarBg = isDark ? 'bg-slate-900/80' : 'bg-white/80';
  const border = isDark ? 'border-slate-800' : 'border-slate-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardHover = isDark ? 'hover:bg-slate-800/60 hover:text-slate-200' : 'hover:bg-slate-100 hover:text-slate-700';
  const headerBg = isDark ? 'bg-slate-900/60' : 'bg-white/60';

  const t = lang === 'ar'
    ? {
        online: 'متصل', offline: 'غير متصل',
        devFeedback: 'إرسال ملاحظة للمطور', settings: 'الإعدادات', logout: 'خروج',
        admin: 'مدير', supervisor: 'مشرف', employee: 'موظف', developer: 'مطور',
        tagline: 'عمليات ذكية',
      }
    : {
        online: 'Online', offline: 'Offline',
        devFeedback: 'Send Feedback', settings: 'Settings', logout: 'Logout',
        admin: 'Admin', supervisor: 'Supervisor', employee: 'Employee', developer: 'Developer',
        tagline: 'Smart Ops',
      };

  return (
    <div dir={dir} className={`min-h-screen ${bg} ${text} flex`}>
      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative z-40 w-72 h-screen ${sidebarBg} backdrop-blur-xl border-${dir === 'rtl' ? 'l' : 'r'} ${border} flex flex-col transition-transform duration-300`}
      >
        <div className={`p-6 border-b ${border} flex items-center gap-3`}>
          <img src={LOGO_URL} alt="Prestoeat" className="w-10 h-10 rounded-xl object-cover ring-2 ring-orange-500/40" />
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-l from-[#FF6B00] to-[#FFB800] bg-clip-text text-transparent">بريستو</h1>
            <p className={`text-xs ${subtext}`}>{t.tagline}</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className={`lg:hidden mr-auto ${subtext}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleTabs.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => {
                  onTab(tb.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-l from-[#FF6B00]/20 to-transparent text-orange-500 border border-orange-500/30'
                    : `${subtext} ${cardHover}`
                }`}
              >
                <Icon className="w-5 h-5" />
                {tb.label}
              </button>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${border} space-y-2`}>
          <button
            onClick={onOpenDevFeedback}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm ${subtext} ${cardHover} transition`}
          >
            <Bug className="w-4 h-4" /> {t.devFeedback}
          </button>
          
          {/* إظهار زر الإعدادات للمشرفين والمدراء والمطورين فقط */}
          {isAdmin(user) && (
            <button
              onClick={onOpenSettings}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm ${subtext} ${cardHover} transition`}
            >
              <Settings className="w-4 h-4" /> {t.settings}
            </button>
          )}

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-red-500 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" /> {t.logout}
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`h-16 ${headerBg} backdrop-blur-xl border-b ${border} flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20`}>
          <button onClick={() => setMobileOpen(true)} className={`lg:hidden ${text}`}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Theme + Lang switchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-amber-600'} hover:scale-105 transition`}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleLang}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-orange-600'} hover:scale-105 transition`}
              title="Switch Language"
            >
              <span className="flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'EN' : 'ع'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 mr-auto lg:mr-0">
            <button
              onClick={onToggleOnline}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                online
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <CircleDot className={`w-3 h-3 ${online ? 'animate-pulse' : ''}`} />
              {online ? t.online : t.offline}
            </button>
            <div className="flex items-center gap-3">
              <div className={`text-${dir === 'rtl' ? 'left' : 'right'}`}>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className={`text-xs ${subtext}`} dir="ltr">{user?.email}</p>
              </div>
              <div className="relative">
                <img src={LOGO_URL} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-500/30" />
                <span className={`absolute -bottom-0.5 ${dir === 'rtl' ? '-left-0.5' : '-right-0.5'} w-3 h-3 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>
              <span className="hidden sm:inline-block text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {user?.role === 'developer' ? t.developer : user?.role === 'admin' ? t.admin : user?.role === 'supervisor' ? t.supervisor : t.employee}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export { LOGO_URL };