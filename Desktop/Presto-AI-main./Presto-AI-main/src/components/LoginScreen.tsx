import { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Lock, ArrowLeft, KeyRound, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { isValidCorporateEmail } from '@/lib/security';

const LOGO_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTmgBhcqC9M317SMZaLHOFgxRDjIFpsl5emeWX0cM0_0UxwRppRG_37EuA&s=10';

type Step = 'email' | 'otp';

export default function LoginScreen() {
  const { sendOTP, verifyOTP } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [banner, setBanner] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  // قبول الإيميل المعتمد لشركة بريستو وإيميلات المطورين
  function isAllowedEmail(e: string) {
    const clean = e.trim().toLowerCase();
    if (clean === 'laitfarhat@gmail.com') return true;
    return isValidCorporateEmail(clean);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (lockUntil && now < lockUntil) {
      setError('الحساب مقفل مؤقتاً. انتظر انتهاء المدة.');
      return;
    }

    if (!isAllowedEmail(email)) {
      setError('يجب استعمال بريد إلكتروني رسمي ينتهي بـ @prestoeat.com');
      return;
    }

    setLoading(true);
    const res = await sendOTP(email);
    setLoading(false);

    if (res.success) {
      setExpiresAt(Date.now() + 300_000); // صلاحية الرمز 5 دقائق
      setResendAt(Date.now() + 60_000);   // إمكانية إعاده الإرسال بعد 60 ثانية
      setBanner(`تم إرسال رمز التحقق بصلب البريد الإلكتروني: ${email}`);
      setTimeout(() => setBanner(null), 6000);
      setStep('otp');
    } else {
      setError(res.error || 'تعذر إرسال رمز التحقق. يرجى التأكد من البريد والمحاولة مجدداً.');
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (expiresAt && now > expiresAt) {
      setError('انتهت صلاحية الرمز. أعد إرسال رمز جديد.');
      return;
    }

    setLoading(true);
    const res = await verifyOTP(email, otp);
    setLoading(false);

    if (!res.success) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 3) {
        setLockUntil(Date.now() + 300_000);
        setError('تجاوزت 3 محاولات خاطئة. تم قفل الحساب لمدة 5 دقائق.');
        setAttempts(0);
      } else {
        setError(res.error || `رمز غير صحيح. المحاولات المتبقية: ${3 - next}`);
      }
    }
  }

  async function resendOtp() {
    if (resendAt && now < resendAt) return;
    setError('');
    setLoading(true);
    const res = await sendOTP(email);
    setLoading(false);

    if (res.success) {
      setOtp('');
      setExpiresAt(Date.now() + 300_000);
      setResendAt(Date.now() + 60_000);
      setBanner(`تمت إعادة إرسال رمز التحقق إلى صندوق البريد الإلكتروني`);
      setTimeout(() => setBanner(null), 5000);
    } else {
      setError(res.error || 'فشلت عملية إعادة الإرسال.');
    }
  }

  const lockRemaining = lockUntil && now < lockUntil ? Math.ceil((lockUntil - now) / 1000) : 0;
  const otpRemaining = expiresAt && now < expiresAt ? Math.ceil((expiresAt - now) / 1000) : 0;
  const resendRemaining = resendAt && now < resendAt ? Math.ceil((resendAt - now) / 1000) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية جمالية */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      {banner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur-xl border border-orange-500/40 rounded-2xl px-6 py-4 shadow-2xl animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">{banner}</span>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img src={LOGO_URL} alt="Prestoeat" className="w-20 h-20 rounded-2xl object-cover mb-4 ring-2 ring-orange-500/40" />
            <h1 className="text-2xl font-bold bg-gradient-to-l from-[#FF6B00] to-[#FFB800] bg-clip-text text-transparent">بريستو</h1>
            <p className="text-sm text-slate-400 mt-1">منصة العمليات الذكية</p>
          </div>

          {lockRemaining > 0 && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center text-red-300 text-sm">
              الحساب مقفل. الوقت المتبقي: {Math.floor(lockRemaining / 60)}:{(lockRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الرسمي @prestoeat.com"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition disabled:opacity-50"
                  dir="ltr"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={lockRemaining > 0 || loading || !email.trim()}
                className="w-full bg-gradient-to-l from-[#FF6B00] to-[#FF8800] hover:from-[#FF7B10] hover:to-[#FF9900] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    إرسال رمز التحقق للبريد
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-slate-400 text-sm flex items-center gap-1 hover:text-slate-200 mb-2"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" /> تغيير البريد
              </button>

              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 text-center text-sm text-slate-300">
                أدخل رمز OTP الذي وصلك عبر البريد: <br />
                <span className="text-orange-400 font-medium" dir="ltr">{email}</span>
              </div>

              <div className="relative">
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  disabled={loading}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl pr-11 pl-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition disabled:opacity-50"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className={otpRemaining < 30 ? 'text-red-400' : ''}>
                  {otpRemaining > 0 ? `ينتهي الرمز خلال ${otpRemaining}ث` : 'انتهت الصلاحية'}
                </span>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendRemaining > 0 || loading}
                  className="flex items-center gap-1 text-orange-400 hover:text-orange-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {resendRemaining > 0 ? `إعادة إرسال (${resendRemaining}ث)` : 'إعادة إرسال للبريد'}
                </button>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={lockRemaining > 0 || otpRemaining <= 0 || loading || otp.length < 6}
                className="w-full bg-gradient-to-l from-[#FF6B00] to-[#FF8800] hover:from-[#FF7B10] hover:to-[#FF9900] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    تأكيد الدخول
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> محمي بنظام OTP بريدي وتشفير كامل
          </p>
        </div>
      </div>
    </div>
  );
}