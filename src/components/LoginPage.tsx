import React, { useState, useRef, useEffect } from 'react';
import {
  motion,
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
  Phone,
  Rocket,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { syncFirebaseUserProfile } from '../lib/firestore-sync';

interface LoginPageProps {
  mode?: 'signup' | 'signin';
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token?: string) => void;
  onBackToDiscover: () => void;
  onNavigateToAdminLogin?: () => void;
}

const COURSE_OPTIONS = [
  'BCA / MCA',
  'B.Tech / B.E.',
  'B.Sc / M.Sc',
  'BBA / MBA',
  'B.Com / M.Com',
  'Diploma / Other',
];

const DOMAIN_TRACK_OPTIONS = [
  'Frontend Engineering',
  'Full-Stack Development',
  'Backend & Cloud',
  'UI/UX & Product Design',
  'Data Science & AI',
  'Mobile App Development',
];

const INDIAN_STATES = [
  'Uttar Pradesh',
  'Delhi NCR',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Gujarat',
  'Rajasthan',
  'West Bengal',
  'Madhya Pradesh',
  'Haryana',
  'Punjab',
  'Bihar',
  'Kerala',
  'Andhra Pradesh',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Goa',
  'Other',
];

const CurtainBottomTassels: React.FC = () => (
  <div
    className="absolute bottom-2.5 inset-x-0 flex flex-col pointer-events-none select-none"
    aria-hidden="true"
  >
    <div className="h-2 w-full bg-gradient-to-b from-[#d1fae5] via-[#34d399] to-[#059669] border-y border-emerald-100/80 shadow-xs" />
    <div className="flex items-start justify-around px-5 -mt-px">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <svg
          key={idx}
          width="22"
          height="36"
          viewBox="0 0 22 36"
          className="drop-shadow-xs overflow-visible"
        >
          <line x1="11" y1="0" x2="11" y2="9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <circle cx="11" cy="11" r="3" fill="#6ee7b7" stroke="#047857" strokeWidth="1" />
          <path
            d="M 8 14 Q 11 12 14 14 L 17 31 Q 11 35 5 31 Z"
            fill="#10b981"
            stroke="#ecfdf5"
            strokeWidth="0.9"
          />
          <line x1="9" y1="16" x2="8" y2="31" stroke="#064e3b" strokeOpacity="0.45" strokeWidth="0.8" />
          <line x1="11" y1="15" x2="11" y2="32" stroke="#064e3b" strokeOpacity="0.45" strokeWidth="0.8" />
          <line x1="13" y1="16" x2="14" y2="31" stroke="#064e3b" strokeOpacity="0.45" strokeWidth="0.8" />
        </svg>
      ))}
    </div>
  </div>
);

export const LoginPage: React.FC<LoginPageProps> = ({
  mode = 'signup',
  onLoginSuccess,
  onBackToDiscover,
  onNavigateToAdminLogin,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Curtain open state (starts closed over a blank/hidden registration view)
  const [curtainOpen, setCurtainOpen] = useState(mode === 'signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('BCA / MCA');
  const [domainTrack, setDomainTrack] = useState('');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setErrorMsg(null);
    if (mode === 'signin') {
      setCurtainOpen(true);
    }
  }, [mode]);

  // Stretchy Left-Side Vertical Rope Physics
  const pullY = useMotionValue(0);
  const smoothPullY = useSpring(pullY, { stiffness: 300, damping: 16, mass: 0.85 });
  const ropeEndY = useTransform(smoothPullY, (v) => 232 + v);
  const ropePathD = useTransform(smoothPullY, (v) => {
    const endY = 232 + v;
    const midY = 20 + (endY - 20) * 0.5;
    const sway = Math.sin(v * 0.06) * 4;
    return `M 36 20 Q ${36 + sway} ${midY} 36 ${endY}`;
  });

  const didLatchOnDragRef = useRef(false);
  const isDraggingRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);

  const PULL_THRESHOLD = 36;

  useEffect(() => {
    return () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    };
  }, []);

  const openCurtain = (animateTug = false) => {
    if (curtainOpen) return;

    if (animateTug && !prefersReducedMotion) {
      animate(pullY, 58, {
        duration: 0.16,
        ease: 'easeOut',
        onComplete: () => {
          animate(pullY, 0, { type: 'spring', stiffness: 380, damping: 18 });
        },
      });
    }

    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    openTimerRef.current = window.setTimeout(
      () => {
        setCurtainOpen(true);
      },
      prefersReducedMotion ? 20 : 140
    );
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
        setErrorMsg('Could not complete Google Sign-In. You can continue using your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup') {
      if (!name.trim() || !email.trim() || !mobile.trim() || !college.trim() || !domainTrack) {
        setErrorMsg('Please fill in all required registration fields.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Password and Confirm Password do not match.');
        return;
      }
    } else if (!email.trim() || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);

    const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      mode === 'signin'
        ? { email, password }
        : {
            name: name.trim(),
            email: email.trim(),
            university: `${college.trim()} (${stateName})`,
            major: `${course} · ${domainTrack}`,
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
    <div className="min-h-[82vh] flex items-center justify-center py-4 px-2 sm:px-4">
      <div className="w-full max-w-3xl flex items-center justify-center gap-2 sm:gap-6">
        {/* LEFT SIDE ORANGE VERTICAL ROPE (Always visible in viewport when closed; zero text) */}
        <motion.div
          initial={false}
          animate={{ opacity: curtainOpen ? 0 : 1 }}
          transition={{ duration: 0.28 }}
          className={`w-14 sm:w-20 shrink-0 select-none flex items-center justify-center ${
            curtainOpen ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          aria-hidden={curtainOpen}
        >
          <svg
            width="72"
            height="340"
            viewBox="0 0 72 340"
            onClick={() => {
              if (!isDraggingRef.current) {
                openCurtain(true);
              }
            }}
            className={`overflow-visible touch-none cursor-pointer ${
              !curtainOpen ? 'rope-sway' : ''
            }`}
            role="img"
            aria-label="Vertical curtain rope"
          >
            <defs>
              <linearGradient
                id="orangeRopeBrass"
                gradientUnits="userSpaceOnUse"
                x1="28"
                y1="0"
                x2="44"
                y2="0"
              >
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient
                id="orangeRopeCord"
                gradientUnits="userSpaceOnUse"
                x1="36"
                y1="20"
                x2="36"
                y2="300"
              >
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="45%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {/* Top Mounting Bracket & Brass Ring */}
            <rect x="24" y="4" width="24" height="6" rx="3" fill="url(#orangeRopeBrass)" />
            <circle
              cx="36"
              cy="17"
              r="7"
              fill="none"
              stroke="url(#orangeRopeBrass)"
              strokeWidth="3.5"
            />

            {/* Multi-Layer Braided Orange Vertical Rope */}
            <motion.path
              d={ropePathD}
              fill="none"
              stroke="#9a3412"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <motion.path
              d={ropePathD}
              fill="none"
              stroke="url(#orangeRopeCord)"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <motion.path
              d={ropePathD}
              fill="none"
              stroke="#fed7aa"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="6 6"
            />

            {/* Draggable / Clickable Orange Rope Knot & Tassel */}
            <motion.g
              drag={prefersReducedMotion ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 95 }}
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
                  openCurtain(false);
                }
              }}
              onDragEnd={() => {
                window.setTimeout(() => {
                  isDraggingRef.current = false;
                }, 60);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDraggingRef.current) {
                  openCurtain(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openCurtain(true);
                }
              }}
              className="cursor-grab active:cursor-grabbing focus:outline-none"
              role="button"
              tabIndex={curtainOpen ? -1 : 0}
              aria-label="Interact with rope to open curtain"
            >
              <circle cx="36" cy="260" r="38" fill="transparent" />
              <circle cx="36" cy="233" r="7" fill="url(#orangeRopeBrass)" stroke="#9a3412" strokeWidth="1.2" />
              <ellipse cx="36" cy="242" rx="9" ry="4.5" fill="#ea580c" stroke="#fed7aa" strokeWidth="1" />
              <path
                d="M 24 246 Q 36 240 48 246 L 53 284 Q 36 297 19 284 Z"
                fill="url(#orangeRopeCord)"
                stroke="#9a3412"
                strokeWidth="1.4"
              />
              <line x1="29" y1="250" x2="26" y2="285" stroke="#fff7ed" strokeOpacity="0.6" strokeWidth="1.2" />
              <line x1="36" y1="248" x2="36" y2="288" stroke="#9a3412" strokeOpacity="0.45" strokeWidth="1.2" />
              <line x1="43" y1="250" x2="46" y2="285" stroke="#fff7ed" strokeOpacity="0.6" strokeWidth="1.2" />
            </motion.g>

            <motion.circle cx="36" cy={ropeEndY} r="2.5" fill="#fff7ed" />
          </svg>
        </motion.div>

        {/* MIDDLE STAGE: SOFT PINK SWAYING CURTAINS PARTING LEFT & RIGHT VIA CSS ANIMATION */}
        <div className="relative flex-1 max-w-lg min-h-[600px] rounded-3xl overflow-hidden bg-white dark:bg-[#26223A] border border-pink-200/70 dark:border-[#3D3759] shadow-2xl flex flex-col justify-center">
          {/* Registration Form (or Login Form when Login clicked in top Navbar) Beneath the Curtain */}
          <div
            aria-hidden={!curtainOpen}
            className={`p-6 sm:p-8 space-y-4 transition-opacity duration-300 ${
              curtainOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none select-none'
            }`}
          >
            {/* Card Heading */}
            <div className="flex items-center gap-2.5">
              <Rocket className="w-5 h-5 text-[#7C6CF0] dark:text-[#A99CFF] shrink-0" />
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF]">
                {mode === 'signup' ? 'Registration Form' : 'Login to Workvanta'}
              </h1>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {mode === 'signup' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    Full Name <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6B6880] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#EEF2FF]/70 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    Email Address <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6B6880] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.ac.in"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#EEF2FF]/70 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    Mobile Number <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#6B6880] absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#EEF2FF]/70 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>

                {/* College & Course Split Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                      College <span className="text-[#ef4444]">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-[#6B6880] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="Your college"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                      Course <span className="text-[#ef4444]">*</span>
                    </label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    >
                      {COURSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preferred Domain Track */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    Preferred Domain Track <span className="text-[#ef4444]">*</span>
                  </label>
                  <select
                    required
                    value={domainTrack}
                    onChange={(e) => setDomainTrack(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  >
                    <option value="">Choose your internship track</option>
                    {DOMAIN_TRACK_OPTIONS.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    State <span className="text-[#ef4444]">*</span>
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    Password <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6B6880] absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-[#6B6880] hover:text-[#2D2A3E] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wide text-[#4A4660] dark:text-[#C8C3DC] mb-1">
                    Confirm Password <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6B6880] absolute left-3 top-2.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2 text-[#6B6880] hover:text-[#2D2A3E] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Register CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 py-3 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>{loading ? 'Submitting Registration...' : 'Register & Start Internship in Workvanta'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  className="w-full py-3 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Entering Workvanta...' : 'Login to Workvanta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-[#7C6CF0]/15 dark:border-[#3D3759] w-full" />
              <span className="bg-white dark:bg-[#26223A] px-3 text-[11px] font-medium text-[#6B6880] dark:text-[#A5A0BA] shrink-0">
                or
              </span>
            </div>

            {/* Google One-Click Auth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 dark:border-[#3D3759] text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#FFF8F0] dark:hover:bg-[#2F2945] transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-50 cursor-pointer"
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

            <div className="pt-2 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onBackToDiscover}
                className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Explore Internships</span>
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

          {/* TWO SOFT PINK CURTAIN PANELS IN CENTER (Pure CSS slide + organic sway; zero text on curtains) */}
          <div
            className={`absolute inset-0 z-20 flex overflow-hidden ${
              curtainOpen ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            aria-hidden={curtainOpen}
          >
            {/* Left Soft Pink Curtain Panel */}
            <div
              className={`w-1/2 h-full overflow-hidden border-r border-pink-100/80 shadow-xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-opacity motion-reduce:duration-200 ${
                curtainOpen ? '-translate-x-full motion-reduce:translate-x-0 motion-reduce:opacity-0' : 'translate-x-0'
              }`}
            >
              <div
                className={`relative w-[106%] -ml-[3%] h-full bg-[repeating-linear-gradient(90deg,#f9a8d4_0px,#fbcfe8_18px,#f472b6_36px)] ${
                  !curtainOpen ? 'curtain-sway-left' : ''
                }`}
              >
                <CurtainBottomTassels />
              </div>
            </div>

            {/* Right Soft Pink Curtain Panel */}
            <div
              className={`w-1/2 h-full overflow-hidden border-l border-pink-100/80 shadow-xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-opacity motion-reduce:duration-200 ${
                curtainOpen ? 'translate-x-full motion-reduce:translate-x-0 motion-reduce:opacity-0' : 'translate-x-0'
              }`}
            >
              <div
                className={`relative w-[106%] -ml-[3%] h-full bg-[repeating-linear-gradient(90deg,#f472b6_0px,#fbcfe8_18px,#f9a8d4_36px)] ${
                  !curtainOpen ? 'curtain-sway-right' : ''
                }`}
              >
                <CurtainBottomTassels />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SYMMETRY SPACER (keeps registration stage centered on desktop/tablet) */}
        <div className="hidden sm:block sm:w-20 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
};
