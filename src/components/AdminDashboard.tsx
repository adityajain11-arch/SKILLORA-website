import React, { useState, useEffect } from 'react';
import { Application, OfferLetter, AuthUser } from '../types';
import { OfferLetterModal } from './OfferLetterModal';
import { 
  Users, 
  Sparkles, 
  Search, 
  Send, 
  Award, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileText, 
  GraduationCap, 
  Building2, 
  Mail, 
  Filter, 
  X,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface AdminDashboardProps {
  onBackToDiscover: () => void;
  onNavigateToAdminLogin: () => void;
  currentUser: AuthUser | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBackToDiscover, 
  onNavigateToAdminLogin,
  currentUser 
}) => {
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'applied' | 'interviewing' | 'offer'>('All');
  
  // Modals
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [composingOfferApp, setComposingOfferApp] = useState<Application | null>(null);
  const [viewingOffer, setViewingOffer] = useState<OfferLetter | null>(null);

  // Offer Composer Form state
  const [stipendInput, setStipendInput] = useState('Full Fellowship Grant & Tech Setup Allowance');
  const [startDateInput, setStartDateInput] = useState('June 1, 2026');
  const [signerNameInput, setSignerNameInput] = useState('Sarah Chen');
  const [signerTitleInput, setSignerTitleInput] = useState('Head of Engineering Talent & Fellowship Admissions');
  const [customLetterBody, setCustomLetterBody] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Recruiter review note draft
  const [reviewerNoteDraft, setReviewerNoteDraft] = useState('');

  const TOKEN_KEY = 'workvanta_auth_token';
  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchApplicants = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await fetch('/api/admin/applicants', {
        headers: getAuthHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        setApplicants([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setApplicants(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch applicants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [currentUser]);

  const handleOpenOfferComposer = (app: Application) => {
    setComposingOfferApp(app);
    setStipendInput(app.stipendDisplay || 'Full Fellowship Grant & Tech Setup Allowance');
    setStartDateInput('June 1, 2026');
    setCustomLetterBody(
      `Dear ${app.applicantName || 'Fellowship Candidate'},\n\nOn behalf of ${app.company} and the Workvanta Remote Fellowship Guild, we are genuinely thrilled to formally extend an offer of employment for the position of ${app.roleTitle} (100% Remote — India).\n\nYour application, thoughtful responses, and engineering portfolio stood out amongst hundreds of university applicants across India. The hiring review committee was particularly impressed by your problem-solving depth, craftsmanship, and commitment to accessible software.\n\nSummary of Fellowship Terms:\n• Position: ${app.roleTitle}\n• Work Mode: 100% Async Remote (Based in India)\n• Fellowship Terms: Full Fellowship Grant & Tech Allowance\n• Program Start Date: June 1, 2026\n• Equipment Allowance: Dedicated tech budget provided on Day 1\n• Mentorship: Weekly 1:1 sessions with a principal engineering mentor\n\nWe look forward to building remarkable products together. Welcome to ${app.company}!`
    );
  };

  const handleSendAutomatedOffer = async () => {
    if (!composingOfferApp) return;
    setSendingOffer(true);
    try {
      const res = await fetch(`/api/admin/applicants/${composingOfferApp.id}/send-offer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          stipendAmount: stipendInput,
          startDate: startDateInput,
          signerName: signerNameInput,
          signerTitle: signerTitleInput,
          customMessage: customLetterBody
        })
      });
      const data = await res.json();
      if (data.success) {
        fireCelebrationConfetti();
        setActionSuccessMsg(`Automated offer letter dispatched to ${composingOfferApp.applicantName}!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        
        // Update local state
        setApplicants((prev) =>
          prev.map((a) => (a.id === composingOfferApp.id ? data.data : a))
        );
        setComposingOfferApp(null);
        if (data.offerLetter) {
          setViewingOffer(data.offerLetter);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingOffer(false);
    }
  };

  const handleUpdateStage = async (id: string, stage: Application['stage'], note?: string) => {
    try {
      const res = await fetch(`/api/admin/applicants/${id}/update-stage`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ stage, reviewerNotes: note })
      });
      const data = await res.json();
      if (data.success) {
        setApplicants((prev) => prev.map((a) => (a.id === id ? data.data : a)));
        if (reviewingApp && reviewingApp.id === id) {
          setReviewingApp(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter applicants
  const filteredApplicants = applicants.filter((item) => {
    if (statusFilter !== 'All' && item.stage !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        (item.applicantName || '').toLowerCase().includes(q) ||
        (item.applicantEmail || '').toLowerCase().includes(q) ||
        (item.applicantUniversity || '').toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // KPI calculations
  const totalCount = applicants.length;
  const appliedCount = applicants.filter((a) => a.stage === 'applied').length;
  const interviewingCount = applicants.filter((a) => a.stage === 'interviewing').length;
  const offerCount = applicants.filter((a) => a.stage === 'offer').length;

  if (accessDenied || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-[#1E1A2C] border border-red-500/20 text-center shadow-2xl space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div>
          <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            HTTP 403 · Access Denied
          </span>
          <h2 className="text-2xl font-black text-[#2D2A3E] dark:text-[#F2EEFF] mt-3">
            Administrator Clearance Required
          </h2>
          <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] max-w-md mx-auto mt-2 leading-relaxed">
            This internal portal contains confidential applicant records, student resume submissions, and offer issuance tools. Access is strictly restricted to verified Workvanta admissions personnel and recruiters.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onBackToDiscover}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold border border-[#7C6CF0]/20 text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/10 transition-colors cursor-pointer"
          >
            ← Return to Remote Roles
          </button>
          <button
            onClick={onNavigateToAdminLogin}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold bg-[#0F172A] dark:bg-emerald-500 text-white dark:text-[#080B11] font-mono flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400 dark:text-slate-950" />
            <span>Staff Admin Gateway →</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#34D399]/20 border border-[#34D399]/40 text-[#006949] dark:text-[#5EE3B0] flex items-center justify-between text-xs font-bold animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] cozy-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C6CF0]/10 text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Workvanta Admissions & Recruiter Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF] mt-2 tracking-tight">
            Applicant Submissions & Offer Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6880] dark:text-[#A5A0BA] mt-1 max-w-xl">
            Review student candidate submissions across Indian universities, inspect verified portfolios, and dispatch automated official fellowship offer letters in one click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplicants}
            className="p-2.5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/10 transition-colors"
            title="Refresh submissions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onBackToDiscover}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm transition-all"
          >
            ← View Candidate App
          </button>
        </div>
      </div>

      {/* 4 Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA]">Total Applicants</span>
            <Users className="w-4 h-4 text-[#7C6CF0]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2D2A3E] dark:text-[#F2EEFF] mt-2 tabular-nums">
            {totalCount}
          </div>
          <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-1 block">
            Across Indian colleges
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA]">Awaiting Review</span>
            <Clock className="w-4 h-4 text-[#7C6CF0]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#7C6CF0] dark:text-[#A99CFF] mt-2 tabular-nums">
            {appliedCount}
          </div>
          <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-1 block">
            Pending technical triage
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#FF8A65]/20 dark:border-[#3D3759] cozy-card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA]">Interview Jams</span>
            <Sparkles className="w-4 h-4 text-[#FF8A65]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#FF8A65] dark:text-[#FFA07A] mt-2 tabular-nums">
            {interviewingCount}
          </div>
          <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-1 block">
            Active pairing sessions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#34D399]/20 dark:border-[#3D3759] cozy-card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA]">Offers Dispatched</span>
            <Award className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#34D399] dark:text-[#5EE3B0] mt-2 tabular-nums">
            {offerCount}
          </div>
          <span className="text-[11px] text-[#006949] dark:text-[#5EE3B0] mt-1 font-semibold block">
            Automated letters issued
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, role, or college..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['All', 'applied', 'interviewing', 'offer'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#7C6CF0] text-white shadow-xs'
                  : 'bg-[#FFF8F0] dark:bg-[#1E1A2C] text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
              }`}
            >
              {st === 'All' ? 'All Applicants' : st === 'offer' ? 'Offers Extended 🎉' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applicants List Table / Card Deck */}
      <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] overflow-hidden cozy-card-shadow">
        
        <div className="p-5 border-b border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#7C6CF0]" />
            <h3 className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
              Candidate Career Journeys & Admissions ({filteredApplicants.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA]">
            Real-time server sync active
          </span>
        </div>

        {filteredApplicants.length === 0 ? (
          <div className="p-12 text-center text-[#6B6880] dark:text-[#A5A0BA] space-y-2">
            <Users className="w-8 h-8 mx-auto text-[#7C6CF0]/40" />
            <p className="text-sm font-semibold">No candidate submissions match your query</p>
            <p className="text-xs">Try clearing search terms or status filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#7C6CF0]/10 dark:divide-[#3D3759] overflow-x-auto">
            {filteredApplicants.map((app) => (
              <div
                key={app.id}
                className="p-5 hover:bg-[#FFF8F0]/40 dark:hover:bg-[#1E1A2C]/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                
                {/* Candidate & Role Profile */}
                <div className="flex items-start sm:items-center gap-4 min-w-[300px]">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] p-0.5 shadow-xs shrink-0">
                    <img
                      src={app.companyLogo}
                      alt={app.company}
                      className="w-full h-full rounded-[14px] object-cover bg-white"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2D2A3E] dark:text-[#F2EEFF]">
                        {app.applicantName || 'Candidate'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7C6CF0]/10 text-[#7C6CF0] dark:text-[#A99CFF]">
                        {app.applicantUniversity || 'India College'}
                      </span>
                    </div>

                    <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-1.5">
                      <span className="font-medium text-[#2D2A3E] dark:text-[#F2EEFF]">
                        {app.roleTitle}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-[#7C6CF0] dark:text-[#A99CFF]">
                        {app.company}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-2">
                      <span>Applied: {app.appliedDate}</span>
                      <span>·</span>
                      <span className="truncate max-w-[180px]">{app.applicantEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown & Next Step */}
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6B6880] dark:text-[#A5A0BA] mb-1">
                      Status Stage
                    </label>
                    <select
                      value={app.stage}
                      onChange={(e) => handleUpdateStage(app.id, e.target.value as Application['stage'])}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none ${
                        app.stage === 'offer'
                          ? 'bg-[#34D399]/20 text-[#006949] dark:text-[#5EE3B0] border-[#34D399]/30'
                          : app.stage === 'interviewing'
                          ? 'bg-[#FF8A65]/15 text-[#9f4122] dark:text-[#FFA07A] border-[#FF8A65]/30'
                          : 'bg-[#7C6CF0]/15 text-[#5846ca] dark:text-[#A99CFF] border-[#7C6CF0]/30'
                      }`}
                    >
                      <option value="applied">Applied & In Review</option>
                      <option value="interviewing">Interviewing Jam</option>
                      <option value="offer">Offer Extended 🎉</option>
                      <option value="archived">Archived / Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setReviewingApp(app);
                      setReviewerNoteDraft(app.notes || '');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 hover:border-[#7C6CF0] text-[#2D2A3E] dark:text-[#F2EEFF] transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#7C6CF0]" />
                    <span>Review Application</span>
                  </button>

                  {app.offerLetter ? (
                    <button
                      onClick={() => setViewingOffer(app.offerLetter!)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#006949] dark:text-[#5EE3B0] border border-[#34D399]/30 transition-all flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-[#34D399]" />
                      <span>View Offer Letter 📜</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenOfferComposer(app)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Offer Letter</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Review Candidate Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider block">
                  Application Review
                </span>
                <h3 className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  {reviewingApp.applicantName} — {reviewingApp.roleTitle}
                </h3>
              </div>
              <button
                onClick={() => setReviewingApp(null)}
                className="p-2 rounded-full text-[#6B6880] hover:bg-[#7C6CF0]/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#2D2A3E] dark:text-[#F2EEFF]">
              
              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15">
                <div>
                  <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] block">University</span>
                  <span className="font-bold">{reviewingApp.applicantUniversity || 'IIT Bombay'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] block">Email</span>
                  <span className="font-bold">{reviewingApp.applicantEmail || 'student@workvanta.in'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] block">Target Company</span>
                  <span className="font-bold text-[#7C6CF0]">{reviewingApp.company}</span>
                </div>
              </div>

              {/* Story / Cover Answer */}
              {reviewingApp.storyAnswer && (
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6880] dark:text-[#A5A0BA]">
                    Why {reviewingApp.company}? Candidate Story
                  </h4>
                  <p className="p-4 rounded-2xl bg-[#FFF8F0]/60 dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 leading-relaxed text-sm font-normal">
                    {reviewingApp.storyAnswer}
                  </p>
                </div>
              )}

              {/* Portfolio & Resume Link */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6880] dark:text-[#A5A0BA]">
                  Verified Candidate Credentials
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  {reviewingApp.portfolioUrl && (
                    <a
                      href={reviewingApp.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#7C6CF0]/10 text-[#7C6CF0] dark:text-[#A99CFF] font-semibold flex items-center gap-1.5 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Portfolio ({reviewingApp.portfolioUrl})</span>
                    </a>
                  )}

                  <div className="px-4 py-2 rounded-xl bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0] font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Resume: {reviewingApp.resumeFileName || 'Student_Resume.pdf'}</span>
                  </div>
                </div>
              </div>

              {/* Recruiter Private Notes */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6880] dark:text-[#A5A0BA]">
                  Recruiter Internal Notes
                </h4>
                <textarea
                  value={reviewerNoteDraft}
                  onChange={(e) => setReviewerNoteDraft(e.target.value)}
                  rows={3}
                  placeholder="Add internal feedback, interview ratings, or notes..."
                  className="w-full p-3 rounded-2xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                />
                <button
                  onClick={() => {
                    handleUpdateStage(reviewingApp.id, reviewingApp.stage, reviewerNoteDraft);
                    setActionSuccessMsg('Recruiter notes updated successfully');
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#7C6CF0] text-white text-xs font-bold"
                >
                  Save Internal Notes
                </button>
              </div>

            </div>

            <div className="p-4 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 flex items-center justify-between">
              <button
                onClick={() => setReviewingApp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6880]"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setReviewingApp(null);
                  handleOpenOfferComposer(reviewingApp);
                }}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#7C6CF0] text-white flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Issue Automated Offer Letter</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Automated Offer Letter Composer Modal */}
      {composingOfferApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-6 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider block">
                  Automated Offer Letter Engine
                </span>
                <h3 className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  Issue Official Fellowship Offer to {composingOfferApp.applicantName}
                </h3>
              </div>
              <button
                onClick={() => setComposingOfferApp(null)}
                className="p-2 rounded-full text-[#6B6880] hover:bg-[#7C6CF0]/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Fellowship Grant & Terms
                  </label>
                  <input
                    type="text"
                    value={stipendInput}
                    onChange={(e) => setStipendInput(e.target.value)}
                    placeholder="e.g. Full Fellowship Grant & Equipment Budget"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Program Start Date
                  </label>
                  <input
                    type="text"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    placeholder="e.g. June 1, 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    value={signerNameInput}
                    onChange={(e) => setSignerNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Signatory Title
                  </label>
                  <input
                    type="text"
                    value={signerTitleInput}
                    onChange={(e) => setSignerTitleInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Official Offer Letter Body Text
                </label>
                <textarea
                  value={customLetterBody}
                  onChange={(e) => setCustomLetterBody(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 rounded-2xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0] font-mono leading-relaxed"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#34D399]/10 text-xs text-[#006949] dark:text-[#5EE3B0] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-[#34D399]" />
                <span>
                  Dispatched offers automatically sync with the candidate's dashboard, moving their application to "Offers Received 🎉".
                </span>
              </div>

            </div>

            <div className="p-4 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 flex items-center justify-between">
              <button
                onClick={() => setComposingOfferApp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6880]"
              >
                Cancel
              </button>

              <button
                onClick={handleSendAutomatedOffer}
                disabled={sendingOffer}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingOffer ? 'Dispatched to Candidate...' : 'Dispatch Automated Offer Letter'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Offer Letter View Modal */}
      {viewingOffer && (
        <OfferLetterModal
          offer={viewingOffer}
          onClose={() => setViewingOffer(null)}
        />
      )}

    </div>
  );
};
