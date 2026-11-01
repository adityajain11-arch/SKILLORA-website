export interface InterviewStep {
  step: number;
  title: string;
  duration: string;
  description: string;
}

export interface AlumniQuote {
  quote: string;
  studentName: string;
  school: string;
  year: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string; // e.g. "Remote — Bengaluru, India"
  workType: 'Remote';
  category: 'Software Engineering' | 'Product Design' | 'Product Management' | 'Data & AI' | 'Developer Relations';
  hourlyRate: number;
  monthlyStipend: number;
  housingStipendMonthly: number;
  matchScore: number;
  matchReason: string;
  friendlyDescription: string;
  culturePillars: string[];
  responsibilities: string[];
  noJargonSkills: string[];
  interviewRoadmap: InterviewStep[];
  alumniQuote: AlumniQuote;
  deadline: string;
  season: string;
  isBookmarked?: boolean;
}

export interface OfferLetter {
  letterId: string;
  candidateName: string;
  candidateEmail?: string;
  roleTitle: string;
  company: string;
  stipendAmount: string;
  startDate: string;
  remoteLocation: string;
  issuedDate: string;
  signerName: string;
  signerTitle: string;
  letterBody: string;
}

export interface Application {
  id: string;
  userId?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantUniversity?: string;
  applicantMajor?: string;
  internshipId: string;
  company: string;
  roleTitle: string;
  companyLogo: string;
  location: string;
  stage: 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'archived';
  appliedDate: string;
  nextStepTitle?: string;
  nextStepDate?: string;
  notes: string;
  stipendDisplay: string;
  storyAnswer?: string;
  portfolioUrl?: string;
  resumeFileName?: string;
  offerLetter?: OfferLetter;
}

export interface Review {
  id: string;
  internshipRole: string;
  company: string;
  year: string;
  rating: number;
  workLifeBalance: number;
  realStipendReport?: string;
  fellowshipReport?: string;
  honestReview: string;
  perksHighlights: string[];
  wouldRecommend: boolean;
}

export interface UserProfile {
  name: string;
  university: string;
  major: string;
  gradYear: string;
  gpa: string;
  bio: string;
  skills: string[];
  preferredRoles: string[];
  desiredStipendMin?: number;
  preferredWorkType: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  uploadedResumeName: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university: string;
  major: string;
  gradYear: string;
  avatar?: string;
  role: 'student';
  token?: string;
}
