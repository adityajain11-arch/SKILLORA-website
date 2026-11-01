import React from 'react';
import { ShieldCheck, Laptop, Wifi, Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onTrackerClick: () => void;
  roleCount: number;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onTrackerClick, roleCount }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 md:py-16">
      {/* Gentle ambient background glow */}
      <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-[#7C6CF0]/10 dark:bg-[#A99CFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -z-10 w-80 h-80 bg-[#FF8A65]/10 dark:bg-[#FFA07A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Narrative & Intent */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Compassionate kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A65]" />
              <span>Workvanta — 100% Remote Tech Internships in India</span>
            </div>

            {/* Display headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF] leading-[1.15]" style={{ textWrap: 'balance' }}>
              Remote internships across India without the corporate gatekeeping.
            </h1>

            {/* Supportive body description */}
            <p className="text-base sm:text-lg text-[#6B6880] dark:text-[#A5A0BA] leading-relaxed max-w-2xl">
              Work from your hostel, hometown, or coffee shop. Discover verified remote engineering, design, and product internships at top tech startups and global engineering hubs in India.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 rounded-full bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex items-center gap-2 group whitespace-nowrap"
              >
                <span>Browse {roleCount} Remote Roles in India</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onTrackerClick}
                className="px-6 py-3.5 rounded-full bg-white dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] text-[#2D2A3E] dark:text-[#F2EEFF] hover:border-[#7C6CF0] font-semibold text-sm shadow-xs transition-all whitespace-nowrap"
              >
                View My Career Journey
              </button>
            </div>

            {/* 3 Pillars Micro Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#6B6880] dark:text-[#A5A0BA]">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#34D399]" />
                <span className="font-medium text-[#2D2A3E] dark:text-[#F2EEFF]">100% Remote Anywhere in India</span>
              </div>
              <span className="text-[#c9c4d6] dark:text-[#474554] hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7C6CF0] dark:text-[#A99CFF]" />
                <span className="font-medium text-[#2D2A3E] dark:text-[#F2EEFF]">Direct Engineering Pods</span>
              </div>
              <span className="text-[#c9c4d6] dark:text-[#474554] hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#FF8A65]" />
                <span className="font-medium text-[#2D2A3E] dark:text-[#F2EEFF]">Hardware & Tech Setup Provided</span>
              </div>
            </div>

          </div>

          {/* Right Column: Workvanta Remote Workspace Image */}
          <div className="lg:col-span-5">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#7C6CF0]/20 to-[#FF8A65]/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#26223A] border border-white/60 dark:border-[#3D3759] shadow-xl">
                <img
                  src="/src/assets/images/cozy_intern_hero_1793543619075.jpg"
                  alt="Remote student study workspace in India"
                  className="w-full h-72 sm:h-84 object-cover object-center transform group-hover:scale-102 transition duration-700"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 dark:bg-[#26223A]/95 backdrop-blur-md border border-white/40 dark:border-[#3D3759] shadow-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider">
                      Workvanta Remote Cohort
                    </div>
                    <div className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                      Pan-India Applications Open
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0] text-xs font-bold">
                    100% Remote
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* 4-column KPI strip below the hero split */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/10 dark:border-[#3D3759] cozy-card-shadow">
          <div>
            <div className="text-2xl font-extrabold text-[#7C6CF0] dark:text-[#A99CFF] tabular-nums">
              100%
            </div>
            <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium mt-0.5">
              Remote Across India
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF] tabular-nums">
              Pan-India
            </div>
            <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium mt-0.5">
              Bengaluru, Mumbai, Delhi & More
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-[#34D399] dark:text-[#5EE3B0] tabular-nums">
              Verified
            </div>
            <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium mt-0.5">
              Fully Sponsored Fellowships
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-[#FF8A65] dark:text-[#FFA07A] tabular-nums">
              &lt; 14 Days
            </div>
            <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium mt-0.5">
              Transparent Decision Time
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
