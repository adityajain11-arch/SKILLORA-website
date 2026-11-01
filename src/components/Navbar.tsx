import React, { useState } from 'react';
import { Sparkles, Moon, Sun, LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  currentTab: 'discover' | 'tracker' | 'reviews' | 'profile' | 'login' | 'admin';
  setCurrentTab: (tab: 'discover' | 'tracker' | 'reviews' | 'profile' | 'login' | 'admin') => void;
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
  isDark,
  setIsDark,
  savedCount,
  appliedCount,
  currentUser,
  onLogout
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const isGuest = !currentUser;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FFF8F0]/90 dark:bg-[#1B1826]/90 border-b border-[#7C6CF0]/10 dark:border-[#3D3759] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setCurrentTab('discover')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF] whitespace-nowrap shrink-0">
            Workvanta
          </span>
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('discover')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              currentTab === 'discover'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-semibold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            Explore Remote Roles
            {currentTab === 'discover' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('tracker')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
              currentTab === 'tracker'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-semibold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            Career Journey
            {appliedCount > 0 && (
              <span className="w-5 h-5 text-xs rounded-full bg-[#7C6CF0]/15 dark:bg-[#A99CFF]/25 text-[#7C6CF0] dark:text-[#A99CFF] font-semibold flex items-center justify-center">
                {appliedCount}
              </span>
            )}
            {currentTab === 'tracker' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('reviews')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
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
            onClick={() => setCurrentTab('admin')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'text-[#7C6CF0] dark:text-[#A99CFF] font-bold'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]'
            }`}
          >
            <span>Admin Portal</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7C6CF0]/15 text-[#7C6CF0] dark:text-[#A99CFF] font-extrabold uppercase tracking-wider">
              Recruiter
            </span>
            {currentTab === 'admin' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C6CF0] dark:bg-[#A99CFF] rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action (+ subtle theme toggle) */}
        <div className="flex items-center gap-3 shrink-0 relative">
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 dark:hover:bg-[#3D3759] transition-colors focus:outline-none"
          >
            {isDark ? <Sun className="w-5 h-5 text-[#FFA07A]" /> : <Moon className="w-5 h-5 text-[#7C6CF0]" />}
          </button>

          {isGuest ? (
            <button
              onClick={() => setCurrentTab('login')}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                currentTab === 'login'
                  ? 'bg-[#7C6CF0] text-white shadow-md'
                  : 'bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-xs'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] hover:border-[#7C6CF0] transition-all flex items-center gap-2 shadow-xs"
              >
                <div className="w-2 h-2 rounded-full bg-[#34D399]" />
                <span className="truncate max-w-28 sm:max-w-36">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B6880]" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#7C6CF0]/10 dark:border-[#3D3759]">
                    <div className="font-bold text-[#2D2A3E] dark:text-[#F2EEFF] truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] truncate">
                      {currentUser.university}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setCurrentTab('profile');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#7C6CF0]/10 flex items-center gap-2 text-[#2D2A3E] dark:text-[#F2EEFF]"
                  >
                    <User className="w-3.5 h-3.5 text-[#7C6CF0]" />
                    <span>My Workvanta Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setCurrentTab('admin');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#7C6CF0]/10 flex items-center gap-2 text-[#7C6CF0] dark:text-[#A99CFF] font-semibold border-t border-[#7C6CF0]/10 dark:border-[#3D3759]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recruiter Admin Portal</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#ffdad6]/40 text-[#ba1a1a] dark:text-[#ffb4ab] flex items-center gap-2 border-t border-[#7C6CF0]/10 dark:border-[#3D3759]"
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
    </header>
  );
};
