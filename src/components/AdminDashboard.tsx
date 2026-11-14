import React, { useState, useEffect } from 'react';
import { Application, OfferLetter, AuthUser, Internship } from '../types';
import { OfferLetterModal } from './OfferLetterModal';
import { CompanyLogo } from './CompanyLogo';
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
  ShieldAlert,
  Video,
  Calendar,
  Plus,
  Trash2,
  Briefcase,
  MapPin,
  Check,
  UserCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface AdminDashboardProps {
  onBackToDiscover: () => void;
  onNavigateToAdminLogin: () => void;
  currentUser: AuthUser | null;
  authChecking?: boolean;
  onInternshipsUpdated?: () => void;
}

type AdminTab = 'applicants' | 'internships' | 'users';
const ADMIN_SUBTAB_KEY = 'workvanta_admin_subtab';

function getInitialAdminTab(): AdminTab {
  if (typeof window === 'undefined') return 'applicants';
  const saved = localStorage.getItem(ADMIN_SUBTAB_KEY) as AdminTab | null;
  if (saved === 'applicants' || saved === 'internships' || saved === 'users') {
    return saved;
  }
  return 'applicants';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBackToDiscover, 
  onNavigateToAdminLogin,
  currentUser,
  authChecking = false,
  onInternshipsUpdated
}) => {
  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialAdminTab);
  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SUBTAB_KEY, tab);
    }
  };

  // Applicants state
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'applied' | 'interviewing' | 'offer'>('All');
  
  // Users state
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userUniversityFilter, setUserUniversityFilter] = useState('All');
  const [userGradYearFilter, setUserGradYearFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | 'student' | 'admin'>('All');

  // Internships state
  const [internshipsList, setInternshipsList] = useState<Internship[]>([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const [internshipSearchQuery, setInternshipSearchQuery] = useState('');

  // Modals
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [composingOfferApp, setComposingOfferApp] = useState<Application | null>(null);
  const [viewingOffer, setViewingOffer] = useState<{ offer: OfferLetter; applicationId: string } | null>(null);
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);

  // Offer Composer Form state (Skillora template: only Name, Date, Domain change)
  const [offerNameInput, setOfferNameInput] = useState('');
  const [offerDateInput, setOfferDateInput] = useState('');
  const [offerDomainInput, setOfferDomainInput] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  // Interview Scheduler Form state
  const [interviewTitleInput, setInterviewTitleInput] = useState('Pair Programming Jam & Systems Exploration');
  const [interviewDateInput, setInterviewDateInput] = useState('');
  const [meetingLinkInput, setMeetingLinkInput] = useState('https://meet.google.com/wkv-adm-call');
  const [interviewerNotesInput, setInterviewerNotesInput] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // Add / Edit Internship Form state
  const [isInternshipModalOpen, setIsInternshipModalOpen] = useState(false);
  const [editingInternshipId, setEditingInternshipId] = useState<string | null>(null);
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    company: '',
    companyLogo: '',
    location: 'Remote — Bengaluru, India',
    category: 'Software Engineering',
    friendlyDescription: '',
    responsibilitiesText: '',
    skillsText: '',
    season: 'Summer 2026',
    deadline: '2026-12-31'
  });
  const [savingInternship, setSavingInternship] = useState(false);

  // Feedback banner
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [reviewerNoteDraft, setReviewerNoteDraft] = useState('');

  const TOKEN_KEY = 'workvanta_auth_token';
  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Applicants
  const fetchApplicants = async () => {
    if (authChecking && !currentUser) return;
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

  // Fetch Registered Users
  const fetchUsers = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!res.ok) {
        setUsersError('Could not refresh user directory from PostgreSQL.');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRegisteredUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch registered users', err);
      setUsersError('Network error while loading user directory.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Internships
  const fetchInternships = async () => {
    setLoadingInternships(true);
    try {
      const res = await fetch('/api/internships', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setInternshipsList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch internships', err);
    } finally {
      setLoadingInternships(false);
    }
  };

  useEffect(() => {
    if (authChecking) return;
    fetchApplicants();
    fetchUsers();
    fetchInternships();
  }, [currentUser, authChecking]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser || currentUser.role !== 'admin') return;
    const handleFocus = () => {
      fetchUsers();
      fetchApplicants();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser]);

  // Handle Open Offer Composer
  const handleOpenOfferComposer = (app: Application) => {
    setComposingOfferApp(app);
    setOfferNameInput(app.applicantName || 'Candidate');
    setOfferDateInput(
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
    setOfferDomainInput(app.roleTitle || 'Python Programing');
  };

  // Handle Send Offer
  const handleSendAutomatedOffer = async () => {
    if (!composingOfferApp) return;
    setSendingOffer(true);
    try {
      const targetAppId = composingOfferApp.id;
      const res = await fetch(`/api/admin/applicants/${targetAppId}/send-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          candidateName: offerNameInput.trim(),
          issuedDate: offerDateInput.trim(),
          domain: offerDomainInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        fireCelebrationConfetti();
        setActionSuccessMsg(`Skillora offer letter dispatched to ${offerNameInput.trim() || composingOfferApp.applicantName}!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);

        setApplicants((prev) =>
          prev.map((a) => (a.id === targetAppId ? data.data : a))
        );
        setComposingOfferApp(null);
        if (data.offerLetter) {
          setViewingOffer({ offer: data.offerLetter, applicationId: targetAppId });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingOffer(false);
    }
  };

  // Handle Open Interview Scheduler
  const handleOpenInterviewScheduler = (app: Application) => {
    setSchedulingApp(app);
    setInterviewTitleInput('Pair Programming Jam & Systems Exploration');
    const tomorrow = new Date(Date.now() + 86400000 * 2);
    tomorrow.setHours(14, 0, 0, 0);
    setInterviewDateInput(tomorrow.toISOString().slice(0, 16));
    setMeetingLinkInput('https://meet.google.com/wkv-adm-call');
    setInterviewerNotesInput('Focus on component state flow, accessibility checks, and student questions.');
  };

  // Handle Send Interview Scheduling
  const handleScheduleInterview = async () => {
    if (!schedulingApp) return;
    setSchedulingLoading(true);
    try {
      const res = await fetch(`/api/admin/applicants/${schedulingApp.id}/schedule-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          interviewTitle: interviewTitleInput,
          interviewDate: interviewDateInput ? new Date(interviewDateInput).toISOString() : new Date().toISOString(),
          meetingLink: meetingLinkInput,
          interviewerNotes: interviewerNotesInput
        })
      });

      const data = await res.json();
      if (data.success) {
        fireCelebrationConfetti();
        setActionSuccessMsg(`Interview call scheduled with ${schedulingApp.applicantName}!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);

        setApplicants((prev) =>
          prev.map((a) => (a.id === schedulingApp.id ? data.data : a))
        );
        if (reviewingApp && reviewingApp.id === schedulingApp.id) {
          setReviewingApp(data.data);
        }
        setSchedulingApp(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Handle Update Stage directly
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

  // Open Add Internship Modal
  const handleOpenAddInternship = () => {
    setEditingInternshipId(null);
    setInternshipForm({
      title: '',
      company: '',
      companyLogo: '/logos/workvanta-default.svg',
      location: 'Remote — Pan-India',
      category: 'Software Engineering',
      friendlyDescription: '',
      responsibilitiesText: 'Build and ship frontend features with clean TypeScript and React\nParticipate in friendly async code jams and design critiques\nHelp maintain approachable documentation for community developers',
      skillsText: 'TypeScript, React, Git, Problem Solving',
      season: 'Summer 2026',
      deadline: '2026-12-31'
    });
    setIsInternshipModalOpen(true);
  };

  // Open Edit Internship Modal
  const handleOpenEditInternship = (item: Internship) => {
    setEditingInternshipId(item.id);
    setInternshipForm({
      title: item.title,
      company: item.company,
      companyLogo: item.companyLogo,
      location: item.location,
      category: item.category,
      friendlyDescription: item.friendlyDescription,
      responsibilitiesText: (item.responsibilities || []).join('\n'),
      skillsText: (item.noJargonSkills || []).join(', '),
      season: item.season || 'Summer 2026',
      deadline: item.deadline || '2026-12-31'
    });
    setIsInternshipModalOpen(true);
  };

  // Save Internship (Create or Update)
  const handleSaveInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internshipForm.title || !internshipForm.company) {
      return;
    }
    setSavingInternship(true);
    try {
      const responsibilities = internshipForm.responsibilitiesText
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const noJargonSkills = internshipForm.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        title: internshipForm.title,
        company: internshipForm.company,
        companyLogo: internshipForm.companyLogo || '/logos/workvanta-default.svg',
        location: internshipForm.location || 'Remote — India',
        category: internshipForm.category,
        friendlyDescription: internshipForm.friendlyDescription || 'Exciting remote fellowship opportunity in India.',
        responsibilities,
        noJargonSkills,
        season: internshipForm.season,
        deadline: internshipForm.deadline,
        hourlyRate: 50,
        monthlyStipend: 8000,
        housingStipendMonthly: 0,
        matchScore: 92,
        matchReason: 'Matched based on high-impact student projects and craftsmanship.'
      };

      const isEdit = Boolean(editingInternshipId);
      const url = isEdit ? `/api/admin/internships/${editingInternshipId}` : '/api/admin/internships';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        fireCelebrationConfetti();
        setActionSuccessMsg(isEdit ? 'Remote internship listing updated!' : 'New remote internship published successfully!');
        setTimeout(() => setActionSuccessMsg(null), 4000);
        setIsInternshipModalOpen(false);
        fetchInternships();
        if (onInternshipsUpdated) {
          onInternshipsUpdated();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInternship(false);
    }
  };

  // Delete Internship
  const handleDeleteInternship = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove the listing "${title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/internships/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Internship "${title}" removed.`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
        fetchInternships();
        if (onInternshipsUpdated) {
          onInternshipsUpdated();
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

  // Derived filter options for User Signups
  const uniqueUserUniversities = Array.from(
    new Set(
      registeredUsers
        .map((u) => (u.university || '').trim())
        .filter((val) => val.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  const uniqueUserGradYears = Array.from(
    new Set(
      registeredUsers
        .map((u) => String(u.gradYear || '').trim())
        .filter((val) => val.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  const hasActiveUserFilters =
    userSearchQuery.trim() !== '' ||
    userUniversityFilter !== 'All' ||
    userGradYearFilter !== 'All' ||
    userRoleFilter !== 'All';

  const resetUserFilters = () => {
    setUserSearchQuery('');
    setUserUniversityFilter('All');
    setUserGradYearFilter('All');
    setUserRoleFilter('All');
  };

  // Filter registered users
  const filteredUsers = registeredUsers.filter((u) => {
    if (userUniversityFilter !== 'All' && (u.university || '').trim() !== userUniversityFilter) {
      return false;
    }
    if (userGradYearFilter !== 'All' && String(u.gradYear || '').trim() !== userGradYearFilter) {
      return false;
    }
    if (userRoleFilter !== 'All' && u.role !== userRoleFilter) {
      return false;
    }
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.university || '').toLowerCase().includes(q) ||
      (u.major || '').toLowerCase().includes(q) ||
      String(u.gradYear || '').toLowerCase().includes(q)
    );
  });

  // Filter internships list
  const filteredInternships = internshipsList.filter((item) => {
    if (!internshipSearchQuery.trim()) return true;
    const q = internshipSearchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.company.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // KPI calculations
  const totalCount = applicants.length;
  const appliedCount = applicants.filter((a) => a.stage === 'applied').length;
  const interviewingCount = applicants.filter((a) => a.stage === 'interviewing').length;
  const offerCount = applicants.filter((a) => a.stage === 'offer').length;

  if (authChecking && !currentUser) {
    return (
      <div className="max-w-xl mx-auto my-16 p-10 rounded-3xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-center shadow-xl space-y-4">
        <div className="w-10 h-10 border-4 border-[#7C6CF0] border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
          Restoring Admin Session...
        </h2>
        <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
          Verifying persistent clearance against Workvanta PostgreSQL Auth Vault.
        </p>
      </div>
    );
  }

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
            This internal portal contains confidential applicant records, student resume submissions, offer issuance, and user registry tools. Access is strictly restricted to verified Workvanta admissions personnel.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onBackToDiscover}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold border border-[#7C6CF0]/20 text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/10 transition-colors cursor-pointer"
          >
            ← Return to Explore Internships
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
          <button onClick={() => setActionSuccessMsg(null)} className="text-xs hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C6CF0]/10 text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Workvanta Admissions & Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF] mt-2 tracking-tight">
            Recruiter & Admissions Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6880] dark:text-[#A5A0BA] mt-1 max-w-xl">
            Triage candidate applications, schedule official interview jams, dispatch automated verified offer letters, manage remote internship listings, and audit user logins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              fetchApplicants();
              fetchUsers();
              fetchInternships();
            }}
            className="p-2.5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/10 transition-colors cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleOpenAddInternship}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Edit Internship</span>
          </button>

          <button
            onClick={onBackToDiscover}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm transition-all cursor-pointer"
          >
            ← View Candidate App
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('applicants')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'applicants'
              ? 'bg-white dark:bg-[#26223A] text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs'
              : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Applications & Offers</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#7C6CF0]/15 text-[#7C6CF0] dark:text-[#A99CFF]">
            {applicants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('internships')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'internships'
              ? 'bg-white dark:bg-[#26223A] text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs'
              : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Remote Internships</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            {internshipsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white dark:bg-[#26223A] text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs'
              : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>User Signups & Logins</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            {registeredUsers.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: APPLICANTS PIPELINE & OFFERS */}
      {/* ======================================================== */}
      {activeTab === 'applicants' && (
        <div className="space-y-6">
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
                <Video className="w-4 h-4 text-[#FF8A65]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#FF8A65] dark:text-[#FFA07A] mt-2 tabular-nums">
                {interviewingCount}
              </div>
              <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-1 block">
                Scheduled pairing calls
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
                Official letters extended
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#7C6CF0] text-white shadow-xs'
                      : 'bg-[#FFF8F0] dark:bg-[#1E1A2C] text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E]'
                  }`}
                >
                  {st === 'All' ? 'All Applicants' : st === 'interviewing' ? 'Interview Jams' : st === 'offer' ? 'Offers Extended 🎉' : 'In Review'}
                </button>
              ))}
            </div>
          </div>

          {/* Applicants List Table */}
          <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] overflow-hidden cozy-card-shadow">
            
            <div className="p-5 border-b border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#7C6CF0]" />
                <h3 className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  Candidate Career Journeys & Admissions ({filteredApplicants.length})
                </h3>
              </div>
              <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA]">
                Admissions Authority: Active
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
                    className="p-5 hover:bg-[#FFF8F0]/40 dark:hover:bg-[#1E1A2C]/40 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                  >
                    
                    {/* Candidate & Role Profile */}
                    <div className="flex items-start sm:items-center gap-4 min-w-[320px]">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] p-0.5 shadow-xs shrink-0 overflow-hidden">
                        <CompanyLogo
                          src={app.companyLogo}
                          company={app.company}
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

                        {app.nextStepTitle && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{app.nextStepTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B6880] dark:text-[#A5A0BA] mb-1">
                          Admissions Stage
                        </label>
                        <select
                          value={app.stage}
                          onChange={(e) => handleUpdateStage(app.id, e.target.value as Application['stage'])}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
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
                          <option value="archived">Archived / Closed</option>
                        </select>
                      </div>
                    </div>

                    {/* Admin Exclusive Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      
                      {/* Review Candidate Profile */}
                      <button
                        onClick={() => {
                          setReviewingApp(app);
                          setReviewerNoteDraft(app.notes || '');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 hover:border-[#7C6CF0] text-[#2D2A3E] dark:text-[#F2EEFF] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#7C6CF0]" />
                        <span>Inspect Profile</span>
                      </button>

                      {/* Schedule Interview Call Button */}
                      <button
                        onClick={() => handleOpenInterviewScheduler(app)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF8A65]/15 hover:bg-[#FF8A65]/25 text-[#9f4122] dark:text-[#FFA07A] border border-[#FF8A65]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Schedule official remote video interview"
                      >
                        <Video className="w-3.5 h-3.5 text-[#FF8A65]" />
                        <span>Schedule Interview Call</span>
                      </button>

                      {/* Issue Automated Offer Letter Button */}
                      {app.offerLetter ? (
                        <button
                          onClick={() => setViewingOffer({ offer: app.offerLetter!, applicationId: app.id })}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#006949] dark:text-[#5EE3B0] border border-[#34D399]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5 text-[#34D399]" />
                          <span>View Official Offer 📜</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenOfferComposer(app)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: REMOTE INTERNSHIPS MANAGEMENT (ADD / EDIT) */}
      {/* ======================================================== */}
      {activeTab === 'internships' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Internships */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-3" />
              <input
                type="text"
                value={internshipSearchQuery}
                onChange={(e) => setInternshipSearchQuery(e.target.value)}
                placeholder="Search remote role, company, or city..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                Total: <strong className="text-[#2D2A3E] dark:text-[#F2EEFF]">{filteredInternships.length}</strong> roles
              </span>
              <button
                onClick={handleOpenAddInternship}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Remote Internship</span>
              </button>
            </div>
          </div>

          {/* Internships Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInternships.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow flex flex-col justify-between gap-4 hover:border-[#7C6CF0]/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#7C6CF0]/10 shrink-0 overflow-hidden">
                        <CompanyLogo
                          src={item.companyLogo}
                          company={item.company}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF]">
                          {item.company}
                        </div>
                        <h4 className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] line-clamp-2 leading-relaxed">
                    {item.friendlyDescription}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {(item.noJargonSkills || []).slice(0, 4).map((sk, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#7C6CF0] dark:text-[#A99CFF]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Edit & Delete actions */}
                <div className="pt-3 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA]">
                    Season: {item.season || 'Summer 2026'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditInternship(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#7C6CF0]/10 hover:bg-[#7C6CF0]/20 text-[#7C6CF0] dark:text-[#A99CFF] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteInternship(item.id, item.title)}
                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove internship"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: USER SIGNUPS & LOGINS AUDIT */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] space-y-4">
            
            {/* Search & Dropdown Filters Row */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Search Users by Name, University, Grad Year, Email */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-[#6B6880] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search students by name, university, grad year, or email..."
                  aria-label="Search students by name, university, graduation year, or email"
                  className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#6B6880] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by University */}
              <div className="relative sm:w-56">
                <Building2 className="w-3.5 h-3.5 text-[#7C6CF0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={userUniversityFilter}
                  onChange={(e) => setUserUniversityFilter(e.target.value)}
                  aria-label="Filter by university"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0] cursor-pointer"
                >
                  <option value="All">All Universities</option>
                  {uniqueUserUniversities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Graduation Year */}
              <div className="relative sm:w-44">
                <GraduationCap className="w-3.5 h-3.5 text-[#7C6CF0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={userGradYearFilter}
                  onChange={(e) => setUserGradYearFilter(e.target.value)}
                  aria-label="Filter by graduation year"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0] cursor-pointer"
                >
                  <option value="All">All Grad Years</option>
                  {uniqueUserGradYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr === 'Staff' ? 'Staff' : `Class of ${yr}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Role */}
              <div className="relative sm:w-40">
                <Filter className="w-3.5 h-3.5 text-[#7C6CF0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as 'All' | 'student' | 'admin')}
                  aria-label="Filter by account role"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0] cursor-pointer"
                >
                  <option value="All">All Accounts</option>
                  <option value="student">Students Only</option>
                  <option value="admin">Staff Admins</option>
                </select>
              </div>
            </div>

            {/* Summary Metrics & Reset Bar */}
            <div className="pt-3 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6880] dark:text-[#A5A0BA]">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span>
                  Showing <strong className="text-[#2D2A3E] dark:text-[#F2EEFF]">{filteredUsers.length}</strong> of{' '}
                  <strong className="text-[#2D2A3E] dark:text-[#F2EEFF]">{registeredUsers.length}</strong> signups
                </span>
                <span>·</span>
                <span>
                  Students: <strong className="text-[#7C6CF0]">{registeredUsers.filter(u => u.role !== 'admin').length}</strong>
                </span>
                <span>·</span>
                <span>
                  Staff Admins: <strong className="text-emerald-500">{registeredUsers.filter(u => u.role === 'admin').length}</strong>
                </span>
              </div>

              {hasActiveUserFilters && (
                <button
                  type="button"
                  onClick={resetUserFilters}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold text-[#7C6CF0] dark:text-[#A99CFF] bg-[#7C6CF0]/10 hover:bg-[#7C6CF0]/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* User Directory Table */}
          <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] overflow-hidden cozy-card-shadow">
            <div className="p-5 border-b border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  User Signups & Verified Logins ({filteredUsers.length})
                </h3>
              </div>
              <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA]">
                Database: PostgreSQL Auth Vault
              </span>
            </div>

            {usersError && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
                <span>{usersError}</span>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="font-bold underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {loadingUsers && registeredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#6B6880]">
                Loading verified accounts from PostgreSQL...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-[#6B6880] dark:text-[#A5A0BA] space-y-3">
                <Users className="w-8 h-8 mx-auto text-[#7C6CF0]/40" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">
                    No students or accounts match your filters
                  </p>
                  <p className="text-xs">
                    Try adjusting the name search, university, or graduation year filter.
                  </p>
                </div>
                {hasActiveUserFilters && (
                  <button
                    type="button"
                    onClick={resetUserFilters}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#7C6CF0]/10 hover:bg-[#7C6CF0]/20 text-[#7C6CF0] dark:text-[#A99CFF] transition-colors cursor-pointer"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#7C6CF0]/10 dark:divide-[#3D3759] overflow-x-auto">
                {filteredUsers.map((u) => {
                  const userAppsCount = applicants.filter((a) => a.applicantEmail === u.email || a.userId === u.id).length;

                  return (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 hover:bg-[#FFF8F0]/40 dark:hover:bg-[#1E1A2C]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C6CF0] to-[#34D399] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#2D2A3E] dark:text-[#F2EEFF]">
                              {u.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                u.role === 'admin'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-[#7C6CF0]/10 text-[#7C6CF0] dark:text-[#A99CFF]'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admissions Lead' : 'Student Fellow'}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E1A2C] text-[#6B6880] dark:text-[#A5A0BA] border border-[#7C6CF0]/15">
                              {u.authProvider === 'google' ? 'Google Auth' : u.authProvider === 'admin' ? 'Admin Vault' : 'Email Auth'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-2">
                            <Mail className="w-3 h-3 text-[#7C6CF0]" />
                            <span>{u.email}</span>
                            <span>·</span>
                            <span>{u.university}</span>
                          </div>

                          <div className="text-[10px] text-[#6B6880]/80 dark:text-[#A5A0BA]/80">
                            Major: {u.major} · Grad: {u.gradYear}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-center">
                          <span className="text-[10px] text-[#6B6880] dark:text-[#A5A0BA] block">Logins</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{u.loginCount ?? 1}x verified</span>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-center">
                          <span className="text-[10px] text-[#6B6880] dark:text-[#A5A0BA] block">Applications</span>
                          <span className="font-bold text-[#7C6CF0] text-xs">{userAppsCount} submitted</span>
                        </div>

                        <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] text-right space-y-0.5">
                          {u.lastLoginAt && (
                            <div>
                              Last login:{' '}
                              <span className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">
                                {new Date(u.lastLoginAt).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          {u.createdAt && (
                            <div className="text-[10px]">
                              Joined: {new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SCHEDULE INTERVIEW CALL */}
      {/* ======================================================== */}
      {schedulingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#26223A] border border-[#FF8A65]/30 shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-b border-[#FF8A65]/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FF8A65]/20 text-[#FF8A65]">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#FF8A65] uppercase tracking-wider block">
                    Admissions Interview Jam
                  </span>
                  <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                    Schedule Call with {schedulingApp.applicantName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSchedulingApp(null)}
                className="p-2 rounded-full text-[#6B6880] hover:bg-[#FF8A65]/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Interview Jam Title
                </label>
                <input
                  type="text"
                  value={interviewTitleInput}
                  onChange={(e) => setInterviewTitleInput(e.target.value)}
                  placeholder="e.g. Pair Programming Jam & Systems Exploration"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#FF8A65]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF8A65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Date & Time (IST)
                </label>
                <input
                  type="datetime-local"
                  value={interviewDateInput}
                  onChange={(e) => setInterviewDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#FF8A65]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF8A65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Remote Video Call URL (Google Meet / Zoom)
                </label>
                <input
                  type="url"
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#FF8A65]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF8A65]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Preparation Notes / Agenda for Student
                </label>
                <textarea
                  rows={3}
                  value={interviewerNotesInput}
                  onChange={(e) => setInterviewerNotesInput(e.target.value)}
                  placeholder="Notes about portfolio review or topic..."
                  className="w-full p-3 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#FF8A65]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF8A65]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-t border-[#FF8A65]/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSchedulingApp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6880] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={schedulingLoading}
                onClick={handleScheduleInterview}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#FF8A65] hover:bg-[#f17b55] text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {schedulingLoading ? (
                  <span>Scheduling Call...</span>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Confirm & Schedule Interview Call</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT INTERNSHIP */}
      {/* ======================================================== */}
      {isInternshipModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#26223A] border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-6 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Workvanta Curriculum & Roles
                  </span>
                  <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                    {editingInternshipId ? 'Edit Remote Internship' : 'Add New Remote Internship'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsInternshipModalOpen(false)}
                className="p-2 rounded-full text-[#6B6880] hover:bg-emerald-500/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInternship} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Role Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={internshipForm.title}
                      onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                      placeholder="e.g. Frontend Engineering Fellow"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={internshipForm.company}
                      onChange={(e) => setInternshipForm({ ...internshipForm, company: e.target.value })}
                      placeholder="e.g. Postman, Razorpay, Linear"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Remote Location (India)
                    </label>
                    <input
                      type="text"
                      value={internshipForm.location}
                      onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                      placeholder="e.g. Remote — Bengaluru, India"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Category
                    </label>
                    <select
                      value={internshipForm.category}
                      onChange={(e) => setInternshipForm({ ...internshipForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Data & AI">Data & AI</option>
                      <option value="Developer Relations">Developer Relations</option>
                      <option value="Product Management">Product Management</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Company Logo URL
                  </label>
                  <input
                    type="text"
                    value={internshipForm.companyLogo}
                    onChange={(e) => setInternshipForm({ ...internshipForm, companyLogo: e.target.value })}
                    placeholder="/logos/workvanta-default.svg or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Friendly Role Description
                  </label>
                  <textarea
                    rows={2}
                    value={internshipForm.friendlyDescription}
                    onChange={(e) => setInternshipForm({ ...internshipForm, friendlyDescription: e.target.value })}
                    placeholder="Provide a welcoming overview of the remote fellowship role..."
                    className="w-full p-3 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Key Responsibilities (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={internshipForm.responsibilitiesText}
                    onChange={(e) => setInternshipForm({ ...internshipForm, responsibilitiesText: e.target.value })}
                    placeholder="Build core user features\nCollaborate on design system tokens\nWrite thoughtful unit tests"
                    className="w-full p-3 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={internshipForm.skillsText}
                      onChange={(e) => setInternshipForm({ ...internshipForm, skillsText: e.target.value })}
                      placeholder="React, TypeScript, Figma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Program Season
                    </label>
                    <input
                      type="text"
                      value={internshipForm.season}
                      onChange={(e) => setInternshipForm({ ...internshipForm, season: e.target.value })}
                      placeholder="Summer 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

              </div>

              <div className="p-4 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-t border-emerald-500/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsInternshipModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B6880] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInternship}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingInternship ? (
                    <span>Saving Listing...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingInternshipId ? 'Save Changes' : 'Publish Internship'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CANDIDATE INSPECTION MODAL */}
      {/* ======================================================== */}
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
                className="p-2 rounded-full text-[#6B6880] hover:bg-[#7C6CF0]/10 cursor-pointer"
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
                  type="button"
                  onClick={() => {
                    handleUpdateStage(reviewingApp.id, reviewingApp.stage, reviewerNoteDraft);
                    setActionSuccessMsg('Recruiter notes updated successfully');
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#7C6CF0] text-white text-xs font-bold cursor-pointer"
                >
                  Save Internal Notes
                </button>
              </div>

            </div>

            <div className="p-4 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6880] cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = reviewingApp;
                    setReviewingApp(null);
                    handleOpenInterviewScheduler(target);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#FF8A65]/15 hover:bg-[#FF8A65]/25 text-[#9f4122] dark:text-[#FFA07A] flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Schedule Interview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = reviewingApp;
                    setReviewingApp(null);
                    handleOpenOfferComposer(target);
                  }}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-[#7C6CF0] text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Offer Letter</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: AUTOMATED OFFER LETTER COMPOSER */}
      {/* ======================================================== */}
      {composingOfferApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-6 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#6E8B6E] dark:text-[#A9C7A9] uppercase tracking-wider block">
                  Skillora Official Offer Letter Template
                </span>
                <h3 className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  Generate Offer Letter for {composingOfferApp.applicantName}
                </h3>
              </div>
              <button
                onClick={() => setComposingOfferApp(null)}
                className="p-2 rounded-full text-[#6B6880] hover:bg-[#7C6CF0]/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Candidate Name (To:)
                  </label>
                  <input
                    type="text"
                    value={offerNameInput}
                    onChange={(e) => setOfferNameInput(e.target.value)}
                    placeholder="e.g. Hritik Pal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Offer Date
                  </label>
                  <input
                    type="text"
                    value={offerDateInput}
                    onChange={(e) => setOfferDateInput(e.target.value)}
                    placeholder="e.g. November 14, 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Internship Domain
                  </label>
                  <input
                    type="text"
                    value={offerDomainInput}
                    onChange={(e) => setOfferDomainInput(e.target.value)}
                    placeholder="e.g. Python Programing"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF8F0]/70 dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 space-y-2 text-[#2D2A3E] dark:text-[#F2EEFF]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E8B6E] dark:text-[#A9C7A9]">
                  Locked Template Preview (Only Name, Date &amp; Domain Change)
                </div>
                <div className="flex justify-between font-semibold text-xs pt-1">
                  <span>To: {offerNameInput || 'Candidate'}</span>
                  <span>{offerDateInput || 'November 14, 2026'}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#474554] dark:text-[#A5A0BA]">
                  Dear Candidate, Congratulations! We’re pleased to inform you that you have successfully registered for the <strong className="text-[#2D2A3E] dark:text-[#F2EEFF]">{offerDomainInput || 'Software Engineering'}</strong> Internship Program at Skillora...
                </p>
                <div className="flex justify-between text-[11px] text-[#6B6880] dark:text-[#A5A0BA] pt-1 border-t border-[#7C6CF0]/10">
                  <span>Signed: Aditya Jain · Founder</span>
                  <span>6394050860 · adityajain22112006@gmail.com</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FFF8F0] dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setComposingOfferApp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6880] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={sendingOffer}
                onClick={handleSendAutomatedOffer}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#34D399] hover:bg-[#2ecc8e] text-[#052e16] flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingOffer ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#052e16] border-t-transparent rounded-full animate-spin" />
                    <span>Generating Offer Letter...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Generate &amp; Send Offer Letter</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: OFFICIAL OFFER LETTER VIEWER */}
      {/* ======================================================== */}
      {viewingOffer && (
        <OfferLetterModal
          offer={viewingOffer.offer}
          applicationId={viewingOffer.applicationId}
          onClose={() => setViewingOffer(null)}
        />
      )}

    </div>
  );
};
