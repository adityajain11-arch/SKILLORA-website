import React from 'react';
import { Bookmark, MapPin, Sparkles, CheckCircle2, ArrowUpRight, Laptop } from 'lucide-react';
import { Internship } from '../types';

interface InternshipCardProps {
  internship: Internship;
  onSelect: (internship: Internship) => void;
  onApply: (internship: Internship) => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  onSelect,
  onApply,
  onToggleBookmark,
  isBookmarked
}) => {
  return (
    <div className="group relative rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] p-6 cozy-card-shadow cozy-card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
      
      {/* Top Header: Company Avatar, Title, and Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#FFF8F0] dark:bg-[#1B1826] border border-[#7C6CF0]/15 dark:border-[#3D3759] overflow-hidden p-1.5 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={internship.companyLogo}
                alt={`${internship.company} logo`}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider">
                  {internship.company}
                </span>
                <span className="text-[#c9c4d6] dark:text-[#474554]">·</span>
                <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium">
                  {internship.season}
                </span>
              </div>
              <h3
                onClick={() => onSelect(internship)}
                className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF] group-hover:text-[#7C6CF0] dark:group-hover:text-[#A99CFF] transition-colors cursor-pointer mt-0.5 line-clamp-1"
              >
                {internship.title}
              </h3>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(internship.id)}
            aria-label={isBookmarked ? 'Remove from saved' : 'Save internship'}
            className={`p-2 rounded-full transition-all focus:outline-none shrink-0 ${
              isBookmarked
                ? 'bg-[#FF8A65]/15 text-[#FF8A65]'
                : 'text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 dark:hover:bg-[#3D3759] hover:text-[#7C6CF0]'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-[#FF8A65]' : ''}`} />
          </button>
        </div>

        {/* Clean Unboxed Metadata with · separator */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B6880] dark:text-[#A5A0BA]">
          <span className="flex items-center gap-1 font-semibold text-[#006949] dark:text-[#5EE3B0]">
            <Laptop className="w-3.5 h-3.5" />
            {internship.location}
          </span>
          <span aria-hidden="true">·</span>
          <span>Closes {new Date(internship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span aria-hidden="true">·</span>
          <span>{internship.category}</span>
        </div>

        {/* Friendly human description */}
        <p className="mt-3.5 text-sm text-[#474554] dark:text-[#A5A0BA] line-clamp-2 leading-relaxed">
          {internship.friendlyDescription}
        </p>

        {/* Fellowship Status & Match Score Row */}
        <div className="mt-4 p-3 rounded-2xl bg-[#FFF8F0]/70 dark:bg-[#1B1826]/60 border border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium">Remote Fellowship</div>
            <div className="text-sm font-bold text-[#006949] dark:text-[#5EE3B0] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Direct Engineering Pod</span>
            </div>
          </div>

          {/* Rounded Ring Meter with supportive score copy */}
          <div className="flex items-center gap-2 text-right">
            <div>
              <div className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] tabular-nums">
                {internship.matchScore}% Match
              </div>
              <div className="text-[10px] text-[#6B6880] dark:text-[#A5A0BA]">
                Great Fit
              </div>
            </div>
            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#7C6CF0]/15 dark:text-[#3D3759]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#7C6CF0] dark:text-[#A99CFF]"
                  strokeDasharray={`${internship.matchScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A65] absolute" />
            </div>
          </div>
        </div>

        {/* Culture & Role Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0]">
            100% Remote India
          </span>
          {internship.culturePillars.slice(0, 3).map((pillar, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#7C6CF0]/10 text-[#5846ca] dark:text-[#c7bfff]"
            >
              {pillar}
            </span>
          ))}
        </div>

      </div>

      {/* Footer: Details & Apply Actions (Mentor section removed) */}
      <div className="mt-5 pt-4 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between gap-3">
        <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#7C6CF0]" />
          <span className="truncate">{internship.location}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelect(internship)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/10 transition-colors whitespace-nowrap"
          >
            Details
          </button>
          <button
            onClick={() => onApply(internship)}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-xs hover:shadow-md transition-all flex items-center gap-1 whitespace-nowrap"
          >
            <span>Apply</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
