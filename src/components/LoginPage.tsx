import React, { useState } from 'react';
import { AuthUser } from '../types';
import { Sparkles, Lock, Mail, ArrowRight, User, Eye, EyeOff, ShieldCheck, GraduationCap } from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface LoginPageProps {
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token?: string) => void;
  onBackToDiscover: () => void;
  onNavigateToAdminLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onBackToDiscover,
  onNavigateToAdminLogin
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (data.success && data.user) {
        fireCelebrationConfetti();
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.message || 'Google authentication failed');
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      // If user closed popup, don't show an intrusive error
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Could not complete Google Sign-In. You can sign in using your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'signin'
      ? { email, password }
      : { name: name || 'Student Builder', email, university: university || 'University in India', password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.user) {
        fireCelebrationConfetti();
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.message || 'Authentication failed');
      }
    } catch (err) {
      setErrorMsg('Could not connect to Workvanta private login service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 sm:px-6 animate-in fade-in duration-300">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[550px] h-[550px] bg-gradient-to-tr from-[#7C6CF0]/10 to-[#FF8A65]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        
        {/* Card Header & Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] text-white shadow-md mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF] tracking-tight">
            {mode === 'signin' ? 'Welcome to Workvanta' : 'Create Private Student Account'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6880] dark:text-[#A5A0BA] max-w-sm mx-auto">
            {mode === 'signin'
              ? 'Private, secure access to your remote internships across India.'
              : 'Sign up confidentially. Your identity and applications remain private.'}
          </p>
        </div>

        {/* Surface Container */}
        <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] p-6 sm:p-8 cozy-card-shadow space-y-6">
          
          {/* Sign In vs Register Toggle */}
          <div className="flex p-1 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-[#26223A] text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs'
                  : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#26223A] text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs'
                  : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
              }`}
            >
              New Account
            </button>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center gap-2.5 text-xs text-[#006949] dark:text-[#5EE3B0]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#34D399]" />
            <span className="font-medium">
              100% Confidential: Other users cannot see your profile or login status.
            </span>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Google One-Click Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 dark:border-[#3D3759] text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#FFF8F0] dark:hover:bg-[#2F2945] transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#7C6CF0]/15 dark:border-[#3D3759] w-full" />
            <span className="bg-white dark:bg-[#26223A] px-3 text-[11px] font-medium text-[#6B6880] dark:text-[#A5A0BA] shrink-0">
              or continue with student email
            </span>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priyanshu Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    College / University (in India or Global)
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="e.g. IIT Delhi, BITS Pilani, NIT Trichy"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com or student@college.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your private password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#6B6880] hover:text-[#2D2A3E]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C6CF0] focus:ring-[#7C6CF0]"
              />
              <label htmlFor="remember" className="text-xs text-[#6B6880] dark:text-[#A5A0BA] cursor-pointer">
                Keep my session private on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Entering Workvanta...' : mode === 'signin' ? 'Sign In to Workvanta' : 'Create Private Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex flex-col items-center gap-1.5 text-center">
            <div className="text-[10px] text-[#6B6880] dark:text-[#A5A0BA] flex items-center justify-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              <span>Token-based session auth with salted scrypt key hashing & private data isolation</span>
            </div>
          </div>

        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onBackToDiscover}
            className="w-full py-2.5 rounded-full text-xs font-bold border border-[#7C6CF0]/20 dark:border-[#3D3759] bg-white/50 dark:bg-[#26223A]/50 hover:bg-white dark:hover:bg-[#26223A] text-[#2D2A3E] dark:text-[#F2EEFF] transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Explore Remote Directory Without Logging In (Guest Preview)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#7C6CF0]" />
          </button>

          {onNavigateToAdminLogin && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToAdminLogin}
                className="text-[11px] font-mono text-[#6B6880]/70 dark:text-[#A5A0BA]/70 hover:text-[#7C6CF0] dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3 h-3" />
                <span>Workvanta Staff & Admissions Portal →</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
