import React, { useState } from 'react';
import { Application, OfferLetter } from '../types';
import { OfferLetterModal } from './OfferLetterModal';
import { CompanyLogo } from './CompanyLogo';
import {
  Check,
  Award,
  ChevronDown,
  FileText,
  Download,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { downloadOfferLetterPdfFromApplication } from '../utils/offerLetterPdf';

interface ApplicationTrackerProps {
  applications: Application[];
  candidateName?: string;
  onUpdateStage?: (id: string, newStage: Application['stage']) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onDeleteApplication?: (id: string) => void;
  onExploreMore: () => void;
}

interface JourneyMilestone {
  step: string;
  title: string;
  description: string;
  gradient: string;
  haloBorder: string;
  glowShadow: string;
}

const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    step: '01',
    title: '1. Register Free Online',
    description:
      'Create your private Workvanta student profile in minutes with your college, degree, and contact details at zero cost.',
    gradient: 'from-[#7C6CF0] to-[#5E4AE3]',
    haloBorder: 'border-[#7C6CF0]/35 dark:border-[#A99CFF]/40',
    glowShadow: 'shadow-[0_10px_28px_-4px_rgba(124,108,240,0.45)]',
  },
  {
    step: '02',
    title: '2. Choose Your Domain Track',
    description:
      'Explore curated remote internships across Engineering, Design, Data Science, Cloud, and Product tracks.',
    gradient: 'from-[#8B5CF6] to-[#EC4899]',
    haloBorder: 'border-pink-400/35 dark:border-pink-400/40',
    glowShadow: 'shadow-[0_10px_28px_-4px_rgba(236,72,153,0.38)]',
  },
  {
    step: '03',
    title: '3. Receive Official Offer Letter',
    description:
      'Submit your application, track admissions updates live, and unlock your official Workvanta Offer Letter right inside your tracker.',
    gradient: 'from-[#FF8A65] to-[#F97316]',
    haloBorder: 'border-orange-400/40 dark:border-orange-400/40',
    glowShadow: 'shadow-[0_10px_28px_-4px_rgba(249,115,22,0.42)]',
  },
  {
    step: '04',
    title: '4. Complete Project Tasks from Home',
    description:
      'Collaborate remotely on real-world project modules, video jams, and mentor feedback sessions from any city in India.',
    gradient: 'from-[#F59E0B] to-[#D97706]',
    haloBorder: 'border-amber-400/40 dark:border-amber-400/40',
    glowShadow: 'shadow-[0_10px_28px_-4px_rgba(245,158,11,0.42)]',
  },
  {
    step: '05',
    title: '5. Earn Verified Certificate & LOR',
    description:
      'Wrap up mentor review and receive your verified Completion Certificate & Letter of Recommendation for LinkedIn and your resume.',
    gradient: 'from-[#34D399] to-[#059669]',
    haloBorder: 'border-emerald-400/40 dark:border-emerald-400/40',
    glowShadow: 'shadow-[0_10px_28px_-4px_rgba(16,185,129,0.42)]',
  },
];

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  candidateName,
  onExploreMore,
}) => {
  const [viewingOffer, setViewingOffer] = useState<{ offer: OfferLetter; applicationId: string } | null>(null);
  const [offerMenuOpen, setOfferMenuOpen] = useState<boolean>(true);

  const isOfferedStage = (app: Application) =>
    app.stage === 'offer' || String(app.stage).toLowerCase() === 'offered';

  const offerApplications = applications.filter((a) => isOfferedStage(a) || Boolean(a.offerLetter));
  const activeInterviews = applications.filter((a) => a.stage === 'interviewing').length;
  const appliedCount = applications.filter((a) => a.stage === 'applied').length;
  const wishlistCount = applications.filter((a) => a.stage === 'wishlist').length;

  const completedStepIndex =
    offerApplications.length > 0
      ? 5
      : activeInterviews > 0
      ? 4
      : appliedCount > 0
      ? 3
      : wishlistCount > 0
      ? 2
      : 1;

  const progressPercentage = ((completedStepIndex - 1) / 4) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 5-Step Connected Milestone Roadmap */}
      <section className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow space-y-10">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#7C6CF0]/10 dark:border-[#3D3759] pb-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF]">
              Workvanta Internship Track Record · 5 Milestones
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF]">
              Internship Track Record
            </h2>
            <p className="text-sm text-[#6B6880] dark:text-[#A5A0BA]">
              Follow each stage from free online registration to earning your verified certificate &amp; LOR.
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <div className="text-left sm:text-right">
              <div className="text-2xl font-extrabold text-[#059669] dark:text-[#5EE3B0] tabular-nums">
                {offerApplications.length}
              </div>
              <div className="text-xs font-medium text-[#6B6880] dark:text-[#A5A0BA]">
                Offers Earned
              </div>
            </div>
          </div>
        </div>

        {/* 5-Step Horizontal Connected Timeline */}
        <div className="relative">
          <div
            className="hidden lg:block absolute top-[38px] left-[10%] right-[10%] h-[3px] rounded-full bg-[#7C6CF0]/15 dark:bg-[#3D3759]"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C6CF0] via-[#FF8A65] to-[#34D399] transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-7 lg:gap-5 relative z-10">
            {JOURNEY_MILESTONES.map((item, idx) => {
              const stepNum = idx + 1;
              const isReached = stepNum <= completedStepIndex;

              return (
                <div
                  key={item.step}
                  className="flex flex-col items-center text-center rounded-2xl p-3"
                >
                  <div className="relative mb-5">
                    <div
                      className={`w-[76px] h-[76px] rounded-full border-2 border-dashed flex items-center justify-center bg-white dark:bg-[#26223A] ${item.haloBorder}`}
                    >
                      <div
                        className={`w-[60px] h-[60px] rounded-full bg-gradient-to-br ${item.gradient} ${item.glowShadow} text-white flex items-center justify-center font-extrabold text-xl tracking-tight tabular-nums`}
                      >
                        {item.step}
                      </div>
                    </div>

                    {isReached && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#26223A] border border-[#34D399]/50 shadow-xs flex items-center justify-center"
                        title="Milestone active"
                      >
                        <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#5EE3B0]" />
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-[15px] font-bold text-[#2D2A3E] dark:text-[#F2EEFF] leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-[#6B6880] dark:text-[#A5A0BA] max-w-[23ch]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offer Letter Menu */}
      <section className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow overflow-hidden">
        <button
          type="button"
          onClick={() => setOfferMenuOpen((prev) => !prev)}
          aria-expanded={offerMenuOpen}
          className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#FFF8F0]/70 dark:hover:bg-[#1E1A2C]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#34D399]/15 text-[#059669] dark:text-[#5EE3B0] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                Offer Letter Menu
              </div>
              <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] tabular-nums">
                {offerApplications.length > 0
                  ? `${offerApplications.length} official offer ${offerApplications.length === 1 ? 'letter' : 'letters'} ready to view & download`
                  : 'View and download your official internship offer letters here once offered'}
              </div>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-[#6B6880] dark:text-[#A5A0BA] transition-transform duration-200 ${
              offerMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {offerMenuOpen && (
          <div className="border-t border-[#7C6CF0]/10 dark:border-[#3D3759] px-6 py-4 space-y-3 bg-[#FFF8F0]/40 dark:bg-[#1E1A2C]/40">
            {offerApplications.length === 0 ? (
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                  No offer letters have been issued yet. Apply to an internship and admissions will dispatch your official offer letter to this menu.
                </div>
                <button
                  type="button"
                  onClick={onExploreMore}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Internships</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#7C6CF0]/10 dark:divide-[#3D3759]">
                {offerApplications.map((app) => (
                  <div
                    key={app.id}
                    className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#7C6CF0]/10 dark:border-[#3D3759] shrink-0">
                        <CompanyLogo
                          src={app.companyLogo}
                          company={app.company}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                          {app.roleTitle}
                        </div>
                        <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] flex items-center gap-1.5">
                          <span>{app.company}</span>
                          {app.offerLetter?.stipendAmount && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{app.offerLetter.stipendAmount}</span>
                            </>
                          )}
                          {app.offerLetter?.issuedDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">Issued {app.offerLetter.issuedDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isOfferedStage(app) && (
                        <button
                          type="button"
                          onClick={() => downloadOfferLetterPdfFromApplication(app, candidateName)}
                          className="px-4 py-2 rounded-full bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Offer Letter</span>
                        </button>
                      )}

                      {app.offerLetter ? (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingOffer({ offer: app.offerLetter!, applicationId: app.id })
                          }
                          className="px-4 py-2 rounded-full bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#006949] dark:text-[#5EE3B0] text-xs font-bold inline-flex items-center gap-1.5 border border-[#34D399]/30 transition-all whitespace-nowrap cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Offer Letter</span>
                        </button>
                      ) : !isOfferedStage(app) ? (
                        <div className="text-[11px] font-semibold text-[#006949] dark:text-[#5EE3B0] inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Official Dispatch</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Offer Letter Viewer Modal */}
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
