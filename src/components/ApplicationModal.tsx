import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Internship, UserProfile } from '../types';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ApplicationModalProps {
  internship: Internship | null;
  userProfile: UserProfile;
  onClose: () => void;
  onSuccess: (newApp: any) => void;
}

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB

function getInitialLinkedinState(url?: string): { id: string; isNA: boolean } {
  const cleaned = (url || '').trim();
  if (!cleaned) return { id: '', isNA: false };
  if (cleaned.toUpperCase() === 'NA') return { id: 'NA', isNA: true };
  // Do not treat generic base domain placeholder as a user's LinkedIn ID
  if (/^https?:\/\/(www\.)?linkedin\.com\/?$/i.test(cleaned)) {
    return { id: '', isNA: false };
  }
  return { id: cleaned, isNA: false };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  internship,
  userProfile,
  onClose,
  onSuccess
}) => {
  const initialLinkedin = getInitialLinkedinState(userProfile.linkedinUrl);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState(userProfile.name);
  const [university, setUniversity] = useState(userProfile.university);
  const [gradYear, setGradYear] = useState(userProfile.gradYear);
  const [portfolioUrl, setPortfolioUrl] = useState(userProfile.portfolioUrl);
  const [linkedinId, setLinkedinId] = useState(initialLinkedin.id);
  const [linkedinNA, setLinkedinNA] = useState(initialLinkedin.isNA);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const [storyAnswer, setStoryAnswer] = useState(
    'I love building thoughtful, accessible web tools. Recently I built a cozy study buddy app with clean React state and keyboard accessibility.'
  );
  const [notes, setNotes] = useState(
    `Excited about ${internship?.company || 'this team'}'s focus on ${internship?.culturePillars[0] || 'craft'}!`
  );

  // Strict Resume Upload State (Locked on Step 3 until a real file is uploaded)
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const nextLinkedin = getInitialLinkedinState(userProfile.linkedinUrl);
    setStep(1);
    setFullName(userProfile.name);
    setUniversity(userProfile.university);
    setGradYear(userProfile.gradYear);
    setPortfolioUrl(userProfile.portfolioUrl);
    setLinkedinId(nextLinkedin.id);
    setLinkedinNA(nextLinkedin.isNA);
    setStep1Error(null);
    setResumeFile(null);
    setResumeError(null);
    setSubmitError(null);
    setIsDone(false);
  }, [internship?.id]);

  if (!internship) return null;

  const isLinkedInValid = linkedinNA || linkedinId.trim().length > 0;
  const resolvedLinkedinId = linkedinNA ? 'NA' : linkedinId.trim();
  const isStep1Complete =
    fullName.trim().length > 0 && university.trim().length > 0 && isLinkedInValid;

  const handleToggleLinkedinNA = (checked: boolean) => {
    setLinkedinNA(checked);
    setStep1Error(null);
    if (checked) {
      setLinkedinId('NA');
    } else if (linkedinId.trim().toUpperCase() === 'NA') {
      setLinkedinId('');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        setStep1Error('Full Name is required to proceed.');
        return;
      }
      if (!university.trim()) {
        setStep1Error('University / College name is required to proceed.');
        return;
      }
      if (!isLinkedInValid) {
        setStep1Error("LinkedIn ID is required. Enter your LinkedIn ID / URL or select 'Mark as NA'.");
        return;
      }
      setStep1Error(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
    }
  };

  const validateAndAttachFile = (file: File | undefined | null) => {
    if (!file) return;
    setResumeError(null);
    setSubmitError(null);

    const hasValidExt = /\.(pdf|doc|docx)$/i.test(file.name);
    if (!hasValidExt) {
      setResumeFile(null);
      setResumeError('Unsupported file format. Upload a PDF, DOC, or DOCX resume file.');
      return;
    }

    if (file.size <= 0) {
      setResumeFile(null);
      setResumeError('Selected file appears empty. Please choose a valid resume file.');
      return;
    }

    if (file.size > MAX_RESUME_BYTES) {
      setResumeFile(null);
      setResumeError('File exceeds 10 MB limit. Upload a smaller PDF, DOC, or DOCX file.');
      return;
    }

    setResumeFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAttachFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    validateAndAttachFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!isLinkedInValid) {
      setStep(1);
      setStep1Error("LinkedIn ID is required. Enter your LinkedIn ID / URL or select 'Mark as NA'.");
      return;
    }

    if (!resumeFile) {
      setResumeError('Submission locked: you must upload a resume file before proceeding.');
      return;
    }

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
          linkedinId: resolvedLinkedinId,
          resumeFileName: resumeFile.name
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
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FFF8F0] dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#7C6CF0] dark:text-[#A99CFF] tracking-wide">
                Workvanta Quick Application
              </span>
              <span className="text-[#c9c4d6] dark:text-[#474554]" aria-hidden="true">·</span>
              <span className="text-[#6B6880] dark:text-[#A5A0BA] tabular-nums">
                Step {step} of 3
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-0.5 truncate">
              {internship.company} — {internship.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close application modal"
            className="p-2 rounded-full text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Indicator */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 bg-white dark:bg-[#1E1A2C] border-b border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center gap-2 shrink-0">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#7C6CF0] dark:bg-[#A99CFF]' : 'bg-[#7C6CF0]/20'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#7C6CF0] dark:bg-[#A99CFF]' : 'bg-[#7C6CF0]/20'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? (resumeFile ? 'bg-[#16A34A]' : 'bg-[#D97706]') : 'bg-[#7C6CF0]/20'}`} />
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-8 space-y-6 overflow-y-auto flex-1">

          {isDone ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#34D399]/20 text-[#16A34A] dark:text-[#5EE3B0] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                Application Sent With Care!
              </h4>
              <p className="text-sm text-[#6B6880] dark:text-[#A5A0BA] max-w-md mx-auto leading-relaxed">
                Your application to <span className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">{internship.company}</span> has been logged with <span className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">{resumeFile?.name}</span> into your Tracker.
              </p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                <h4 className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] tracking-wide mb-3">
                  Step 1: Student Details & LinkedIn ID
                </h4>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                      Full Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setStep1Error(null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                        University / College <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => {
                          setUniversity(e.target.value);
                          setStep1Error(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm tabular-nums text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                      />
                    </div>
                  </div>

                  {/* LinkedIn ID with mandatory validation OR Mark as NA */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <label
                        htmlFor="application-linkedin-id"
                        className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]"
                      >
                        LinkedIn ID / Profile URL {!linkedinNA && <span className="text-[#DC2626]">*</span>}
                      </label>

                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6880] dark:text-[#A5A0BA] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={linkedinNA}
                          onChange={(e) => handleToggleLinkedinNA(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-[#7C6CF0]/40 text-[#7C6CF0] focus:ring-[#7C6CF0]"
                        />
                        <span>Don&apos;t have LinkedIn · Mark as NA</span>
                      </label>
                    </div>

                    <input
                      id="application-linkedin-id"
                      type="text"
                      value={linkedinNA ? 'NA' : linkedinId}
                      disabled={linkedinNA}
                      onChange={(e) => {
                        setLinkedinId(e.target.value);
                        setStep1Error(null);
                      }}
                      placeholder="e.g. linkedin.com/in/your-id or your-linkedin-id"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0] transition-colors ${
                        linkedinNA
                          ? 'bg-slate-100 dark:bg-[#2E2944] border-[#7C6CF0]/15 text-[#6B6880] dark:text-[#A5A0BA] cursor-not-allowed'
                          : !linkedinId.trim() && step1Error
                            ? 'bg-[#FFF8F0]/80 dark:bg-[#26223A] border-[#DC2626] text-[#2D2A3E] dark:text-[#F2EEFF]'
                            : 'bg-[#FFF8F0]/80 dark:bg-[#26223A] border-[#7C6CF0]/20 dark:border-[#3D3759] text-[#2D2A3E] dark:text-[#F2EEFF]'
                      }`}
                    />
                    <p className="mt-1 text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                      {linkedinNA
                        ? 'Marked as NA. You can uncheck the option anytime to add a LinkedIn ID.'
                        : 'Required field: enter your LinkedIn ID / profile URL, or check "Mark as NA".'}
                    </p>
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                    />
                  </div>
                </div>

                {step1Error && (
                  <div
                    role="alert"
                    className="mt-3 p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#451A1A] border border-[#DC2626]/30 text-[#B91C1C] dark:text-[#FCA5A5] text-xs font-semibold flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{step1Error}</span>
                  </div>
                )}
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                <h4 className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] tracking-wide mb-2">
                  Step 2: Tell Your Story (Zero Corporate Jargon)
                </h4>
                <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] mb-3 leading-relaxed">
                  Forget generic cover letters. In 2-3 sentences, share what project you loved building or what you are excited to learn this term.
                </p>

                <textarea
                  rows={4}
                  value={storyAnswer}
                  onChange={(e) => setStoryAnswer(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-sm text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                />

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Personal application note (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Really loved the team's writeup on design systems!"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8F0]/80 dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] tracking-wide">
                    Step 3: Upload Student Resume
                  </h4>
                  <span className="text-xs font-medium text-[#6B6880] dark:text-[#A5A0BA]">
                    LinkedIn ID: <span className="font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">{resolvedLinkedinId}</span>
                  </span>
                </div>

                {/* Lock / Unlock Banner */}
                {!resumeFile ? (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#FFFBEB] dark:bg-[#3A2A14] border border-[#D97706]/35 text-[#92400E] dark:text-[#FCD34D] flex items-start gap-2.5">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold">Submission Locked — Resume Upload Required</p>
                      <p className="mt-0.5 opacity-90">
                        You cannot proceed or submit this internship application without uploading a resume file (PDF, DOC, or DOCX).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#F0FDF4] dark:bg-[#143322] border border-[#16A34A]/35 text-[#166534] dark:text-[#86EFAC] flex items-start gap-2.5">
                    <Unlock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold">Resume Uploaded — Submission Unlocked</p>
                      <p className="mt-0.5 opacity-90">
                        Your resume file is attached and ready to send to {internship.company}.
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileInputChange}
                  className="sr-only"
                  aria-label="Upload resume file"
                />

                {!resumeFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDropFile}
                    className={`p-6 rounded-xl border-2 border-dashed transition-colors text-center ${
                      isDraggingFile
                        ? 'border-[#7C6CF0] bg-[#7C6CF0]/10'
                        : 'border-[#7C6CF0]/35 dark:border-[#3D3759] bg-[#FFF8F0]/55 dark:bg-[#26223A]/50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#7C6CF0]/15 dark:bg-[#A99CFF]/20 text-[#7C6CF0] dark:text-[#A99CFF] mx-auto flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                      Upload your resume to unlock submission
                    </p>
                    <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] mt-1 mb-4">
                      PDF, DOC, or DOCX · Maximum 10 MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm transition-colors cursor-pointer"
                    >
                      Choose Resume File
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#16A34A]/35 bg-[#F0FDF4]/60 dark:bg-[#143322]/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#16A34A]/15 text-[#16A34A] dark:text-[#5EE3B0] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#2D2A3E] dark:text-[#F2EEFF] truncate">
                          {resumeFile.name}
                        </div>
                        <div className="text-xs text-[#166534] dark:text-[#86EFAC] font-medium tabular-nums">
                          Uploaded · {formatFileSize(resumeFile.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/10 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        aria-label="Remove uploaded resume"
                        className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {resumeError && (
                  <div
                    role="alert"
                    className="mt-3 p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#451A1A] border border-[#DC2626]/30 text-[#B91C1C] dark:text-[#FCA5A5] text-xs font-semibold flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resumeError}</span>
                  </div>
                )}

                <div className="mt-4 p-3.5 rounded-xl bg-[#7C6CF0]/8 dark:bg-[#A99CFF]/10 text-xs text-[#4C4480] dark:text-[#D5CEFF] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Your application will be sent directly to the hiring pod. {internship.company} reviews all submissions within 14 calendar days.
                  </span>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-3 p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#451A1A] border border-[#DC2626]/30 text-[#B91C1C] dark:text-[#FCA5A5] text-xs font-semibold flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        {!isDone && (
          <div className="p-4 sm:p-6 bg-white dark:bg-[#1E1A2C] border-t border-[#7C6CF0]/15 dark:border-[#3D3759] flex flex-wrap-reverse sm:flex-nowrap items-center justify-between gap-2.5 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                aria-disabled={step === 1 && !isStep1Complete}
                className={`w-full sm:w-auto justify-center px-6 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  step === 1 && !isStep1Complete
                    ? 'bg-slate-200 dark:bg-[#35304C] text-slate-600 dark:text-[#A5A0BA] cursor-not-allowed'
                    : 'bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-sm hover:shadow cursor-pointer'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!resumeFile || submitting || !isLinkedInValid}
                className={`w-full sm:w-auto justify-center px-5 sm:px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 text-center ${
                  !resumeFile || !isLinkedInValid
                    ? 'bg-slate-200 dark:bg-[#35304C] text-slate-600 dark:text-[#A5A0BA] cursor-not-allowed'
                    : 'bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60'
                }`}
              >
                {!resumeFile ? (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Locked · Upload Resume</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{submitting ? 'Submitting...' : 'Send Application'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
