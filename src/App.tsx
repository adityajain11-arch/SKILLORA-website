import React, { useState, useEffect } from 'react';
import { Internship, Application, UserProfile, AuthUser } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchAndFilters } from './components/SearchAndFilters';
import { InternshipCard } from './components/InternshipCard';
import { InternshipDetailModal } from './components/InternshipDetailModal';
import { ApplicationModal } from './components/ApplicationModal';
import { ApplicationTracker } from './components/ApplicationTracker';
import { ReviewsView } from './components/ReviewsView';
import { ProfileView } from './components/ProfileView';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Sparkles, Bookmark, UserCheck, Laptop } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'discover' | 'tracker' | 'reviews' | 'profile' | 'login' | 'admin'>('discover');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('haven_theme') === 'dark';
    }
    return false;
  });

  // Private session: starts as null unless logged in
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [internships, setInternships] = useState<Internship[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Student Builder',
    university: 'IIT Bombay',
    major: 'Computer Science & Engineering',
    gradYear: '2027',
    gpa: '3.85',
    bio: 'Early-career builder creating calm, tactile software and accessible developer tools. Passionate about typography, responsive performance, and high-empathy team culture.',
    skills: ['TypeScript', 'React', 'Node.js', 'UI/UX Design', 'Tailwind CSS', 'SQL', 'Git', 'Figma'],
    preferredRoles: ['Frontend Engineering', 'Product Design', 'Full-Stack'],
    desiredStipendMin: 45,
    preferredWorkType: 'Remote',
    portfolioUrl: 'https://github.com',
    githubUrl: 'https://github.com',
    linkedinUrl: 'https://linkedin.com',
    uploadedResumeName: 'Student_Resume_2026.pdf'
  });

  // Filter States (Strictly Remote in India)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [applyingInternship, setApplyingInternship] = useState<Internship | null>(null);
  const [loginToast, setLoginToast] = useState<string | null>(null);

  // Dark mode class toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('haven_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('haven_theme', 'light');
    }
  }, [isDark]);

  const TOKEN_KEY = 'workvanta_auth_token';

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch initial data from Express backend with token
  const fetchAuthUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setCurrentUser(null);
        setApplications([]);
        setBookmarks([]);
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        // Automatically fetch isolated private data for this user
        fetchApplications();
        fetchBookmarks();
        fetchProfile();
      }
    } catch (err) {
      console.error('Failed to fetch auth user', err);
    }
  };

  const fetchInternships = async () => {
    try {
      const res = await fetch('/api/internships', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setInternships(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setApplications([]);
      return;
    }
    try {
      const res = await fetch('/api/applications', {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        setApplications([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setApplications(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookmarks = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setBookmarks([]);
      return;
    }
    try {
      const res = await fetch('/api/bookmarks', {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        setBookmarks([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBookmarks(data.bookmarks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return;
    try {
      const res = await fetch('/api/user-profile', {
        headers: getAuthHeaders()
      });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success && data.data) {
        setUserProfile(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuthUser();
    fetchInternships();
  }, []);

  // Private login handler
  const handleLoginSuccess = (user: AuthUser, token?: string) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    setCurrentUser(user);
    setUserProfile((prev) => ({
      ...prev,
      name: user.name,
      university: user.university,
      major: user.major || prev.major,
      gradYear: user.gradYear || prev.gradYear
    }));
    setLoginToast(`Private session active for ${user.name}`);
    setTimeout(() => setLoginToast(null), 3500);
    setCurrentTab('discover');

    // Fetch user-isolated private data immediately
    setTimeout(() => {
      fetchApplications();
      fetchBookmarks();
      fetchProfile();
      fetchInternships();
    }, 50);
  };

  // Private logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setCurrentUser(null);
      setApplications([]);
      setBookmarks([]);
      setLoginToast('Signed out of Workvanta');
      setTimeout(() => setLoginToast(null), 3000);
      fetchInternships();
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = async (id: string) => {
    if (!currentUser) {
      setLoginToast('Please sign in privately to save roles to your dashboard');
      setTimeout(() => setLoginToast(null), 3500);
      setCurrentTab('login');
      return;
    }

    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ internshipId: id })
      });
      if (res.status === 401) {
        setCurrentUser(null);
        localStorage.removeItem(TOKEN_KEY);
        setCurrentTab('login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBookmarks(data.bookmarks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Application stage update
  const handleUpdateApplicationStage = async (id: string, stage: Application['stage']) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ stage })
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((a) => (a.id === id ? data.data : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Application notes update
  const handleUpdateApplicationNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((a) => (a.id === id ? data.data : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Application delete
  const handleDeleteApplication = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Application success callback
  const handleApplicationSuccess = (newApp: Application) => {
    setApplications([newApp, ...applications]);
    setApplyingInternship(null);
    setCurrentTab('tracker');
  };

  // Filter computation (Strictly Remote in India)
  const filteredInternships = internships.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchText =
        item.title.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.culturePillars.some((p) => p.toLowerCase().includes(q)) ||
        item.noJargonSkills.some((s) => s.toLowerCase().includes(q));
      if (!matchText) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#1B1826] text-[#2D2A3E] dark:text-[#F2EEFF] transition-colors flex flex-col font-sans">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isDark={isDark}
        setIsDark={setIsDark}
        savedCount={bookmarks.length}
        appliedCount={applications.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Login notification toast */}
      {loginToast && (
        <div className="fixed top-20 right-4 z-50 p-3.5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2">
          <UserCheck className="w-4 h-4 text-[#34D399]" />
          <span>{loginToast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {currentTab === 'login' && (
          <LoginPage
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onBackToDiscover={() => setCurrentTab('discover')}
          />
        )}

        {currentTab === 'discover' && (
          <div className="space-y-6">
            <Hero
              onExploreClick={() => {
                const el = document.getElementById('roles-anchor');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onTrackerClick={() => setCurrentTab('tracker')}
              roleCount={internships.length}
            />

            <div id="roles-anchor" className="pt-4">
              <SearchAndFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onReset={handleResetFilters}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#34D399]" />
                  <span>Showing {filteredInternships.length} Remote Roles Across India</span>
                </div>
                {bookmarks.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                    }}
                    className="text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] flex items-center gap-1.5"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-[#FF8A65] text-[#FF8A65]" />
                    <span>{bookmarks.length} Roles Saved</span>
                  </button>
                )}
              </div>

              {filteredInternships.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF8A65]/15 text-[#FF8A65] mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">No remote roles match your exact search criteria</h3>
                  <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] max-w-md mx-auto">
                    Try broadening your category or clearing search terms to view all remote opportunities in India.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2 rounded-full text-xs font-bold bg-[#7C6CF0] text-white"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInternships.map((internship) => (
                    <InternshipCard
                      key={internship.id}
                      internship={internship}
                      isBookmarked={bookmarks.includes(internship.id)}
                      onSelect={(item) => setSelectedInternship(item)}
                      onApply={(item) => setApplyingInternship(item)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'tracker' && (
          <ApplicationTracker
            applications={applications}
            onUpdateStage={handleUpdateApplicationStage}
            onUpdateNotes={handleUpdateApplicationNotes}
            onDeleteApplication={handleDeleteApplication}
            onExploreMore={() => setCurrentTab('discover')}
          />
        )}

        {currentTab === 'reviews' && <ReviewsView />}

        {currentTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            internships={internships}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            onBackToDiscover={() => setCurrentTab('discover')}
          />
        )}
      </main>

      {/* Detail Modal */}
      {selectedInternship && (
        <InternshipDetailModal
          internship={selectedInternship}
          isBookmarked={bookmarks.includes(selectedInternship.id)}
          onClose={() => setSelectedInternship(null)}
          onApply={(item) => {
            setSelectedInternship(null);
            setApplyingInternship(item);
          }}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* Warm Application Modal */}
      {applyingInternship && (
        <ApplicationModal
          internship={applyingInternship}
          userProfile={userProfile}
          onClose={() => setApplyingInternship(null)}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Clean Editorial Footer */}
      <footer className="mt-16 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] bg-white/60 dark:bg-[#1E1A2C]/60 backdrop-blur-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6880] dark:text-[#A5A0BA]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] flex items-center justify-center text-white text-[10px] font-bold">
              ✦
            </div>
            <span className="font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF]">
              Workvanta
            </span>
            <span>— 100% Remote Tech Fellowships Across India</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentTab('discover')} className="hover:text-[#7C6CF0] transition-colors">
              Remote Roles
            </button>
            <button onClick={() => setCurrentTab('tracker')} className="hover:text-[#7C6CF0] transition-colors">
              Career Journey
            </button>
            <button onClick={() => setCurrentTab('reviews')} className="hover:text-[#7C6CF0] transition-colors">
              Reviews
            </button>
            <button onClick={() => setCurrentTab('admin')} className="hover:text-[#7C6CF0] transition-colors font-bold text-[#7C6CF0] dark:text-[#A99CFF]">
              Admin Portal
            </button>
            <button onClick={() => setCurrentTab('login')} className="hover:text-[#7C6CF0] transition-colors font-semibold">
              Private Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
