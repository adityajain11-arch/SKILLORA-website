import React, { useState } from 'react';
import { Sparkles, Moon, Sun, LogIn, LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { AuthUser } from '../types';

export type AppTab =
  | 'discover'
  | 'tracker'
  | 'reviews'
  | 'coach'
  | 'profile'
  | 'login'
  | 'admin-login'
  | 'admin';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  authMode: 'signup' | 'signin';
  onOpenAuth: (mode: 'signup' | 'signin') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  savedCount: number;
  appliedCount: number;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  authMode,
  onOpenAuth,
  isDark,
  setIsDark,
  appliedCount,
  currentUser,
  onLogout
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isGuest = !currentUser;

  const navigateTo = (tab: AppTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FFF8F0]/95 dark:bg-[#1B1826]/95 border-b border-[#7C6CF0]/10 dark:border-[#3D3759] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Zone 1: Brand Wordmark (+ mobile menu trigger) */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 -ml-1 rounded-xl text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/10 dark:hover:bg-[#3D3759] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => navigateTo('discover')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF] whitespace-nowrap shrink-0">
              Workvanta
            </span>
          </button>
        </div>

        {/* Zone 2: Desktop Single-line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium">
          <button
            onClick={() => navigateTo('discover')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer ${
              currentTab === 'discover'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-semibold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            Explore Internships
            {currentTab === 'discover' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => navigateTo('tracker')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'tracker'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-semibold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            Tracker
            {appliedCount > 0 && (
              <span className="w-5 h-5 text-xs rounded-full bg-[#7C6CF0]/15 dark:bg-[#A99CFF]/25 text-[#7C6CF0] dark:text-[#A99CFF] font-semibold flex items-center justify-center tabular-nums">
                {appliedCount}
              </span>
            )}
            {currentTab === 'tracker' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => navigateTo('reviews')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer ${
              currentTab === 'reviews'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-semibold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            Real Reviews
            {currentTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => navigateTo('coach')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer ${
              currentTab === 'coach'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-semibold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            AI Coach & Voice
            {currentTab === 'coach' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>

          {/* STRICTLY RESTRICTED: Admin Portal ONLY visible to authenticated Admins */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => navigateTo('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'admin'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
              }`}
            >
              <span>Admin Console</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
                Admin
              </span>
              {currentTab === 'admin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Theme toggle & Auth Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 relative">
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 dark:hover:bg-[#3D3759] transition-colors focus:outline-none cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFA07A]" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C6CF0]" />}
          </button>

          {isGuest ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-full border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'login' && authMode === 'signin'
                    ? 'border-[#7C6CF0] bg-[#7C6CF0]/10 text-[#7C6CF0] dark:border-[#A99CFF] dark:text-[#A99CFF]'
                    : 'border-[#7C6CF0]/35 dark:border-[#3D3759] text-[#2D2A3E] dark:text-[#F2EEFF] hover:border-[#7C6CF0] hover:text-[#7C6CF0] dark:hover:text-[#A99CFF]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'login' && authMode === 'signup'
                    ? 'bg-[#6a59e6] dark:bg-[#A99CFF] text-white dark:text-[#1B1826] shadow-md'
                    : 'bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-xs'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 hidden sm:inline" />
                <span>Sign Up</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] hover:border-[#7C6CF0] transition-all flex items-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-[#34D399] shrink-0" />
                <span className="truncate max-w-20 sm:max-w-36">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B6880] shrink-0" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#7C6CF0]/10 dark:border-[#3D3759]">
                    <div className="font-bold text-[#2D2A3E] dark:text-[#F2EEFF] truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] truncate">
                      {currentUser.university}
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('profile')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#7C6CF0]/10 flex items-center gap-2 text-[#2D2A3E] dark:text-[#F2EEFF] cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#7C6CF0]" />
                    <span>My Workvanta Profile</span>
                  </button>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => navigateTo('admin')}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#7C6CF0]/10 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold border-t border-[#7C6CF0]/10 dark:border-[#3D3759] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Admissions Console</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#ffdad6]/40 text-[#ba1a1a] dark:text-[#ffb4ab] flex items-center gap-2 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer (< md) */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-[#7C6CF0]/10 dark:border-[#3D3759] bg-[#FFF8F0] dark:bg-[#1B1826] px-4 py-3 space-y-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <button
            onClick={() => navigateTo('discover')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'discover'
                ? 'bg-[#7C6CF0]/12 text-[#7C6CF0] dark:text-[#A99CFF]'
                : 'text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/8'
            }`}
          >
            Explore Internships
          </button>

          <button
            onClick={() => navigateTo('tracker')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${
              currentTab === 'tracker'
                ? 'bg-[#7C6CF0]/12 text-[#7C6CF0] dark:text-[#A99CFF]'
                : 'text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/8'
            }`}
          >
            <span>Tracker</span>
            {appliedCount > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#7C6CF0]/15 dark:bg-[#A99CFF]/25 text-[#7C6CF0] dark:text-[#A99CFF] font-bold tabular-nums">
                {appliedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigateTo('reviews')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'reviews'
                ? 'bg-[#7C6CF0]/12 text-[#7C6CF0] dark:text-[#A99CFF]'
                : 'text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/8'
            }`}
          >
            Real Reviews
          </button>

          <button
            onClick={() => navigateTo('coach')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'coach'
                ? 'bg-[#7C6CF0]/12 text-[#7C6CF0] dark:text-[#A99CFF]'
                : 'text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/8'
            }`}
          >
            AI Coach &amp; Voice
          </button>

          {!isGuest && (
            <button
              onClick={() => navigateTo('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-[#7C6CF0]/12 text-[#7C6CF0] dark:text-[#A99CFF]'
                  : 'text-[#2D2A3E] dark:text-[#F2EEFF] hover:bg-[#7C6CF0]/8'
              }`}
            >
              My Profile
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => navigateTo('admin')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span>Admin Console</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 uppercase tracking-wider">
                Admin
              </span>
            </button>
          )}
        </nav>
      )}
    </header>
  );
};
