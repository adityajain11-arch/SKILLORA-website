import React, { useState, useRef, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  animate,
} from 'motion/react';
import { AuthUser } from '../types';
import {
  Lock,
  Mail,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  Volume2,
  VolumeX,
  Sun,
  X,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { syncFirebaseUserProfile } from '../lib/firestore-sync';

interface LoginPageProps {
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token?: string) => void;
  onBackToDiscover: () => void;
  onNavigateToAdminLogin?: () => void;
}

function playLampChainSound(turnOn: boolean, muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tactile brass pull-chain click transient
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(turnOn ? 920 : 620, now);
    clickOsc.frequency.exponentialRampToValueAtTime(160, now + 0.045);
    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.055);

    if (turnOn) {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(523.25, now + 0.04);
      chimeOsc.frequency.exponentialRampToValueAtTime(659.25, now + 0.26);
      chimeGain.gain.setValueAtTime(0.001, now + 0.04);
      chimeGain.gain.linearRampToValueAtTime(0.09, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 0.04);
      chimeOsc.stop(now + 0.46);
    }

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
    // Ignore audio context restriction errors
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToDiscover,
  onNavigateToAdminLogin,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Lamp & Pop-Up Login Modal State
  const [lampOn, setLampOn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [curtainsParted, setCurtainsParted] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Framer Motion spring-driven rope physics
  const pullY = useMotionValue(0);
  const smoothPullY = useSpring(pullY, { stiffness: 360, damping: 20, mass: 0.85 });
  const cordEndY = useTransform(smoothPullY, (v) => 208 + v);
  const shadeTiltDeg = useTransform(smoothPullY, [0, 88], [0, 7]);
  const preGlowOpacity = useTransform(smoothPullY, [0, 44], [0, 0.85]);

  const didLatchOnDragRef = useRef(false);
  const isDraggingRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);
  const curtainTimerRef = useRef<number | null>(null);

  // Auth Form State
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const PULL_THRESHOLD = 38;

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (curtainTimerRef.current) window.clearTimeout(curtainTimerRef.current);
    };
  }, []);

  const openLoginPopup = (animateTug = false) => {
    if (animateTug && !prefersReducedMotion) {
      animate(pullY, 54, {
        duration: 0.14,
        ease: 'easeOut',
        onComplete: () => {
          animate(pullY, 0, { type: 'spring', stiffness: 400, damping: 18 });
        },
      });
    }

    setLampOn(true);
    playLampChainSound(true, soundMuted);
    setCurtainsParted(false);

    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (curtainTimerRef.current) window.clearTimeout(curtainTimerRef.current);

    // Light blooms briefly, then centered login dialog pops up and parts its curtains
    openTimerRef.current = window.setTimeout(
      () => {
        setShowLoginModal(true);
        curtainTimerRef.current = window.setTimeout(() => {
          setCurtainsParted(true);
        }, prefersReducedMotion ? 20 : 120);
      },
      prefersReducedMotion ? 40 : 220
    );
  };

  const closeLoginPopup = () => {
    setCurtainsParted(false);
    setShowLoginModal(false);
    setLampOn(false);
    playLampChainSound(false, soundMuted);
  };

  const handleRopeTrigger = (animateTug = false) => {
    if (showLoginModal || lampOn) {
      closeLoginPopup();
    } else {
      openLoginPopup(animateTug);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      try {
        await syncFirebaseUserProfile(result.user);
      } catch (syncErr) {
        console.warn('Firestore profile sync warning:', syncErr);
      }
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
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
    const payload =
      mode === 'signin'
        ? { email, password }
        : {
            name: name || 'Student Builder',
            email,
            university: university || 'University in India',
            password,
          };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.user) {
        fireCelebrationConfetti();
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.message || 'Authentication failed');
      }
    } catch {
      setErrorMsg('Could not connect to Workvanta private login service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* CENTERED PULL-ROPE LAMP STAGE (No login box rendered below the lamp) */}
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative min-h-[76vh] rounded-[2rem] overflow-hidden transition-colors duration-700 border flex flex-col justify-between ${
          lampOn
            ? 'bg-[#1a162b] border-[#ffcf87]/40 shadow-2xl'
            : 'bg-[#0c0a16] border-[#2d2747] shadow-2xl'
        }`}
      >
        {/* Warm Ambient Spotlight Radial Overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: lampOn ? 1 : 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(255, 206, 128, 0.28) 0%, rgba(124, 108, 240, 0.14) 42%, rgba(12, 10, 22, 0) 75%)',
          }}
        />

        {/* Top Studio Controls Bar */}
        <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 pt-5">
          <div className="flex items-center gap-2.5 text-xs text-[#a5a0ba]">
            <span className="font-semibold text-[#f2eeff]">Workvanta Study Desk</span>
            <span aria-hidden="true">·</span>
            <span>{lampOn ? 'Lamp Lit — Sign-In Open' : 'Pull the rope to enter'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundMuted((m) => !m)}
              aria-label={soundMuted ? 'Unmute switch sound' : 'Mute switch sound'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#c4b8ff] transition-colors cursor-pointer"
              title={soundMuted ? 'Unmute switch click' : 'Mute switch click'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleRopeTrigger(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                lampOn
                  ? 'bg-[#ffcf87]/15 border-[#ffcf87]/40 text-[#ffe4b8]'
                  : 'bg-[#7c6cf0]/20 border-[#7c6cf0]/45 text-[#d8d0ff] hover:bg-[#7c6cf0]/30'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{lampOn ? 'Turn Off Lamp' : 'Pull Rope'}</span>
            </button>
          </div>
        </div>

        {/* Centered Interactive Pull-Rope Lamp */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-5">
          <div className="relative w-full max-w-[330px] select-none">
            <svg
              viewBox="0 0 320 380"
              className="w-full h-auto overflow-visible touch-none"
              role="img"
              aria-label="Interactive pull-rope studio lamp"
            >
              <defs>
                <linearGradient id="lampBeamGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                  <stop offset="0%" stopColor="#ffe2a8" stopOpacity={0.55} />
                  <stop offset="65%" stopColor="#ffb454" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#ffb454" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="shadeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={lampOn ? '#43386b' : '#25203b'} />
                  <stop offset="100%" stopColor={lampOn ? '#272044' : '#151224'} />
                </linearGradient>

                <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b9833a" />
                  <stop offset="50%" stopColor="#f2cb80" />
                  <stop offset="100%" stopColor="#9c6a27" />
                </linearGradient>

                <radialGradient id="bulbGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff7e0" />
                  <stop offset="60%" stopColor="#ffbe5c" />
                  <stop offset="100%" stopColor="#ff8a47" stopOpacity="0" />
                </radialGradient>
              </defs>

              <motion.circle
                cx="162"
                cy="166"
                r={lampOn ? 88 : 48}
                fill="url(#bulbGlowGrad)"
                animate={{ opacity: lampOn ? 0.48 : 0 }}
                transition={{ duration: 0.45 }}
              />

              <motion.ellipse
                cx="162"
                cy="346"
                animate={{
                  rx: lampOn ? 132 : 82,
                  fill: lampOn ? 'rgba(255, 206, 128, 0.24)' : 'rgba(124, 108, 240, 0.08)',
                }}
                ry="16"
                transition={{ duration: 0.55 }}
              />
              <rect x="24" y="344" width="272" height="6" rx="3" fill="#2c2647" />

              <motion.polygon
                points="116,162 208,162 288,344 36,344"
                fill="url(#lampBeamGrad)"
                animate={{ opacity: lampOn ? 1 : 0 }}
                transition={{ duration: 0.45 }}
              />

              <path
                d="M 118 344 L 206 344 L 194 330 L 130 330 Z"
                fill="#221d38"
                stroke="url(#brassGrad)"
                strokeWidth="1.5"
              />
              <rect x="148" y="318" width="28" height="12" rx="4" fill="url(#brassGrad)" />
              <path
                d="M 162 318 L 162 110 Q 162 66 192 66 Q 212 66 212 86"
                fill="none"
                stroke="#2c2647"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 162 318 L 162 110 Q 162 66 192 66 Q 212 66 212 86"
                fill="none"
                stroke="url(#brassGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <motion.g
                style={{
                  rotate: prefersReducedMotion ? 0 : shadeTiltDeg,
                  originX: '162px',
                  originY: '86px',
                }}
              >
                <circle cx="162" cy="86" r="7" fill="url(#brassGrad)" />
                <path
                  d="M 134 94 L 190 94 L 222 162 L 102 162 Z"
                  fill="url(#shadeGrad)"
                  stroke={lampOn ? '#f2cb80' : '#4a426e'}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <ellipse
                  cx="162"
                  cy="162"
                  rx="60"
                  ry="9"
                  fill={lampOn ? '#ffd791' : '#1b172e'}
                  stroke={lampOn ? '#ffebbf' : '#383157'}
                  strokeWidth="1.5"
                />
                <circle cx="162" cy="166" r="14" fill={lampOn ? '#fff4d4' : '#3a3456'} />
                {!lampOn && (
                  <motion.circle
                    cx="162"
                    cy="166"
                    r="14"
                    fill="#ffbe5c"
                    style={{ opacity: preGlowOpacity }}
                  />
                )}
              </motion.g>

              <motion.line
                x1="214"
                y1="158"
                x2="214"
                y2={cordEndY}
                stroke="#e7d7b8"
                strokeWidth="2.8"
                strokeDasharray="4 2"
              />

              <motion.g
                drag={prefersReducedMotion ? false : 'y'}
                dragConstraints={{ top: 0, bottom: 88 }}
                dragElastic={0.18}
                dragSnapToOrigin
                style={{ y: pullY }}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.96 }}
                onDragStart={() => {
                  isDraggingRef.current = true;
                  didLatchOnDragRef.current = false;
                }}
                onDrag={(_, info) => {
                  if (info.offset.y >= PULL_THRESHOLD && !didLatchOnDragRef.current) {
                    didLatchOnDragRef.current = true;
                    handleRopeTrigger(false);
                  }
                }}
                onDragEnd={() => {
                  window.setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 60);
                }}
                onClick={() => {
                  if (!isDraggingRef.current) {
                    handleRopeTrigger(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRopeTrigger(true);
                  }
                }}
                className="cursor-grab active:cursor-grabbing focus:outline-none"
                role="button"
                tabIndex={0}
                aria-label={
                  lampOn
                    ? 'Pull or click rope to dim lamp'
                    : 'Pull or click rope to light lamp and open login popup'
                }
              >
                <circle cx="214" cy="222" r="34" fill="transparent" />
                <circle cx="214" cy="208" r="4.5" fill="url(#brassGrad)" />
                <path
                  d="M 204 214 Q 214 210 224 214 L 222 232 Q 214 244 206 232 Z"
                  fill="url(#brassGrad)"
                  stroke="#fff3d6"
                  strokeWidth="1"
                />
                <circle
                  cx="214"
                  cy="226"
                  r="22"
                  fill="transparent"
                  stroke={lampOn ? 'rgba(255, 207, 135, 0.35)' : 'rgba(169, 156, 255, 0.6)'}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              </motion.g>
            </svg>
          </div>

          <div className="space-y-2 max-w-md">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f2eeff]"
              style={{ textWrap: 'balance' }}
            >
              {lampOn ? 'Workvanta Sanctuary Illuminated' : 'Pull the Rope to Enter Workvanta'}
            </h1>
            <p className="text-xs sm:text-sm text-[#a5a0ba] leading-relaxed">
              Drag the hanging brass tassel downward or click it to light the desk lamp and pop open your private sign-in window.
            </p>
          </div>
        </div>

        {/* Quiet Bottom Helper Links */}
        <div className="relative z-10 px-6 sm:px-8 pb-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#a5a0ba]">
          <button
            type="button"
            onClick={onBackToDiscover}
            className="font-semibold text-[#c4b8ff] hover:text-white transition-colors cursor-pointer"
          >
            Explore Remote Directory (Guest Preview)
          </button>
          {onNavigateToAdminLogin && (
            <button
              type="button"
              onClick={onNavigateToAdminLogin}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Staff & Admissions Portal</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* POP-UP LOGIN MODAL WITH FRAMER MOTION CURTAIN-OPENING REVEAL (Centered overlay, NOT below the lamp) */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            key="login-popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={closeLoginPopup}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#090712]/78"
          >
            <motion.div
              key="login-popup-dialog"
              initial={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.9,
                y: prefersReducedMotion ? 0 : 20,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.93,
                y: prefersReducedMotion ? 0 : 14,
              }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl overflow-hidden bg-white dark:bg-[#26223A] border border-[#ffcf87]/45 dark:border-[#3D3759] shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Sign In to Workvanta"
            >
              {/* Close Pop-up Button */}
              <button
                type="button"
                onClick={closeLoginPopup}
                aria-label="Close login dialog and dim lamp"
                className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Login Form Content */}
              <div className="p-6 sm:p-8 space-y-5">
                <div className="pr-8 space-y-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF]">
                    {mode === 'signin' ? 'Welcome to Workvanta' : 'Create Private Student Account'}
                  </h2>
                  <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                    {mode === 'signin'
                      ? 'Private, secure access to remote internships across India.'
                      : 'Sign up confidentially. Your applications remain private.'}
                  </p>
                </div>

                {/* Segmented Sign In / New Account Toggle */}
                <div className="flex p-1 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-white dark:bg-[#26223A] text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs'
                        : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
                    }`}
                  >
                    New Account
                  </button>
                </div>

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
                  className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 dark:border-[#3D3759] text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#FFF8F0] dark:hover:bg-[#2F2945] transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-50 cursor-pointer"
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

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#7C6CF0]/15 dark:border-[#3D3759] w-full" />
                  <span className="bg-white dark:bg-[#26223A] px-3 text-[11px] font-medium text-[#6B6880] dark:text-[#A5A0BA] shrink-0">
                    or continue with student email
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
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
                          College / University
                        </label>
                        <div className="relative">
                          <GraduationCap className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
                          <input
                            type="text"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            placeholder="e.g. IIT Delhi, BITS Pilani"
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
                        placeholder="you@college.ac.in"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[#6B6880] hover:text-[#2D2A3E] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label
                      htmlFor="remember"
                      className="flex items-center gap-2 text-xs text-[#6B6880] dark:text-[#A5A0BA] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#7C6CF0] focus:ring-[#7C6CF0]"
                      />
                      <span>Keep session private</span>
                    </label>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#006949] dark:text-[#5EE3B0] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                      <span>100% Confidential</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {loading
                        ? 'Entering Workvanta...'
                        : mode === 'signin'
                        ? 'Sign In to Workvanta'
                        : 'Create Private Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-3 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onBackToDiscover}
                    className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Guest Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {onNavigateToAdminLogin && (
                    <button
                      type="button"
                      onClick={onNavigateToAdminLogin}
                      className="text-[11px] font-medium text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Staff Portal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Smooth Framer Motion Curtain-Opening Overlay Inside Pop-Up */}
              <AnimatePresence>
                {!curtainsParted && (
                  <motion.div
                    key="popup-curtains"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, delay: 0.45 }}
                    className="pointer-events-none absolute inset-0 z-20 flex overflow-hidden"
                  >
                    <motion.div
                      initial={{ x: '0%' }}
                      exit={{
                        x: prefersReducedMotion ? '0%' : '-105%',
                        opacity: prefersReducedMotion ? 0 : 1,
                      }}
                      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                      className="w-1/2 h-full border-r-2 border-[#f2cb80]/50"
                      style={{
                        background:
                          'repeating-linear-gradient(90deg, #1b1533 0px, #272047 18px, #16112a 36px)',
                      }}
                    />
                    <motion.div
                      initial={{ x: '0%' }}
                      exit={{
                        x: prefersReducedMotion ? '0%' : '105%',
                        opacity: prefersReducedMotion ? 0 : 1,
                      }}
                      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                      className="w-1/2 h-full border-l-2 border-[#f2cb80]/50"
                      style={{
                        background:
                          'repeating-linear-gradient(90deg, #16112a 0px, #272047 18px, #1b1533 36px)',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
