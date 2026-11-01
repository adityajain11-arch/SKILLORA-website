import React from 'react';
import { X, MapPin, CheckCircle2, Calendar, Sparkles, ArrowRight, Bookmark, Laptop, ShieldCheck } from 'lucide-react';
import { Internship } from '../types';

interface InternshipDetailModalProps {
  internship: Internship | null;
  onClose: () => void;
  onApply: (internship: Internship) => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
}

export const InternshipDetailModal: React.FC<InternshipDetailModalProps> = ({
  internship,
  onClose,
  onApply,
  onToggleBookmark,
  isBookmarked
}) => {
  if (!internship) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      {/* Modal Surface */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#FFF8F0] dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-6 bg-white dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF8F0] dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] p-2 overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <img
                src={internship.companyLogo}
                alt={internship.company}
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
                <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                  {internship.season}
                </span>
                <span className="text-[#c9c4d6] dark:text-[#474554]">·</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0] flex items-center gap-1">
                  <Laptop className="w-3 h-3" />
                  <span>100% Remote India</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-1">
                {internship.title}
              </h2>
              <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#7C6CF0]" />
                <span>{internship.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleBookmark(internship.id)}
              className={`p-2.5 rounded-full transition-all ${
                isBookmarked
                  ? 'bg-[#FF8A65]/15 text-[#FF8A65]'
                  : 'text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 hover:text-[#7C6CF0]'
              }`}
              aria-label="Save internship"
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-[#FF8A65]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 dark:hover:bg-[#3D3759] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          
          {/* Fellowship Support & Match Banner (No fee numbers shown with subject) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] shadow-xs">
            <div>
              <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium">Work Arrangement</div>
              <div className="text-xl font-extrabold text-[#7C6CF0] dark:text-[#A99CFF] mt-0.5 flex items-center gap-1.5">
                <Laptop className="w-4 h-4" />
                <span>100% Remote</span>
              </div>
              <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-0.5">
                Work from anywhere across India
              </div>
            </div>

            <div>
              <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium">Fellowship Perks</div>
              <div className="text-xl font-extrabold text-[#34D399] dark:text-[#5EE3B0] mt-0.5">
                Full Grant & Setup
              </div>
              <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-0.5">
                Dedicated 1:1 engineering mentor & tech budget
              </div>
            </div>

            <div>
              <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium">Match Fit Score</div>
              <div className="text-xl font-extrabold text-[#FF8A65] dark:text-[#FFA07A] mt-0.5 flex items-center gap-1.5">
                <span>{internship.matchScore}%</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FF8A65]/15 text-[#9f4122] dark:text-[#FFA07A]">
                  Top Match
                </span>
              </div>
              <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] mt-0.5 line-clamp-1">
                {internship.matchReason}
              </div>
            </div>
          </div>

          {/* Friendly Description */}
          <div>
            <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C6CF0] dark:text-[#A99CFF]" />
              The Role in Plain English
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-[#474554] dark:text-[#A5A0BA] leading-relaxed">
              {internship.friendlyDescription}
            </p>
          </div>

          {/* What You'll Actually Do */}
          <div>
            <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
              What You Will Work On This Summer
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2.5">
              {internship.responsibilities.map((resp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 dark:border-[#3D3759]"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#2D2A3E] dark:text-[#F2EEFF] leading-snug">
                    {resp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Interview Roadmap */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7C6CF0] dark:text-[#A99CFF]" />
                Transparent Remote Interview Roadmap (Zero Surprise Grinds)
              </h3>
              <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">3 simple steps</span>
            </div>

            <div className="mt-3.5 space-y-3">
              {internship.interviewRoadmap.map((step) => (
                <div
                  key={step.step}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-[#7C6CF0]/15 dark:bg-[#A99CFF]/20 text-[#7C6CF0] dark:text-[#A99CFF] font-bold text-sm flex items-center justify-center shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                        {step.title}
                      </h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#7C6CF0]/10 text-[#7C6CF0] dark:text-[#A99CFF]">
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Alumni Reflection Quote */}
          {internship.alumniQuote && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border-l-4 border-l-[#34D399] border border-[#7C6CF0]/10 dark:border-[#3D3759]">
              <p className="text-xs sm:text-sm italic text-[#2D2A3E] dark:text-[#F2EEFF] leading-relaxed">
                "{internship.alumniQuote.quote}"
              </p>
              <div className="mt-2 text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium flex items-center gap-2">
                <span className="font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">{internship.alumniQuote.studentName}</span>
                <span>·</span>
                <span>{internship.alumniQuote.school}</span>
                <span>·</span>
                <span>{internship.alumniQuote.year}</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
            Deadline: <span className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">{internship.deadline}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onApply(internship);
              }}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Apply to {internship.company}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
