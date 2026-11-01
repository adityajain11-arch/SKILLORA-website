import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Sparkles, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { Internship, UserProfile } from '../types';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ApplicationModalProps {
  internship: Internship | null;
  userProfile: UserProfile;
  onClose: () => void;
  onSuccess: (newApp: any) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  internship,
  userProfile,
  onClose,
  onSuccess
}) => {
  if (!internship) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState(userProfile.name);
  const [university, setUniversity] = useState(userProfile.university);
  const [gradYear, setGradYear] = useState(userProfile.gradYear);
  const [portfolioUrl, setPortfolioUrl] = useState(userProfile.portfolioUrl);
  const [storyAnswer, setStoryAnswer] = useState(
    'I love building thoughtful, accessible web tools. Recently I built a cozy study buddy app with clean React state and keyboard accessibility.'
  );
  const [resumeName, setResumeName] = useState(userProfile.uploadedResumeName);
  const [notes, setNotes] = useState(`Excited about ${internship.company}'s focus on ${internship.culturePillars[0] || 'craft'}!`);
  const [submitting, setSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('workvanta_auth_token') : null;
      if (!token) {
        setSubmitError('Please log in privately first so this application is saved to your personal dashboard.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          internshipId: internship.id,
          company: internship.company,
          roleTitle: internship.title,
          companyLogo: internship.companyLogo,
          location: internship.location,
          notes: notes,
          stipendDisplay: '100% Remote Fellowship · India',
          storyAnswer: storyAnswer,
          portfolioUrl: portfolioUrl,
          resumeFileName: resumeName
        })
      });
      const data = await res.json();
      if (res.status === 401) {
        setSubmitError('Your session has expired. Please sign in again to submit your application.');
        return;
      }
      if (data.success) {
        fireCelebrationConfetti();
        setIsDone(true);
        setTimeout(() => {
          onSuccess(data.data);
        }, 2200);
      } else {
        setSubmitError(data.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Failed to submit application', err);
      setSubmitError('Could not reach server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FFF8F0] dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="p-6 bg-white dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider">
                Workvanta Remote Application
              </span>
              <span className="text-[#c9c4d6] dark:text-[#474554]">·</span>
              <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">Step {step} of 3</span>
            </div>
            <h3 className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-0.5">
              Applying to {internship.company} — {internship.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Indicator */}
        <div className="px-6 pt-4 pb-2 bg-white dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#7C6CF0] dark:bg-[#A99CFF]' : 'bg-[#7C6CF0]/20'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#7C6CF0] dark:bg-[#A99CFF]' : 'bg-[#7C6CF0]/20'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-[#7C6CF0] dark:bg-[#A99CFF]' : 'bg-[#7C6CF0]/20'}`} />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {isDone ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#34D399]/20 text-[#34D399] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                Application Sent With Care!
              </h4>
              <p className="text-sm text-[#6B6880] dark:text-[#A5A0BA] max-w-md mx-auto leading-relaxed">
                Your application to <span className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">{internship.company}</span> has been logged into your personal tracker. Take a breath and have a cup of tea!
              </p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                <h4 className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider mb-3">
                  Step 1: Your Student Haven Profile
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                        University
                      </label>
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                        Expected Graduation
                      </label>
                      <input
                        type="text"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Portfolio or GitHub URL
                    </label>
                    <input
                      type="text"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/your-username"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                <h4 className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider mb-2">
                  Step 2: Tell Your Story (Zero Corporate Jargon)
                </h4>
                <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] mb-3 leading-relaxed">
                  Forget generic cover letters. In 2-3 sentences, share what project you loved building or what you are excited to learn this summer.
                </p>

                <textarea
                  rows={4}
                  value={storyAnswer}
                  onChange={(e) => setStoryAnswer(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                />

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Personal application note (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Really loved Sarah Chen's writeup on design systems!"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                <h4 className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider mb-2">
                  Step 3: Attached Student Resume
                </h4>

                <div className="p-4 rounded-xl border-2 border-dashed border-[#7C6CF0]/30 dark:border-[#3D3759] bg-[#FFF8F0]/50 dark:bg-[#26223A]/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C6CF0]/15 dark:bg-[#A99CFF]/20 text-[#7C6CF0] dark:text-[#A99CFF] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                        {resumeName}
                      </div>
                      <div className="text-xs text-[#34D399] font-medium">
                        Verified PDF · Synced from Profile
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updated = prompt('Enter resume file name or URL:', resumeName);
                      if (updated) setResumeName(updated);
                    }}
                    className="text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-[#34D399]/10 text-xs text-[#006949] dark:text-[#5EE3B0] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Your application will be sent directly to the hiring pod. {internship.company} guarantees a response within 14 calendar days!
                  </span>
                </div>

                {submitError && (
                  <div className="mt-3 p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold">
                    {submitError}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        {!isDone && (
          <div className="p-4 sm:p-6 bg-white dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Send Application'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
