import React, { useState } from 'react';
import { AuthUser } from '../types';
import { 
  ShieldAlert, 
  KeyRound, 
  Terminal, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Fingerprint,
  Cpu,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface AdminLoginPageProps {
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token?: string) => void;
  onBackToPublic: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onBackToPublic
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clearancePin, setClearancePin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [terminalLog, setTerminalLog] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Administrative Email and Master Passphrase are mandatory.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setTerminalLog('Initiating secure handshake with PostgreSQL Auth Vault...');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          clearanceKey: clearancePin || 'WKV-ADMIN-2026' 
        })
      });

      const data = await res.json();

      if (data.success && data.user) {
        setTerminalLog('Clearance verified. Launching Admissions Console...');
        fireCelebrationConfetti();
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 400);
      } else {
        setErrorMsg(data.message || 'Access Denied: Invalid Administrative Credentials.');
        setTerminalLog('Handshake rejected. Access logged.');
      }
    } catch (err) {
      setErrorMsg('Failed to establish secure tunnel to Workvanta operations server.');
      setTerminalLog('Tunnel failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-200 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-hidden">
      
      {/* High-tech cyber grid backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px'
        }}
      />

      {/* Top Telemetry Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between border-b border-slate-800/80 pb-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPublic}
            className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Student Portal</span>
          </button>
          <span className="hidden sm:inline-block text-slate-600">|</span>
          <span className="hidden sm:flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WORKVANTA INTERNAL GATEWAY</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>NODE: ASIA-SOUTH1-PSQL</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-semibold">
            <Fingerprint className="w-3 h-3" />
            <span>LEVEL-4 CLEARANCE</span>
          </div>
        </div>
      </header>

      {/* Main Terminal Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl p-6 sm:p-8 relative">
          
          {/* Subtle neon indicator top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 rounded-t-2xl" />

          {/* Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>Admissions & Operations Console</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                RESTRICTED ACCESS · AUTHORIZED STAFF ONLY
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>TLS 1.3 / HMAC-256 VAULT VERIFIED</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Security Clearance Error</p>
                <p className="text-[11px] text-red-300/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Terminal Log Status */}
          {terminalLog && (
            <div className="mb-5 p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{terminalLog}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            
            {/* Work Email */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>ADMIN WORK EMAIL</span>
                <span className="text-[10px] text-slate-500">@workvanta.in</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@workvanta.in"
                  required
                  className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-600 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Master Passphrase */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>MASTER PASSPHRASE</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'HIDE' : 'SHOW'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-600 font-mono transition-colors tracking-widest"
                />
              </div>
            </div>

            {/* Hardware Key / 2FA Token Code */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>SECURITY CLEARANCE PIN / PASSKEY</span>
                <span className="text-[10px] text-emerald-400">OPTIONAL 2FA</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clearancePin}
                  onChange={(e) => setClearancePin(e.target.value)}
                  placeholder="WKV-ADMIN-2026"
                  className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-emerald-300 placeholder-slate-600 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl text-xs font-bold font-mono tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING CLEARANCE...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>AUTHORIZE & ENTER CONSOLE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Private Access Restricted to Workvanta Staff</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Protected endpoints strictly enforce Administrator Role via signed session tokens.
            </p>
          </div>

        </div>
      </main>

      {/* Cyber Security Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/80 pt-4 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Workvanta Admissions Governance Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-600">ID: SEC-NODE-01</span>
          <span className="text-emerald-500/80">RBAC: ENABLED</span>
          <button 
            onClick={onBackToPublic}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Public Site
          </button>
        </div>
      </footer>

    </div>
  );
};
