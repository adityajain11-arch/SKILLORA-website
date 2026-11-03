import React, { useState } from 'react';
import { Application, OfferLetter } from '../types';
import { OfferLetterModal } from './OfferLetterModal';
import { Calendar, Clock, Edit3, Trash2, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Plus, ExternalLink, Award } from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ApplicationTrackerProps {
  applications: Application[];
  onUpdateStage: (id: string, newStage: Application['stage']) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteApplication: (id: string) => void;
  onExploreMore: () => void;
}

const STAGES: { id: Application['stage']; label: string; color: string; badgeColor: string }[] = [
  { id: 'wishlist', label: 'Wishlist & Prep', color: 'border-amber-400', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { id: 'applied', label: 'Applied & In Review', color: 'border-[#7C6CF0]', badgeColor: 'bg-[#7C6CF0]/15 text-[#5846ca] dark:text-[#A99CFF]' },
  { id: 'interviewing', label: 'Interviewing & Jams', color: 'border-[#FF8A65]', badgeColor: 'bg-[#FF8A65]/15 text-[#9f4122] dark:text-[#FFA07A]' },
  { id: 'offer', label: 'Offers Received 🎉', color: 'border-[#34D399]', badgeColor: 'bg-[#34D399]/20 text-[#006949] dark:text-[#5EE3B0]' }
];

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  onUpdateStage,
  onUpdateNotes,
  onDeleteApplication,
  onExploreMore
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [viewingOffer, setViewingOffer] = useState<OfferLetter | null>(null);

  const handleStageChange = (id: string, stage: Application['stage']) => {
    if (stage === 'offer') {
      fireCelebrationConfetti();
    }
    onUpdateStage(id, stage);
  };

  const handleStartEditNote = (app: Application) => {
    setEditingNoteId(app.id);
    setNoteDraft(app.notes || '');
  };

  const handleSaveNote = (id: string) => {
    onUpdateNotes(id, noteDraft);
    setEditingNoteId(null);
  };

  const activeInterviews = applications.filter((a) => a.stage === 'interviewing').length;
  const offersCount = applications.filter((a) => a.stage === 'offer').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Stats Strip */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C6CF0]/10 text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF8A65]" />
            <span>Workvanta Career Journey</span>
          </div>
          <h2 className="text-2xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-2">
            My Remote Career Journey
          </h2>
          <p className="text-sm text-[#6B6880] dark:text-[#A5A0BA] mt-1">
            Track remote application milestones, interview video jams, and fellowship offers in one private workspace.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] text-center min-w-24">
            <div className="text-xl font-extrabold text-[#7C6CF0] dark:text-[#A99CFF] tabular-nums">
              {applications.length}
            </div>
            <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] font-medium">
              Career Milestones
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#FF8A65]/20 dark:border-[#3D3759] text-center min-w-24">
            <div className="text-xl font-extrabold text-[#FF8A65] dark:text-[#FFA07A] tabular-nums">
              {activeInterviews}
            </div>
            <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] font-medium">
              Interviews
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#34D399]/20 dark:border-[#3D3759] text-center min-w-24">
            <div className="text-xl font-extrabold text-[#34D399] dark:text-[#5EE3B0] tabular-nums">
              {offersCount}
            </div>
            <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] font-medium">
              Offers
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stage Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAGES.map((col) => {
          const colApps = applications.filter((a) => a.stage === col.id);

          return (
            <div
              key={col.id}
              className="rounded-3xl bg-[#FFF8F0]/80 dark:bg-[#1E1A2C]/80 border border-[#7C6CF0]/15 dark:border-[#3D3759] p-4 flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#7C6CF0]/10 dark:border-[#3D3759]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                    {col.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${col.badgeColor}`}>
                    {colApps.length}
                  </span>
                </div>
              </div>

              {/* Applications List */}
              <div className="space-y-3.5 flex-1">
                {colApps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                    No roles in this stage yet.
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow space-y-3 transition-all hover:scale-[1.01]"
                    >
                      {/* Company & Role */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={app.companyLogo}
                            alt={app.company}
                            className="w-8 h-8 rounded-xl object-cover border border-[#7C6CF0]/10 dark:border-[#3D3759]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF]">
                              {app.company}
                            </div>
                            <h4 className="text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF] line-clamp-1">
                              {app.roleTitle}
                            </h4>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-1 text-[#6B6880] hover:text-[#ba1a1a] dark:text-[#A5A0BA] dark:hover:text-[#ffb4ab] transition-colors"
                          title="Remove application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Fellowship prestige tag */}
                      <div className="text-[11px] font-semibold text-[#7C6CF0] dark:text-[#A99CFF] bg-[#7C6CF0]/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                        <span>100% Remote Fellowship · India</span>
                      </div>

                      {/* Next milestone if set */}
                      {app.nextStepTitle && (
                        <div className="p-2.5 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 dark:border-[#3D3759] text-xs">
                          <div className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#FF8A65]" />
                            <span className="truncate">{app.nextStepTitle}</span>
                          </div>
                          {app.nextStepDate && (
                            <div className="text-[10px] text-[#6B6880] dark:text-[#A5A0BA] mt-0.5">
                              {new Date(app.nextStepDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Personal Notes */}
                      <div className="text-xs">
                        {editingNoteId === app.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              className="w-full p-2 text-xs rounded-lg bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/30 focus:outline-none"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-0.5 rounded text-[11px] text-[#6B6880]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(app.id)}
                                className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#7C6CF0] text-white"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditNote(app)}
                            className="p-2 rounded-xl bg-[#FFF8F0]/60 dark:bg-[#1E1A2C]/60 text-[#474554] dark:text-[#A5A0BA] cursor-pointer hover:bg-[#7C6CF0]/10 transition-colors flex items-start justify-between gap-2"
                          >
                            <span className="line-clamp-2">{app.notes || 'Click to add prep notes...'}</span>
                            <Edit3 className="w-3 h-3 text-[#7C6CF0] shrink-0 mt-0.5" />
                          </div>
                        )}
                      </div>

                      {/* Official Offer Letter Button - ONLY if Admin actually issued an offer letter */}
                      {app.offerLetter ? (
                        <button
                          onClick={() => setViewingOffer(app.offerLetter!)}
                          className="w-full py-2 px-3 rounded-xl bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#006949] dark:text-[#5EE3B0] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#34D399]/30 transition-all shadow-xs cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5 text-[#34D399]" />
                          <span>View Official Offer Letter 📜</span>
                        </button>
                      ) : app.stage === 'offer' ? (
                        <div className="p-2.5 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 text-[11px] text-[#006949] dark:text-[#5EE3B0] font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                          <span>Offer Approved · Awaiting Official Letter Dispatch</span>
                        </div>
                      ) : null}

                      {/* Official Admissions Status Display (Read-Only for Candidate) */}
                      <div className="pt-2 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA]">Admissions Stage:</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-[#7C6CF0] dark:text-[#A99CFF]">
                          {app.stage === 'offer'
                            ? 'Offer Extended 🎉'
                            : app.stage === 'interviewing'
                            ? 'Interview Scheduled'
                            : app.stage === 'applied'
                            ? 'Under Review'
                            : 'Wishlist & Prep'}
                        </span>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Action */}
              {col.id === 'wishlist' && (
                <button
                  onClick={onExploreMore}
                  className="mt-3 py-2 px-3 rounded-2xl border border-dashed border-[#7C6CF0]/30 hover:border-[#7C6CF0] text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/10 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Discover More Remote Roles</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Offer Letter Viewer Modal */}
      {viewingOffer && (
        <OfferLetterModal
          offer={viewingOffer}
          onClose={() => setViewingOffer(null)}
        />
      )}

    </div>
  );
};
