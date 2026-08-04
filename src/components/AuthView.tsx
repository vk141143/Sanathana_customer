import React, { useState } from 'react';
import { UserProfile, NavTab } from '../types';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
} from '../lib/firebase';
import { supabase } from '../lib/supabase';

interface AuthViewProps {
  onSignInSuccess: (user: Partial<UserProfile>) => void;
  onTabChange: (tab: NavTab) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'google-complete';

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export const AuthView: React.FC<AuthViewProps> = ({ onSignInSuccess, onTabChange }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingGoogleCred, setPendingGoogleCred] = useState<{ uid: string; email: string; avatar: string } | null>(null);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const saveUserToSupabase = async (firebaseUid: string, name: string, userEmail: string, userMobile: string) => {
    const { error } = await supabase.from('users').upsert({
      firebase_uid: firebaseUid,
      full_name: name,
      email: userEmail,
      mobile: userMobile,
    }, { onConflict: 'firebase_uid' });
    if (error) console.error('Supabase save error:', error.message);
  };

  const getUserFromSupabase = async (firebaseUid: string) => {
    const { data } = await supabase
      .from('users')
      .select('full_name, email, mobile, avatar_url, day_streak, books_read, events_count, chant_count')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();
    return data;
  };

  // ── REGISTER ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!mobile.match(/^[0-9]{10}$/)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await saveUserToSupabase(cred.user.uid, fullName, email, mobile);
      setSuccessMsg('Account created! Please check your email to verify your account, then sign in.');
      setMode('login');
      setFullName(''); setEmail(''); setMobile(''); setPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Registration failed.';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    }
    setLoading(false);
  };

  // ── LOGIN ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setError('Please verify your email before signing in. Check your inbox.');
        setLoading(false);
        return;
      }
      const profile = await getUserFromSupabase(cred.user.uid);
      onSignInSuccess({
        name: profile?.full_name || cred.user.displayName || 'Seeker',
        email: cred.user.email || email,
        isLoggedIn: true,
        dayStreak: profile?.day_streak || 0,
        booksRead: profile?.books_read || 0,
        eventsCount: profile?.events_count || 0,
        chantCount: profile?.chant_count || 108,
        avatar: profile?.avatar_url || '',
      });
      onTabChange('home');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Login failed.';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    }
    setLoading(false);
  };

  // ── GOOGLE SIGN IN ──
  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const existing = await getUserFromSupabase(user.uid);
      if (existing?.mobile) {
        onSignInSuccess({
          name: existing.full_name || user.displayName || 'Seeker',
          email: user.email || '',
          avatar: existing.avatar_url || user.photoURL || '',
          isLoggedIn: true,
          dayStreak: existing.day_streak || 0,
          booksRead: existing.books_read || 0,
          eventsCount: existing.events_count || 0,
          chantCount: existing.chant_count || 108,
        });
        onTabChange('home');
      } else {
        setPendingGoogleCred({ uid: user.uid, email: user.email || '', avatar: user.photoURL || '' });
        setFullName(user.displayName || '');
        setMobile('');
        setMode('google-complete');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Google sign-in failed.';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    }
    setLoading(false);
  };

  // ── GOOGLE COMPLETE PROFILE ──
  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    if (!mobile.match(/^[0-9]{10}$/)) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (!pendingGoogleCred) return;
    setLoading(true);
    try {
      await saveUserToSupabase(pendingGoogleCred.uid, fullName, pendingGoogleCred.email, mobile);
      onSignInSuccess({
        name: fullName,
        email: pendingGoogleCred.email,
        avatar: pendingGoogleCred.avatar,
        isLoggedIn: true,
        dayStreak: 0,
        booksRead: 0,
        eventsCount: 0,
        chantCount: 108,
      });
      onTabChange('home');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to save profile.';
      setError(msg);
    }
    setLoading(false);
  };

  // ── FORGOT PASSWORD ──
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to send reset email.';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    }
    setLoading(false);
  };

  const inputClass = "bg-transparent border-none outline-none focus:ring-0 w-full text-sm text-[#e5e2e1] placeholder:text-[#d2c4b3]/40";
  const fieldClass = "relative border-b border-[#4e4539]/40 focus-within:border-[#f2c377] transition-all py-2.5";
  const iconClass = "w-5 h-5 text-[#f2c377]/60 shrink-0";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] relative overflow-x-hidden flex flex-col justify-center items-center px-5 py-10">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-sm opacity-30"
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCAX860SnS8qk21-r8Fx7q4ahjrSLs3ofpUYRJ7K-xvI33MIRR6Rmt1vGvL2S_8vEpR0OkzzWztNjzT0DioZqCcrY_HxXjbIVLtPNqcVSBOaJwRaamQqfWSyEjI-anj20jwIokGpK5t6XUuOPBmu-QxBbMJCHNBJODL-95VWRlHC9XFsgcCzNdEz75n_ZGh1-uHEAfFXlCMcdlR5LmrELabU1r2qy-lACg5I8XEu58GRAX6uWa-POGecyIvZQW6YrMnFL4QURYXpOo')` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.9)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Branding */}
        <header className="text-center mb-7">
          <div className="text-5xl text-[#f2c377] leading-none mb-2 om-symbol select-none font-sanskrit">ॐ</div>
          <h1 className="font-cinzel text-2xl tracking-[0.3em] text-[#f2c377] uppercase font-bold">SANATANA</h1>
          <p className="font-label-sm text-[10px] text-[#e7c680]/70 tracking-[0.2em] uppercase mt-0.5">Eternal Wisdom. Timeless Truth.</p>
          <div className="mt-5">
            <h2 className="font-garamond text-xl text-[#e5e2e1] font-bold">
              {mode === 'login' && 'Welcome Back, Seeker'}
              {mode === 'register' && 'Begin Your Sacred Journey'}
              {mode === 'forgot' && 'Reset Your Password'}
              {mode === 'google-complete' && 'Complete Your Profile'}
            </h2>
            <p className="text-xs text-[#d2c4b3]/70 mt-1">
              {mode === 'login' && 'Sign in to continue your spiritual path.'}
              {mode === 'register' && 'Create your account to access timeless wisdom.'}
              {mode === 'forgot' && 'Enter your email to receive a reset link.'}
              {mode === 'google-complete' && 'Just a few more details to get started.'}
            </p>
          </div>
        </header>

        {/* Card */}
        <div className="glass-panel p-6">

          {/* Error / Success */}
          {error && (
            <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 px-4 py-2.5 bg-[#f2c377]/10 border border-[#f2c377]/30 rounded-lg text-[#f2c377] text-xs">
              {successMsg}
            </div>
          )}

          {/* ── GOOGLE COMPLETE PROFILE FORM ── */}
          {mode === 'google-complete' && (
            <form onSubmit={handleGoogleComplete} className="space-y-1">
              <p className="text-xs text-[#d2c4b3]/60 mb-4">Almost there! Please confirm your details to complete sign-in.</p>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className={inputClass} />
                </div>
              </div>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  <input type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile Number (10 digits)" maxLength={10} className={inputClass} />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="gold-button w-full h-12 rounded-xl font-label-sm text-[#432c00] font-bold uppercase tracking-widest text-xs disabled:opacity-50">
                  {loading ? 'Saving...' : 'Complete Sign In'}
                </button>
              </div>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setMode('login'); clearMessages(); setPendingGoogleCred(null); }} className="text-xs text-[#f2c377]/70 hover:text-[#f2c377]">
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-1">
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className={inputClass} />
                </div>
              </div>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className={inputClass} />
                </div>
              </div>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  <input type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile Number (10 digits)" maxLength={10} className={inputClass} />
                </div>
              </div>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className={inputClass} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#d2c4b3]/50 hover:text-[#f2c377]">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className={inputClass} />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="gold-button w-full h-12 rounded-xl font-label-sm text-[#432c00] font-bold uppercase tracking-widest text-xs disabled:opacity-50">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-1">
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className={inputClass} />
                </div>
              </div>
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={inputClass} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#d2c4b3]/50 hover:text-[#f2c377]">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <div className="text-right pt-1">
                <button type="button" onClick={() => { setMode('forgot'); clearMessages(); }} className="text-[10px] text-[#f2c377]/70 hover:text-[#f2c377] transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="pt-3">
                <button type="submit" disabled={loading} className="gold-button w-full h-12 rounded-xl font-label-sm text-[#432c00] font-bold uppercase tracking-widest text-xs disabled:opacity-50">
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* ── FORGOT PASSWORD FORM ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-1">
              <div className={fieldClass}>
                <div className="flex items-center gap-3 px-1">
                  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your Email Address" className={inputClass} />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="gold-button w-full h-12 rounded-xl font-label-sm text-[#432c00] font-bold uppercase tracking-widest text-xs disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setMode('login'); clearMessages(); }} className="text-xs text-[#f2c377]/70 hover:text-[#f2c377]">
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ── GOOGLE SIGN IN (login + register only) ── */}
          {mode !== 'forgot' && mode !== 'google-complete' && (
            <>
              <div className="flex items-center gap-3 my-5 opacity-50">
                <div className="h-px flex-grow bg-[#f2c377]" />
                <span className="text-[#f2c377] text-xs">or</span>
                <div className="h-px flex-grow bg-[#f2c377]" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full h-11 rounded-xl border border-[#f2c377]/30 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-sm font-semibold text-[#e5e2e1] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* ── TOGGLE LOGIN / REGISTER ── */}
          {mode !== 'forgot' && mode !== 'google-complete' && (
            <p className="text-center text-xs text-[#d2c4b3]/60 mt-5">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearMessages(); }}
                className="text-[#f2c377] font-bold hover:underline"
              >
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          )}

          <p className="text-center font-label-sm text-[10px] text-[#d2c4b3]/40 mt-4">
            By continuing, you agree to our{' '}
            <span className="text-[#e7c680]/60 underline cursor-pointer">Terms</span>
            {' '}•{' '}
            <span className="text-[#e7c680]/60 underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};
