import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

export type UserRole = 'employee' | 'supervisor' | 'admin' | 'developer';

export type SessionUser = {
  email: string;
  name: string;
  role: UserRole;
};

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const SESSION_KEY = 'prestoeat_session';

export const DEVELOPER_EMAILS = ['l.farhat@prestoeat.com', 'laitfarhat@gmail.com'];

export function isDeveloperEmail(email: string): boolean {
  return DEVELOPER_EMAILS.includes(email.trim().toLowerCase());
}

export const isSuperAdminEmail = isDeveloperEmail;

// دالة إرسال الرمز لبريد الموظف عبر Supabase
export async function sendOTPToEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
  });

  if (error) {
    console.error('خطأ إرسال البريد الإلكتروني:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed: SessionUser = JSON.parse(raw);
          await syncUserWithDb(parsed);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function syncUserWithDb(u: SessionUser): Promise<SessionUser> {
    try {
      const cleanEmail = u.email.trim().toLowerCase();
      const isDevDefault = isDeveloperEmail(cleanEmail);

      const { data } = await supabase
        .from('employees')
        .select('id, role, name')
        .eq('email', cleanEmail)
        .maybeSingle();

      let finalRole: UserRole = isDevDefault ? 'developer' : u.role;
      let finalName = isDevDefault ? 'ليث فرحات' : u.name;

      if (data) {
        // الاعتماد على البيانات المسجلة في جدول الموظفين للسماح بالتعديل
        finalRole = (data.role as UserRole) || finalRole;
        finalName = data.name || finalName;

        await supabase
          .from('employees')
          .update({
            status: 'online',
            online: true,
            last_active: new Date().toISOString(),
          })
          .eq('email', cleanEmail);
      } else {
        // إدراج الموظف في أول دخول
        await supabase.from('employees').insert({
          name: finalName,
          email: cleanEmail,
          role: finalRole,
          status: 'online',
          online: true,
          last_active: new Date().toISOString(),
        });
      }

      const updatedUser: SessionUser = {
        email: cleanEmail,
        name: finalName,
        role: finalRole,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch {
      return u;
    }
  }

  async function refreshUser() {
    if (!user) return;
    await syncUserWithDb(user);
  }

  function signIn(u: SessionUser) {
    const cleanEmail = u.email.trim().toLowerCase();
    const isDev = isDeveloperEmail(cleanEmail);
    const initialUser: SessionUser = {
      ...u,
      email: cleanEmail,
      name: isDev ? 'ليث فرحات' : u.name,
      role: isDev ? 'developer' : u.role,
    };

    syncUserWithDb(initialUser);
  }

  // إرسال الرمز للبريد
  async function sendOTP(email: string) {
    return await sendOTPToEmail(email);
  }

  // التحقق من الرمز المدخل وتسجيل الدخول
  async function verifyOTP(email: string, token: string) {
    const cleanEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      console.error('رمز التحقق غير صحيح:', error.message);
      return { success: false, error: 'رمز التحقق غير صحيح أو انتهت صلاحيته' };
    }

    const isDev = isDeveloperEmail(cleanEmail);
    const tempUser: SessionUser = {
      email: cleanEmail,
      name: isDev ? 'ليث فرحات' : cleanEmail.split('@')[0],
      role: isDev ? 'developer' : 'employee',
    };

    await syncUserWithDb(tempUser);
    return { success: true };
  }

  function signOut() {
    if (user) {
      supabase
        .from('employees')
        .update({ status: 'offline', online: false })
        .eq('email', user.email)
        .then();
    }
    supabase.auth.signOut().then();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser, sendOTP, verifyOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isDeveloper(u: SessionUser | null): boolean {
  return !!u && (u.role === 'developer' || isDeveloperEmail(u.email));
}

export function isAdmin(u: SessionUser | null): boolean {
  return !!u && (u.role === 'admin' || u.role === 'supervisor' || isDeveloper(u));
}

export function isSuperAdmin(u: SessionUser | null): boolean {
  return isDeveloper(u);
}