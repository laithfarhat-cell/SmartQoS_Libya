import { useState, useEffect } from 'react';
import {
  Cpu,
  MemoryStick,
  Activity,
  Users,
  Shield,
  Search,
  Trash2,
  Ban,
  ChevronUp,
  ChevronDown,
  Clock,
  ScrollText,
  Bug,
  CheckCircle2,
  XCircle,
  Gauge,
  UserCheck,
  UserX,
} from 'lucide-react';
import { supabase, type Employee, type AuditLog, type DevTicket } from '@/lib/supabase';
import { useAuth, isSuperAdmin } from '@/lib/auth';
import { useUI } from '@/lib/ui';

type GaugeData = { label: string; value: number; unit: string; icon: typeof Cpu; color: string };

export default function DashboardView() {
  const { user } = useAuth();
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'overview' | 'employees' | 'audit' | 'tickets'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<DevTicket[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [latencyTarget, setLatencyTarget] = useState(50);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(42));
  const [ramHistory, setRamHistory] = useState<number[]>(Array(20).fill(6.4));

  const [gauges, setGauges] = useState<GaugeData[]>([
    { label: lang === 'ar' ? 'استخدام المعالج' : 'CPU Usage', value: 42, unit: '%', icon: Cpu, color: 'text-orange-500' },
    { label: lang === 'ar' ? 'استخدام الذاكرة' : 'RAM Usage', value: 6.4, unit: 'GB', icon: MemoryStick, color: 'text-amber-500' },
    { label: lang === 'ar' ? 'زمن الاستجابة' : 'Latency', value: 38, unit: 'ms', icon: Activity, color: 'text-emerald-500' },
    { label: lang === 'ar' ? 'الجلسات النشطة' : 'Active Sessions', value: 127, unit: '', icon: Users, color: 'text-sky-500' },
  ]);

  const bg = isDark ? 'bg-slate-950' : 'bg-[#FAF9F6]';
  const cardBg = isDark ? 'bg-slate-900/60' : 'bg-white/80';
  const border = isDark ? 'border-slate-800' : 'border-slate-200';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200';

  const t = lang === 'ar'
    ? {
        health: 'درجة صحة النظام', operational: 'تشغيلي',
        overview: 'نظام', employeesTab: 'الموظفون', audit: 'سجل الأمان', tickets: 'تذاكر المطور',
        name: 'الاسم', email: 'البريد', role: 'الدور', status: 'الحالة', lastActive: 'آخر نشاط', actions: 'إجراءات',
        allRoles: 'كل الأدوار', empRole: 'موظف', supRole: 'مشرف', admRole: 'مدير', devRole: 'مطور',
        online: 'متصل', offline: 'غير متصل', promote: 'ترقية', demote: 'تخفيض', suspend: 'تعليق/تفعيل', delete: 'حذف',
        auditLog: 'سجل النشاط الأمني', noLogs: 'لا توجد سجلات بعد',
        noTickets: 'لا توجد تذاكر دعم بعد', resolve: 'حل', dismiss: 'رفض',
        resolved: 'تم الحل', dismissed: 'مرفوض', pending: 'قيد الانتظار', inProgress: 'قيد المعالجة',
        latencyControl: 'تحكم في زمن الاستجابة', target: 'الهدف', ms: 'مللي ثانية',
        onlineUsers: 'متصل', offlineUsers: 'غير متصل', usersBreakdown: 'توزيع المستخدمين',
        cpuChart: 'منحنى المعالج', ramChart: 'منحنى الذاكرة',
      }
    : {
        health: 'System Health Score', operational: 'Operational',
        overview: 'System', employeesTab: 'Employees', audit: 'Audit Log', tickets: 'Dev Tickets',
        name: 'Name', email: 'Email', role: 'Role', status: 'Status', lastActive: 'Last Active', actions: 'Actions',
        allRoles: 'All Roles', empRole: 'Employee', supRole: 'Supervisor', admRole: 'Admin', devRole: 'Developer',
        online: 'Online', offline: 'Offline', promote: 'Promote', demote: 'Demote', suspend: 'Suspend/Activate', delete: 'Delete',
        auditLog: 'Security Audit Log', noLogs: 'No logs yet',
        noTickets: 'No tickets yet', resolve: 'Resolve', dismiss: 'Dismiss',
        resolved: 'Resolved', dismissed: 'Dismissed', pending: 'Pending', inProgress: 'In Progress',
        latencyControl: 'Latency Throttle Control', target: 'Target', ms: 'ms',
        onlineUsers: 'Online', offlineUsers: 'Offline', usersBreakdown: 'Users Breakdown',
        cpuChart: 'CPU Trend', ramChart: 'RAM Trend',
      };

  useEffect(() => {
    loadEmployees();
    loadLogs();
    loadTickets();
    const interval = setInterval(() => {
      setGauges((g) =>
        g.map((x) => {
          if (x.unit === 'ms') {
            const newVal = Math.max(10, Math.round((latencyTarget + (Math.random() - 0.5) * 20) * 10) / 10);
            return { ...x, value: newVal };
          }
          return {
            ...x,
            value: Math.max(
              1,
              x.unit === '%'
                ? Math.round((x.value + (Math.random() - 0.5) * 12) * 10) / 10
                : x.unit === 'GB'
                ? Math.round((x.value + (Math.random() - 0.5) * 0.8) * 10) / 10
                : Math.round(x.value + (Math.random() - 0.5) * 20)
            ),
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [latencyTarget]);

  useEffect(() => {
    setCpuHistory((h) => [...h.slice(1), gauges[0].value]);
    setRamHistory((h) => [...h.slice(1), gauges[1].value]);
  }, [gauges]);

  async function loadEmployees() {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (data) setEmployees(data as Employee[]);
  }
  async function loadLogs() {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setLogs(data as AuditLog[]);
  }
  async function loadTickets() {
    const { data } = await supabase.from('dev_tickets').select('*').order('created_at', { ascending: false });
    if (data) setTickets(data as DevTicket[]);
  }

  async function logAction(action: string, targetEmail: string | null, details: string | null) {
    if (!user) return;
    await supabase.from('audit_logs').insert({
      action,
      actor_email: user.email,
      target_email: targetEmail,
      details,
    });
    loadLogs();
  }

  // التحكم بالصلاحيات وقواعد الترقية
  async function changeRole(emp: Employee, dir: 'up' | 'down') {
    if (!user) return;

    const isSupervisor = user.role === 'supervisor';
    const isAdminOrDev = user.role === 'admin' || user.role === 'developer' || isSuperAdmin(user);

    // منع المشرف من تعديل صلاحيات المدير أو المطور
    if (isSupervisor && (emp.role === 'admin' || emp.role === 'developer')) {
      alert(lang === 'ar' ? 'لا توجد لديك صلاحية لتعديل حساب مدير أو مطور' : 'No permission to modify admin/developer');
      return;
    }

    let newRole: Employee['role'] = emp.role;

    if (dir === 'up') {
      if (emp.role === 'employee') {
        newRole = 'supervisor';
      } else if (emp.role === 'supervisor') {
        if (!isAdminOrDev) {
          alert(lang === 'ar' ? 'المشرف لا يمكنه الترقية إلى مدير، هذه الصلاحية للمدير فقط' : 'Supervisors cannot promote to admin');
          return;
        }
        newRole = 'admin';
      }
    } else if (dir === 'down') {
      if (emp.role === 'admin') {
        if (!isAdminOrDev) {
          alert(lang === 'ar' ? 'لا توجد لديك صلاحية لتخفيض مدير' : 'No permission to demote admin');
          return;
        }
        newRole = 'supervisor';
      } else if (emp.role === 'supervisor') {
        newRole = 'employee';
      }
    }

    if (newRole === emp.role) return;

    await supabase.from('employees').update({ role: newRole }).eq('id', emp.id);
    await logAction(dir === 'up' ? (lang === 'ar' ? 'ترقية' : 'Promote') : (lang === 'ar' ? 'تخفيض' : 'Demote'), emp.email, `${emp.role} → ${newRole}`);
    loadEmployees();
  }

  async function toggleSuspend(emp: Employee) {
    if (user?.role === 'supervisor' && (emp.role === 'admin' || emp.role === 'developer')) {
      alert(lang === 'ar' ? 'لا توجد لديك صلاحية لتجميد حساب مدير أو مطور' : 'No permission');
      return;
    }
    await supabase.from('employees').update({ online: !emp.online }).eq('id', emp.id);
    await logAction(emp.online ? (lang === 'ar' ? 'تعليق الوصول' : 'Suspend') : (lang === 'ar' ? 'إعادة تفعيل' : 'Reactivate'), emp.email, null);
    loadEmployees();
  }

  async function deleteEmployee(emp: Employee) {
    if (!confirm(lang === 'ar' ? `تأكيد حذف حساب ${emp.name}؟` : `Confirm delete ${emp.name}?`)) return;
    await supabase.from('employees').delete().eq('id', emp.id);
    await logAction(lang === 'ar' ? 'حذف حساب' : 'Delete Account', emp.email, emp.name);
    loadEmployees();
  }

  async function updateTicketStatus(tk: DevTicket, status: DevTicket['status']) {
    await supabase.from('dev_tickets').update({ status }).eq('id', tk.id);
    await logAction(lang === 'ar' ? 'تحديث تذكرة' : 'Update Ticket', tk.user_email, `${tk.subject} → ${status}`);
    loadTickets();
  }

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.includes(search) || e.email.includes(search);
    const matchRole = roleFilter === 'all' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  const onlineCount = employees.filter((e) => e.online).length;
  const offlineCount = employees.length - onlineCount;

  const healthScore = Math.min(99.9, Math.max(80, 100 - gauges[0].value * 0.3 - gauges[1].value * 2));

  const TAB_LIST = [
    { id: 'overview' as const, label: t.overview, icon: Activity },
    { id: 'employees' as const, label: t.employeesTab, icon: Users },
    { id: 'audit' as const, label: t.audit, icon: Shield },
    { id: 'tickets' as const, label: t.tickets, icon: Bug },
  ];

  function MiniChart({ data, color, max }: { data: number[]; color: string; max: number }) {
    const w = 100;
    const h = 30;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${bg} p-4 lg:p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TAB_LIST.map((tb) => {
            const Icon = tb.icon;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition ${
                  tab === tb.id
                    ? 'bg-gradient-to-l from-[#FF6B00]/20 to-transparent text-orange-500 border border-orange-500/30'
                    : `${cardBg} ${subtext} border ${border} hover:text-slate-700`
                }`}
              >
                <Icon className="w-4 h-4" /> {tb.label}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-l from-[#FF6B00]/10 to-transparent border border-orange-500/20 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className={`text-sm ${subtext}`}>{t.health}</p>
                <p className="text-3xl font-bold text-emerald-500 mt-1">{healthScore.toFixed(1)}% {t.operational}</p>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke={isDark ? 'rgb(30,41,59)' : 'rgb(226,232,240)'} strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none" stroke="rgb(52,211,153)" strokeWidth="6"
                    strokeDasharray={`${(healthScore / 100) * 214} 214`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Gauges with charts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {gauges.map((g, i) => {
                const Icon = g.icon;
                const pct = g.unit === '%' ? g.value : g.unit === 'GB' ? (g.value / 16) * 100 : Math.min(100, g.value);
                return (
                  <div key={g.label} className={`${cardBg} backdrop-blur-xl border ${border} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${g.color}`} />
                      <span className={`text-xs ${subtext}`}>{g.label}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {g.value.toFixed(g.unit === 'GB' ? 1 : 0)} <span className={`text-sm ${subtext}`}>{g.unit}</span>
                    </p>
                    {i < 2 && (
                      <div className="mt-2">
                        <MiniChart data={i === 0 ? cpuHistory : ramHistory} color={i === 0 ? '#FF6B00' : '#F59E0B'} max={i === 0 ? 100 : 16} />
                      </div>
                    )}
                    <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Online/Offline counter + Latency control */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`${cardBg} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-sm">{t.usersBreakdown}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <UserCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-500">{onlineCount}</p>
                    <p className="text-xs text-emerald-400">{t.onlineUsers}</p>
                  </div>
                  <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3 text-center">
                    <UserX className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-slate-400">{offlineCount}</p>
                    <p className="text-xs text-slate-400">{t.offlineUsers}</p>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-sm">{t.latencyControl}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${subtext}`}>{t.target}: {latencyTarget} {t.ms}</span>
                    <span className="text-lg font-bold text-amber-500">{gauges[2].value.toFixed(0)} {t.ms}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={latencyTarget}
                    onChange={(e) => setLatencyTarget(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>10</span><span>100</span><span>200</span>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-sm">{t.cpuChart}</h3>
                </div>
                <MiniChart data={cpuHistory} color="#FF6B00" max={100} />
                <div className="mt-3">
                  <MemoryStick className="w-4 h-4 text-amber-500 inline mb-2" />
                  <span className={`text-xs ${subtext} mr-2`}>{t.ramChart}</span>
                  <MiniChart data={ramHistory} color="#F59E0B" max={16} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'employees' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className={`absolute ${lang === 'ar' ? 'right' : 'left'}-3 top-1/2 -translate-y-1/2 w-4 h-4 ${subtext}`} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                  className={`w-full ${inputBg} border rounded-2xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm focus:outline-none focus:border-orange-500/40`}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`${inputBg} border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/40`}
              >
                <option value="all">{t.allRoles}</option>
                <option value="employee">{t.empRole}</option>
                <option value="supervisor">{t.supRole}</option>
                <option value="admin">{t.admRole}</option>
              </select>
            </div>

            <div className={`${cardBg} border ${border} rounded-2xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                    <tr className={subtext}>
                      <th className="text-right p-3 font-medium text-xs">{t.name}</th>
                      <th className="text-right p-3 font-medium text-xs">{t.email}</th>
                      <th className="text-right p-3 font-medium text-xs">{t.role}</th>
                      <th className="text-right p-3 font-medium text-xs">{t.status}</th>
                      <th className="text-right p-3 font-medium text-xs">{t.lastActive}</th>
                      <th className="text-right p-3 font-medium text-xs">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const isDev = e.role === 'developer';
                      const isAdminRole = e.role === 'admin';
                      const isSupervisorRole = e.role === 'supervisor';
                      const currentUserIsSupervisor = user?.role === 'supervisor';

                      return (
                        <tr key={e.id} className={`border-t ${border} ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                          <td className="p-3 font-medium">{e.name}</td>
                          <td className={`p-3 ${subtext}`} dir="ltr">{e.email}</td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isDev ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : isAdminRole ? 'bg-orange-500/15 text-orange-500' : isSupervisorRole ? 'bg-sky-500/15 text-sky-500' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isDev ? t.devRole : isAdminRole ? t.admRole : isSupervisorRole ? t.supRole : t.empRole}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`flex items-center gap-1 text-xs ${e.online ? 'text-emerald-500' : subtext}`}>
                              <span className={`w-2 h-2 rounded-full ${e.online ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                              {e.online ? t.online : t.offline}
                            </span>
                          </td>
                          <td className={`p-3 text-xs ${subtext} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            {new Date(e.last_active).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {/* زر الترقية مع حظر المشرف من الترقية لأكثر من مشرف */}
                              <button
                                onClick={() => changeRole(e, 'up')}
                                disabled={isAdminRole || isDev || (currentUserIsSupervisor && isSupervisorRole)}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-emerald-500 disabled:opacity-30"
                                title={t.promote}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>

                              {/* زر التخفيض */}
                              <button
                                onClick={() => changeRole(e, 'down')}
                                disabled={e.role === 'employee' || isDev || (currentUserIsSupervisor && isAdminRole)}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-amber-500 disabled:opacity-30"
                                title={t.demote}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>

                              {/* زر التجميد */}
                              <button
                                onClick={() => toggleSuspend(e)}
                                disabled={currentUserIsSupervisor && (isAdminRole || isDev)}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-sky-500 disabled:opacity-30"
                                title={t.suspend}
                              >
                                <Ban className="w-4 h-4" />
                              </button>

                              {/* زر الحذف المخصص للمطور والمدير الأعلى فقط */}
                              {isSuperAdmin(user) && (
                                <button onClick={() => deleteEmployee(e)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500" title={t.delete}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className={`${cardBg} border ${border} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <ScrollText className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">{t.auditLog}</h3>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {logs.length === 0 ? (
                <p className={`${subtext} text-sm text-center py-8`}>{t.noLogs}</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className={`flex items-start gap-3 p-3 ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} rounded-xl border ${border}`}>
                    <Shield className={`w-4 h-4 ${subtext} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{l.action}</p>
                      {l.details && <p className={`text-xs ${subtext} mt-0.5`}>{l.details}</p>}
                      <p className={`text-xs ${subtext} mt-1`} dir="ltr">
                        {l.actor_email} {l.target_email ? `→ ${l.target_email}` : ''} • {new Date(l.created_at).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'tickets' && (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className={`text-center py-20 ${subtext}`}>
                <Bug className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{t.noTickets}</p>
              </div>
            ) : (
              tickets.map((tk) => (
                <div key={tk.id} className={`${cardBg} border ${border} rounded-2xl p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{tk.subject}</p>
                      <p className={`text-xs ${subtext} mt-1`}>{tk.message}</p>
                      <p className={`text-xs ${subtext} mt-2`} dir="ltr">{tk.user_name} • {tk.user_email} • {new Date(tk.created_at).toLocaleString(lang === 'ar' ? 'ar-LY' : 'en')}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {tk.status === 'open' ? (
                        <>
                          <button onClick={() => updateTicketStatus(tk, 'in_progress')} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-medium" title={t.inProgress}>
                            {t.inProgress}
                          </button>
                          <button onClick={() => updateTicketStatus(tk, 'resolved')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" title={t.resolve}>
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateTicketStatus(tk, 'dismissed')} className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600" title={t.dismiss}>
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tk.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-500' : tk.status === 'in_progress' ? 'bg-amber-500/15 text-amber-500' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tk.status === 'resolved' ? t.resolved : tk.status === 'in_progress' ? t.inProgress : t.dismissed}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}