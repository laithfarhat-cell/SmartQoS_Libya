import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, isAdmin } from '@/lib/auth';
import { UIProvider } from '@/lib/ui';
import AppShell, { type TabId } from '@/components/AppShell';
import LoginScreen from '@/components/LoginScreen';
import ChatView from '@/components/ChatView';
import DashboardView from '@/components/DashboardView';
import KnowledgeView from '@/components/KnowledgeView';
import DevView from '@/components/DevView';
import SettingsModal from '@/components/SettingsModal';
import DevFeedbackModal from '@/components/DevFeedbackModal';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, refreshUser } = useAuth();
  const [tab, setTab] = useState<TabId>('chat');
  const [online, setOnline] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devFeedbackOpen, setDevFeedbackOpen] = useState(false);

  useEffect(() => {
    if (user && !isAdmin(user) && tab === 'dashboard') {
      setTab('chat');
    }
  }, [user, tab]);

  async function toggleOnline() {
    const next = !online;
    setOnline(next);
    if (user) {
      await supabase.from('employees').update({ online: next, last_active: new Date().toISOString() }).eq('email', user.email);
      refreshUser();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <>
      <AppShell
        tab={tab}
        onTab={setTab}
        online={online}
        onToggleOnline={toggleOnline}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDevFeedback={() => setDevFeedbackOpen(true)}
      >
        {tab === 'chat' && <ChatView />}
        {tab === 'dashboard' && isAdmin(user) && <DashboardView />}
        {tab === 'knowledge' && <KnowledgeView />}
        {tab === 'dev' && <DevView />}
      </AppShell>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {devFeedbackOpen && <DevFeedbackModal onClose={() => setDevFeedbackOpen(false)} />}
    </>
  );
}

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </UIProvider>
  );
}
