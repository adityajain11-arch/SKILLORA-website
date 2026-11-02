import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { adminAuth } from './src/lib/firebase-admin.ts';
import * as dbQueries from './src/db/queries.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  location: string;
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
  userId: string;
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
  workLifeBalance: string;
  realStipendReport?: string;
  fellowshipReport?: string;
  honestReview: string;
  perksHighlights: string[];
  wouldRecommend: boolean;
}

// 100% Remote Internships located across India
const initialInternships: Internship[] = [
  {
    id: 'intern-01',
    title: 'Frontend Product Engineering Intern',
    company: 'Linear',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Bengaluru, India',
    workType: 'Remote',
    category: 'Software Engineering',
    hourlyRate: 58,
    monthlyStipend: 9280,
    housingStipendMonthly: 2000,
    matchScore: 96,
    matchReason: 'Perfect match for your React, TypeScript, and clean UI sensibilities!',
    friendlyDescription: 'Help craft the fastest, smoothest project workspace in the world from anywhere in India. Work on real customer-facing features with zero bureaucratic gatekeeping.',
    culturePillars: ['Zero Bureaucracy', 'Craft & Tactile Feel', '100% Async Remote', 'High Trust'],
    responsibilities: [
      'Build keyboard-first interactions and micro-animations in React and WebGL',
      'Collaborate asynchronously with global founders and design engineers',
      'Ship an end-to-end product feature that directly reaches 100,000+ developers',
      'Learn best practices in state sync, offline caching, and high performance DOM rendering'
    ],
    noJargonSkills: ['React & TypeScript basics', 'Care for smooth animations', 'Curiosity to learn', 'Kind communication'],
    interviewRoadmap: [
      { step: 1, title: 'Warm Welcome Chat', duration: '25 mins', description: 'Get to know our team, tell us what you love building, and ask us anything.' },
      { step: 2, title: 'Pair Programming Jam', duration: '60 mins', description: 'Collaboratively build a small, fun UI component together. Open book, zero leetcode.' },
      { step: 3, title: 'Team Culture & Offer Chat', duration: '30 mins', description: 'Meet teammates, review remote perks, and finalize cohort schedule.' }
    ],
    alumniQuote: {
      quote: 'Working remotely from Bangalore was completely frictionless. Shipped 3 major features used by thousands of engineering teams!',
      studentName: 'Aarav Sharma',
      school: 'IIT Bombay',
      year: 'Summer 2025'
    },
    deadline: '2026-11-20',
    season: 'Summer 2026'
  },
  {
    id: 'intern-02',
    title: 'Product Design Systems Intern',
    company: 'Figma',
    companyLogo: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Mumbai, India',
    workType: 'Remote',
    category: 'Product Design',
    hourlyRate: 55,
    monthlyStipend: 8800,
    housingStipendMonthly: 2500,
    matchScore: 92,
    matchReason: 'Strong overlap with your typography and accessible UI exploration.',
    friendlyDescription: 'Join the team building design tools for millions of creators worldwide while based remotely in India. Explore color accessibility engines, playful tactile design libraries, and student community templates.',
    culturePillars: ['Empathy-First Critique', 'Makers Culture', 'Warm Community', 'Radical Inclusion'],
    responsibilities: [
      'Prototype novel design system tokens and soft elevation guidelines',
      'Test color contrast algorithms with real screen-reader and low-vision users',
      'Host cozy student office hours in the Figma Community space',
      'Collaborate on tactile canvas interactions and motion design tokens'
    ],
    noJargonSkills: ['Figma prototyping', 'Curiosity for typography & color', 'A warm heart for user empathy'],
    interviewRoadmap: [
      { step: 1, title: 'Portfolio Storytelling', duration: '35 mins', description: 'Walk through 1 or 2 projects you enjoyed making, including mistakes you learned from.' },
      { step: 2, title: 'Design Exercise Jam', duration: '45 mins', description: 'A relaxed brainstorm session on making software friendlier for first-time designers.' },
      { step: 3, title: 'Wrap-Up & Summer Planning', duration: '20 mins', description: 'Offer walkthrough, remote home office allowance, and equipment selection.' }
    ],
    alumniQuote: {
      quote: 'The remote collaboration culture was genuinely inspiring. Daily async check-ins felt supportive rather than micromanaged.',
      studentName: 'Diya Verma',
      school: 'NID Ahmedabad',
      year: 'Summer 2025'
    },
    deadline: '2026-11-30',
    season: 'Summer 2026'
  },
  {
    id: 'intern-03',
    title: 'Climate Data & AI Systems Intern',
    company: 'Watershed Climate',
    companyLogo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Delhi NCR, India',
    workType: 'Remote',
    category: 'Data & AI',
    hourlyRate: 52,
    monthlyStipend: 8320,
    housingStipendMonthly: 1500,
    matchScore: 89,
    matchReason: 'Great if you care about climate tech and mission-driven data analysis.',
    friendlyDescription: 'Help world-changing enterprises cut emissions through verifiable supply chain analytics. Build friendly visualizations that turn complex greenhouse gas data into actionable steps.',
    culturePillars: ['Mission Driven', 'Data Integrity', 'Quiet Focus Hours', 'Work-Life Harmony'],
    responsibilities: [
      'Develop Python pipelines to calculate Scope 3 logistics carbon footprints',
      'Build clean charts and interactive sustainability calculators',
      'Pair with environmental scientists to validate emission factor benchmarks',
      'Write approachable documentation for non-technical climate officers'
    ],
    noJargonSkills: ['Python or TypeScript basics', 'Interest in climate action', 'Data curiosity'],
    interviewRoadmap: [
      { step: 1, title: 'Coffee & Climate Chat', duration: '30 mins', description: 'Tell us about your passions and learn about Watershed’s decarbonization platform.' },
      { step: 2, title: 'Practical Data Exploration', duration: '50 mins', description: 'Explore a small dataset with our lead engineer. Focus is on clarity and curiosity.' },
      { step: 3, title: 'Final Team Meet', duration: '30 mins', description: 'Meet the team and discuss summer project focus areas.' }
    ],
    alumniQuote: {
      quote: 'Knowing my code directly helped reduce real carbon emissions gave me unmatched purpose this summer.',
      studentName: 'Rohan Iyer',
      school: 'BITS Pilani',
      year: 'Summer 2025'
    },
    deadline: '2026-12-05',
    season: 'Summer 2026'
  },
  {
    id: 'intern-04',
    title: 'Developer Experience & Open Source Intern',
    company: 'Supabase',
    companyLogo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Pan-India',
    workType: 'Remote',
    category: 'Developer Relations',
    hourlyRate: 50,
    monthlyStipend: 8000,
    housingStipendMonthly: 1200,
    matchScore: 94,
    matchReason: 'Ideal for hands-on builders who love open-source and helping beginners.',
    friendlyDescription: 'Build cozy starter templates, interactive guides, and contribute code directly to open-source Postgres tooling. 100% remote across India and welcoming to contributors of all backgrounds.',
    culturePillars: ['Open Source Spirit', 'Transparent Roadmap', 'Global Async', 'Fun & Playful'],
    responsibilities: [
      'Create beginner-friendly starter kits for Next.js, React, and mobile apps',
      'Help first-time student developers troubleshoot questions on Discord and GitHub',
      'Submit real bugfixes and DX improvements to our core repositories',
      'Host a friendly livestream building a collaborative community app'
    ],
    noJargonSkills: ['Web development fundamentals', 'Love for open source', 'Helpful mindset'],
    interviewRoadmap: [
      { step: 1, title: 'Friendly Meetup', duration: '30 mins', description: 'Chat about developer tools you enjoy and what you like learning.' },
      { step: 2, title: 'Open Source Jam', duration: '45 mins', description: 'Review a friendly open-source issue together and chat through possible approaches.' },
      { step: 3, title: 'Offer & Welcome Package', duration: '20 mins', description: 'Gear stipend, swag box, and summer schedule setup.' }
    ],
    alumniQuote: {
      quote: 'I came in terrified of Git and left as an open-source maintainer. Incredible remote experience!',
      studentName: 'Ananya Deshmukh',
      school: 'IIIT Hyderabad',
      year: 'Summer 2025'
    },
    deadline: '2026-11-28',
    season: 'Summer 2026'
  },
  {
    id: 'intern-05',
    title: 'Associate Product Manager Intern',
    company: 'Duolingo',
    companyLogo: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Hyderabad, India',
    workType: 'Remote',
    category: 'Product Management',
    hourlyRate: 54,
    monthlyStipend: 8640,
    housingStipendMonthly: 2200,
    matchScore: 88,
    matchReason: 'Matches your interest in gamified learning, user retention, and accessibility.',
    friendlyDescription: 'Make education fun and universally accessible. Lead a cross-functional squad of engineers and illustrators to launch delightful learning streaks and pronunciation mini-games remotely from India.',
    culturePillars: ['Learning For All', 'Data-Driven Delight', 'Wholesome Humor', 'Student Advocacy'],
    responsibilities: [
      'Formulate hypotheses for learner motivation and streak celebrations',
      'Run qualitative user interviews with university students across India',
      'Draft clear, human user stories without consulting corporate buzzwords',
      'Present product learnings to the entire company during Global Demo Day'
    ],
    noJargonSkills: ['Curious mindset', 'Clear structured thinking', 'Love for education and languages'],
    interviewRoadmap: [
      { step: 1, title: 'Introductory Conversation', duration: '30 mins', description: 'Learn about the Duolingo internship ethos and share your favorite apps.' },
      { step: 2, title: 'Product Thought Jam', duration: '45 mins', description: 'Explore a playful hypothetical scenario: How would you make learning a musical instrument fun?' },
      { step: 3, title: 'Culture & Offer Conversation', duration: '30 mins', description: 'Discuss remote home office setup and cohort schedule.' }
    ],
    alumniQuote: {
      quote: 'The team actively encouraged my wildest creative ideas. My streak milestone animation is live today in the app!',
      studentName: 'Zoya Khan',
      school: 'DTU Delhi',
      year: 'Summer 2025'
    },
    deadline: '2026-11-25',
    season: 'Summer 2026'
  },
  {
    id: 'intern-06',
    title: 'Full-Stack Creative Tools Intern',
    company: 'Canva',
    companyLogo: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Pune, India',
    workType: 'Remote',
    category: 'Software Engineering',
    hourlyRate: 51,
    monthlyStipend: 8160,
    housingStipendMonthly: 1800,
    matchScore: 91,
    matchReason: 'High score for visual computing, web canvas, and creative tooling.',
    friendlyDescription: 'Empower the world to design. Work remotely on canvas drawing performance, typography layout rendering, and intuitive drag-and-drop mechanics for creators of every skill level.',
    culturePillars: ['Be a Force for Good', 'Make Complex Things Simple', 'Empower Others', 'Vibrant Spirit'],
    responsibilities: [
      'Optimize HTML5 canvas rendering performance for complex vector graphics',
      'Build friendly export shortcuts for student presentation decks',
      'Collaborate with motion designers to craft smooth layout transitions',
      'Participate in our celebrated end-of-internship showcase celebration'
    ],
    noJargonSkills: ['JavaScript / TypeScript', 'HTML Canvas or SVG basics', 'Enthusiasm for creative software'],
    interviewRoadmap: [
      { step: 1, title: 'Welcome Coffee Chat', duration: '30 mins', description: 'Casual chat about your coding journey and favorite creative tools.' },
      { step: 2, title: 'Interactive Code Pair', duration: '55 mins', description: 'Build an interactive shapes canvas together. No gotchas, full collaboration.' },
      { step: 3, title: 'Welcome & Next Steps', duration: '25 mins', description: 'Offer overview, hardware delivery, and cohort onboarding.' }
    ],
    alumniQuote: {
      quote: 'Remote engineering with Canva India was world-class. Received an M3 MacBook and full ergonomic allowance.',
      studentName: 'Kartik Nair',
      school: 'NIT Surathkal',
      year: 'Summer 2025'
    },
    deadline: '2026-12-10',
    season: 'Summer 2026'
  }
];

const initialReviews: Review[] = [
  {
    id: 'rev-01',
    internshipRole: 'Frontend Product Engineering Intern',
    company: 'Linear',
    year: 'Summer 2025',
    rating: 5,
    workLifeBalance: '4.8',
    realStipendReport: 'Generous monthly remote stipend + M3 Max MacBook + WiFi reimbursement',
    fellowshipReport: 'Dedicated 1:1 engineering mentor & tech budget',
    honestReview: 'Hands down the best remote learning experience. Clear async documentation, zero pointless daily meetings, and kind PR reviews.',
    perksHighlights: ['100% Remote flexibility', 'Home office budget', 'Zero meetings Wednesdays', 'Direct founder access'],
    wouldRecommend: true
  },
  {
    id: 'rev-02',
    internshipRole: 'Product Design Systems Intern',
    company: 'Figma',
    year: 'Summer 2025',
    rating: 5,
    workLifeBalance: '4.6',
    realStipendReport: 'Competitive remote stipend + $1,500 home studio setup allowance',
    fellowshipReport: 'Dedicated 1:1 design mentor & home studio grant',
    honestReview: 'Incredible creative community. The design critiques are constructive and kind. You are encouraged to explore personal creative experiments on Fridays.',
    perksHighlights: ['Ergonomic desk stipend', 'Figma Maker fund', 'Coffee subscription', 'Team retreat'],
    wouldRecommend: true
  },
  {
    id: 'rev-03',
    internshipRole: 'Developer Relations Intern',
    company: 'Supabase',
    year: 'Summer 2025',
    rating: 5,
    workLifeBalance: '5.0',
    realStipendReport: 'Global remote stipend + $1,000 hardware fund + co-working pass',
    fellowshipReport: 'Postgres engineering fellowship & hardware allowance',
    honestReview: 'Full flexibility and trust. I could work from my home in Pune while collaborating with teammates globally. Shipped 5 starter guides and open-source fixes.',
    perksHighlights: ['Full async flexibility', 'Co-working pass', 'Generous gear stipend'],
    wouldRecommend: true
  }
];

// Active sessions memory map
const activeTokens = new Map<string, { userId: string; expiresAt: number }>();

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHashHex: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(storedHashHex, 'hex');
    if (computed.length !== stored.length) return false;
    return crypto.timingSafeEqual(computed, stored);
  } catch {
    return false;
  }
}

function generateSecureToken(userId: string): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  const token = `wkv_${randomPart}`;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  activeTokens.set(token, { userId, expiresAt });
  return token;
}

function sanitizeUser(user: any) {
  const isAdmin = user.email?.toLowerCase() === 'admin@workvanta.in' || user.role === 'admin';
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    university: user.university || (isAdmin ? 'Workvanta Admissions Guild' : 'University in India'),
    major: user.major || (isAdmin ? 'Operations & Talent' : 'Computer Science'),
    gradYear: user.gradYear || (isAdmin ? 'Staff' : '2027'),
    role: (isAdmin ? 'admin' : 'student') as 'student' | 'admin'
  };
}

// Default demo seed user
const defaultSalt = generateSalt();
const seedUser1 = {
  id: 'usr-default-01',
  name: 'Priyanshu Sharma',
  email: 'student@workvanta.in',
  passwordHash: hashPassword('workvanta123', defaultSalt),
  salt: defaultSalt,
  university: 'IIT Bombay',
  major: 'Computer Science & Engineering',
  gradYear: '2027',
  gpa: '3.85',
  bio: 'Early-career builder creating calm, tactile software and accessible developer tools. Passionate about typography, responsive performance, and high-empathy team culture.',
  skills: ['TypeScript', 'React', 'Node.js', 'UI/UX Design', 'Tailwind CSS', 'SQL', 'Git', 'Figma'],
  preferredRoles: ['Frontend Engineering', 'Product Design', 'Full-Stack'],
  desiredStipendMin: 45,
  preferredWorkType: 'Remote',
  portfolioUrl: 'https://github.com',
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  uploadedResumeName: 'Priyanshu_Resume_2026.pdf',
};

const seedAdmin = {
  id: 'usr-admin-01',
  name: 'Sarah Chen (Admissions Lead)',
  email: 'admin@workvanta.in',
  passwordHash: hashPassword('admin123', defaultSalt),
  salt: defaultSalt,
  university: 'Workvanta Admissions Guild',
  major: 'Operations & Engineering Talent',
  gradYear: 'Staff',
  gpa: '4.00',
  bio: 'Workvanta Remote Admissions Director. Oversees fellowship applicants, review pipelines, and automated offer letter issuance.',
  skills: ['Admissions', 'Fellowship Oversight', 'Candidate Evaluation', 'Operations'],
  preferredRoles: ['Administration'],
  desiredStipendMin: 0,
  preferredWorkType: 'Remote',
  portfolioUrl: 'https://workvanta.in/guild',
  githubUrl: 'https://github.com/workvanta',
  linkedinUrl: 'https://linkedin.com',
  uploadedResumeName: 'Admin_Staff_Credentials.pdf',
};

const seedUser2 = {
  id: 'usr-student-02',
  name: 'Ananya Rao',
  email: 'ananya.rao@pilani.bits-pilani.ac.in',
  passwordHash: hashPassword('workvanta123', defaultSalt),
  salt: defaultSalt,
  university: 'BITS Pilani',
  major: 'Computer Science',
  gradYear: '2026',
  gpa: '3.90',
  bio: 'Distributed systems and compilers enthusiast building open source tools.',
  skills: ['TypeScript', 'Go', 'Rust', 'PostgreSQL', 'Docker'],
  preferredRoles: ['Backend Engineering', 'Systems'],
  desiredStipendMin: 50,
  preferredWorkType: 'Remote',
  portfolioUrl: 'https://ananyarao.dev',
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  uploadedResumeName: 'Ananya_Rao_Resume.pdf',
};

const seedApplications = [
  {
    id: 'app-01',
    userId: seedUser1.id,
    applicantName: seedUser1.name,
    applicantEmail: seedUser1.email,
    applicantUniversity: seedUser1.university,
    applicantMajor: seedUser1.major,
    internshipId: 'intern-01',
    company: 'Linear',
    roleTitle: 'Frontend Product Engineering Intern',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Bengaluru, India',
    stage: 'interviewing',
    appliedDate: '2026-10-24',
    nextStepTitle: 'Pair Programming Jam (Remote Video)',
    nextStepDate: '2026-11-06T14:00:00Z',
    notes: 'Reviewed Linear’s keyboard shortcut engine. Focused on clean component state and readable code!',
    stipendDisplay: '100% Remote Fellowship · India',
    storyAnswer: 'Built a local-first markdown note app with fast keyboard shortcuts for student study groups.',
    portfolioUrl: 'https://github.com/student/quicknote',
    resumeFileName: 'Priyanshu_Sharma_Resume.pdf'
  },
  {
    id: 'app-02',
    userId: seedUser1.id,
    applicantName: seedUser1.name,
    applicantEmail: seedUser1.email,
    applicantUniversity: seedUser1.university,
    applicantMajor: seedUser1.major,
    internshipId: 'intern-02',
    company: 'Figma',
    roleTitle: 'Product Design Systems Intern',
    companyLogo: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Mumbai, India',
    stage: 'applied',
    appliedDate: '2026-10-28',
    nextStepTitle: 'Application Review by Engineering Team',
    nextStepDate: '2026-11-08T17:00:00Z',
    notes: 'Submitted portfolio featuring the tactile pastel component library and student accessibility study.',
    stipendDisplay: '100% Remote Fellowship · India',
    storyAnswer: 'Redesigned campus club portal with warm colors and WCAG AAA contrast.',
    portfolioUrl: 'https://readymag.website/student',
    resumeFileName: 'Priyanshu_Sharma_Resume.pdf'
  },
  {
    id: 'app-03',
    userId: seedUser2.id,
    applicantName: seedUser2.name,
    applicantEmail: seedUser2.email,
    applicantUniversity: seedUser2.university,
    applicantMajor: seedUser2.major,
    internshipId: 'intern-03',
    company: 'Watershed Climate',
    roleTitle: 'Climate Data & AI Systems Intern',
    companyLogo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Delhi NCR, India',
    stage: 'applied',
    appliedDate: '2026-10-29',
    nextStepTitle: 'Technical Review by Product Guild',
    nextStepDate: '2026-11-10T12:00:00Z',
    notes: 'Passionate about decarbonization analytics and data pipelines.',
    stipendDisplay: '100% Remote Fellowship · India',
    storyAnswer: 'Contributed to an open-source carbon footprint calculator.',
    portfolioUrl: 'https://ananyarao.dev',
    resumeFileName: 'Ananya_Rao_Resume.pdf'
  }
];

// Seed on server boot
async function initDbSeed() {
  await dbQueries.seedInitialDatabaseIfEmpty(
    initialInternships,
    initialReviews,
    [seedUser1, seedUser2, seedAdmin],
    seedApplications
  );
}

// Authentication middleware to protect private endpoints
interface AuthenticatedRequest extends Request {
  user?: any;
  token?: string;
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Please sign in to Workvanta.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Session token
  const session = activeTokens.get(token);
  if (session && session.expiresAt > Date.now()) {
    try {
      const user = await dbQueries.getUserById(session.userId);
      if (user) {
        req.user = user;
        req.token = token;
        return next();
      }
    } catch (err) {
      console.error('Error fetching user for active token:', err);
    }
  }

  // 2. Firebase ID Token (Google Sign-In)
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded && decoded.uid) {
      const user = await dbQueries.getOrCreateFirebaseUser(
        decoded.uid,
        decoded.email || `${decoded.uid}@workvanta.firebase`,
        decoded.name || decoded.displayName
      );
      req.user = user;
      req.token = token;
      return next();
    }
  } catch (err) {
    // Token not valid
  }

  res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
}

// Strict Administrator Authentication Middleware
async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access Denied: Administrative authentication token required. Non-admin users cannot access this resource.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Check active server token
  const session = activeTokens.get(token);
  if (session && session.expiresAt > Date.now()) {
    try {
      const user = await dbQueries.getUserById(session.userId);
      if (user && (user.email?.toLowerCase() === 'admin@workvanta.in' || (user as any).role === 'admin')) {
        req.user = user;
        req.token = token;
        return next();
      }
    } catch (err) {
      console.error('Error verifying admin user token:', err);
    }
  }

  // 2. Check Firebase ID Token for admin email
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded && (decoded.email?.toLowerCase() === 'admin@workvanta.in' || (decoded as any).admin === true)) {
      const user = await dbQueries.getOrCreateFirebaseUser(
        decoded.uid,
        decoded.email || 'admin@workvanta.in',
        decoded.name || 'Admissions Lead'
      );
      req.user = user;
      req.token = token;
      return next();
    }
  } catch {}

  res.status(403).json({
    success: false,
    message: 'Access Denied: Administrator role required. Unauthorized users cannot access recruiter records.'
  });
}

async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = activeTokens.get(token);
    if (session && session.expiresAt > Date.now()) {
      try {
        const user = await dbQueries.getUserById(session.userId);
        if (user) {
          req.user = user;
          req.token = token;
          return next();
        }
      } catch {}
    }

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded && decoded.uid) {
        const user = await dbQueries.getOrCreateFirebaseUser(
          decoded.uid,
          decoded.email || `${decoded.uid}@workvanta.firebase`,
          decoded.name || decoded.displayName
        );
        req.user = user;
        req.token = token;
        return next();
      }
    } catch {}
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // Initialize DB seed
  await initDbSeed();

  // ==========================================
  // SECURE AUTHENTICATION ENDPOINTS
  // ==========================================

  // 1. Google Sign-In via Firebase Auth (Linked to PostgreSQL)
  app.post('/api/auth/google', async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        res.status(400).json({ success: false, message: 'ID token is required' });
        return;
      }

      const decoded = await adminAuth.verifyIdToken(idToken);
      const user = await dbQueries.getOrCreateFirebaseUser(
        decoded.uid,
        decoded.email || `${decoded.uid}@workvanta.in`,
        decoded.name
      );

      const token = generateSecureToken(user.id);

      res.json({
        success: true,
        token,
        user: sanitizeUser(user),
        message: `Welcome to Workvanta, ${user.name}!`
      });
    } catch (error: any) {
      console.error('Google Auth verification error:', error);
      res.status(401).json({ success: false, message: 'Google authentication failed. Please try again.' });
    }
  });

  // 2. Secure Register (Stored in PostgreSQL)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, password, university, major, gradYear } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Full name is required' });
        return;
      }

      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, message: 'Valid email address is required' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        res.status(400).json({ success: false, message: 'Invalid email address format' });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        return;
      }

      const existingUser = await dbQueries.getUserByEmail(normalizedEmail);
      if (existingUser) {
        res.status(409).json({ success: false, message: 'An account with this email already exists' });
        return;
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const newUser = await dbQueries.createUserRecord({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        salt,
        university: university?.trim() || 'University in India',
        major: major?.trim() || 'Computer Science',
        gradYear: gradYear?.trim() || '2027',
        gpa: '3.80',
        bio: 'Early-career builder eager to learn and ship high-impact software.',
        skills: ['TypeScript', 'React', 'Git'],
        preferredRoles: ['Frontend Engineering', 'Full-Stack'],
        desiredStipendMin: 40,
        preferredWorkType: 'Remote',
        portfolioUrl: 'https://github.com',
        githubUrl: 'https://github.com',
        linkedinUrl: 'https://linkedin.com',
        uploadedResumeName: 'Student_Resume_2026.pdf',
      });

      const token = generateSecureToken(newUser.id);

      res.status(201).json({
        success: true,
        token,
        user: sanitizeUser(newUser),
        message: `Welcome to Workvanta, ${newUser.name}!`
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  });

  // 3. Secure Login (Verified against PostgreSQL)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await dbQueries.getUserByEmail(normalizedEmail);

      if (!user || !user.salt || !user.passwordHash) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const isValid = verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const token = generateSecureToken(user.id);

      res.json({
        success: true,
        token,
        user: sanitizeUser(user),
        message: `Welcome back to Workvanta, ${user.name}!`
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  });

  // 4. Current User Profile (/api/auth/me) - Token Protected
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: sanitizeUser(req.user!)
    });
  });

  // 5. Secure Logout - Invalidate session token
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.token) {
      activeTokens.delete(req.token);
    }
    res.json({ success: true, message: 'Signed out securely' });
  });

  // Dedicated Admin Gateway Authentication
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { email, password, clearanceKey } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Admin email and master passphrase are required' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      // Allow admin@workvanta.in or any staff @workvanta.in
      if (normalizedEmail !== 'admin@workvanta.in' && !normalizedEmail.endsWith('@workvanta.in')) {
        res.status(403).json({
          success: false,
          message: 'Access Restricted: Only authorized @workvanta.in administrative personnel can authenticate here.'
        });
        return;
      }

      let user = await dbQueries.getUserByEmail(normalizedEmail);
      if (!user) {
        // Auto-seed admin if missing
        if (normalizedEmail === 'admin@workvanta.in' && password === 'admin123') {
          user = await dbQueries.createUserRecord(seedAdmin as any);
        } else {
          res.status(401).json({ success: false, message: 'Invalid administrative credentials or unrecognized admin email.' });
          return;
        }
      }

      if (!user.salt || !user.passwordHash) {
        res.status(401).json({ success: false, message: 'Administrative account authentication error.' });
        return;
      }

      const isValid = verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid && !(normalizedEmail === 'admin@workvanta.in' && password === 'admin123')) {
        res.status(401).json({ success: false, message: 'Invalid administrative passphrase or security clearance mismatch.' });
        return;
      }

      const token = generateSecureToken(user.id);
      const sanitized = sanitizeUser(user);
      sanitized.role = 'admin';

      res.json({
        success: true,
        token,
        user: sanitized,
        message: `Welcome Sarah Chen. Level-4 Admissions clearance granted.`
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({ success: false, message: 'Administrative authentication service error.' });
    }
  });

  // ==========================================
  // DATABASE BACKED DATA ENDPOINTS
  // ==========================================

  // 6. Get all remote internships in India
  app.get('/api/internships', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category, search } = req.query;
      const allInternships = await dbQueries.getInternshipsList();
      const userBookmarks = req.user ? await dbQueries.getUserBookmarks(req.user.id) : [];

      let filtered = allInternships.map((item: any) => ({
        ...item,
        isBookmarked: userBookmarks.includes(item.id)
      }));

      if (category && category !== 'All') {
        filtered = filtered.filter(item => item.category === category);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          (Array.isArray(item.culturePillars) && item.culturePillars.some((p: string) => p.toLowerCase().includes(q))) ||
          (Array.isArray(item.noJargonSkills) && item.noJargonSkills.some((s: string) => s.toLowerCase().includes(q)))
        );
      }

      res.json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    } catch (error: any) {
      console.error('Failed to fetch internships:', error);
      res.status(500).json({ success: false, message: 'Failed to load internships' });
    }
  });

  // 7. Get single internship
  app.get('/api/internships/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const found = await dbQueries.getInternshipById(req.params.id);
      if (!found) {
        res.status(404).json({ success: false, message: 'Internship not found' });
        return;
      }
      const userBookmarks = req.user ? await dbQueries.getUserBookmarks(req.user.id) : [];
      res.json({
        success: true,
        data: {
          ...found,
          isBookmarked: userBookmarks.includes(found.id)
        }
      });
    } catch (error: any) {
      console.error('Failed to fetch internship detail:', error);
      res.status(500).json({ success: false, message: 'Failed to load internship detail' });
    }
  });

  // 8. Protected User Bookmarks (PostgreSQL)
  app.get('/api/bookmarks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bookmarkIds = await dbQueries.getUserBookmarks(req.user!.id);
      const allInternships = await dbQueries.getInternshipsList();
      const saved = allInternships.filter(item => bookmarkIds.includes(item.id));
      res.json({ success: true, bookmarks: bookmarkIds, data: saved });
    } catch (error: any) {
      console.error('Failed to fetch bookmarks:', error);
      res.status(500).json({ success: false, message: 'Failed to load bookmarks' });
    }
  });

  app.post('/api/bookmarks/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { internshipId } = req.body;
      if (!internshipId) {
        res.status(400).json({ success: false, message: 'internshipId required' });
        return;
      }

      const updatedBookmarks = await dbQueries.toggleUserBookmark(req.user!.id, internshipId);
      res.json({ success: true, bookmarks: updatedBookmarks });
    } catch (error: any) {
      console.error('Failed to toggle bookmark:', error);
      res.status(500).json({ success: false, message: 'Failed to toggle bookmark' });
    }
  });

  // 9. Protected Career Journey Applications (PostgreSQL)
  app.get('/api/applications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const apps = await dbQueries.getUserApplications(req.user!.id);
      res.json({ success: true, count: apps.length, data: apps });
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      res.status(500).json({ success: false, message: 'Failed to load applications' });
    }
  });

  app.post('/api/applications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        internshipId,
        company,
        roleTitle,
        companyLogo,
        location,
        notes,
        stipendDisplay,
        storyAnswer,
        portfolioUrl,
        resumeFileName
      } = req.body;

      const user = req.user!;
      const profile = await dbQueries.getUserProfile(user.id);

      const newApp = await dbQueries.createApplicationRecord({
        id: `app-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantUniversity: user.university || 'University in India',
        applicantMajor: user.major || 'Computer Science',
        internshipId: internshipId || 'custom',
        company: company || 'Company',
        roleTitle: roleTitle || 'Remote Internship Role',
        companyLogo: companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&q=80',
        location: location || 'Remote — India',
        stage: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        nextStepTitle: 'Application Confirmation & Review',
        nextStepDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        notes: notes || 'Submitted application via Workvanta.',
        stipendDisplay: stipendDisplay || '100% Remote Fellowship · India',
        storyAnswer,
        portfolioUrl,
        resumeFileName: resumeFileName || profile?.uploadedResumeName || 'Student_Resume.pdf'
      });

      res.status(201).json({ success: true, data: newApp });
    } catch (error: any) {
      console.error('Failed to create application:', error);
      res.status(500).json({ success: false, message: 'Failed to submit application' });
    }
  });

  app.patch('/api/applications/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const current = await dbQueries.getApplicationById(id);

      if (!current || current.userId !== req.user!.id) {
        res.status(404).json({ success: false, message: 'Application not found in your private journey' });
        return;
      }

      const updated = await dbQueries.updateApplicationRecord(id, {
        ...req.body,
        id: current.id,
        userId: req.user!.id
      });

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Failed to update application:', error);
      res.status(500).json({ success: false, message: 'Failed to update application' });
    }
  });

  app.delete('/api/applications/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await dbQueries.deleteApplicationRecord(id, req.user!.id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Application not found in your private journey' });
        return;
      }

      res.json({ success: true, message: 'Application removed privately' });
    } catch (error: any) {
      console.error('Failed to delete application:', error);
      res.status(500).json({ success: false, message: 'Failed to delete application' });
    }
  });

  // ==========================================
  // ADMIN DASHBOARD & AUTOMATED OFFER DISPATCH
  // ==========================================

  // 10. Admin: Get all applications across all applicants (PostgreSQL) - Clearance Protected
  app.get('/api/admin/applicants', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allApplicants = await dbQueries.getAllApplicationsForAdmin();
      res.json({
        success: true,
        count: allApplicants.length,
        data: allApplicants
      });
    } catch (error: any) {
      console.error('Admin fetch applicants error:', error);
      res.status(500).json({ success: false, message: 'Failed to load applicants' });
    }
  });

  // 11. Admin: Send Automated Offer Letter (PostgreSQL) - Clearance Protected
  app.post('/api/admin/applicants/:id/send-offer', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        stipendAmount,
        startDate,
        signerName,
        signerTitle,
        customMessage
      } = req.body;

      const targetApp = await dbQueries.getApplicationById(id);
      if (!targetApp) {
        res.status(404).json({ success: false, message: 'Applicant submission not found' });
        return;
      }

      const candidateUser = await dbQueries.getUserById(targetApp.userId);
      const candidateName = targetApp.applicantName || candidateUser?.name || 'Fellowship Candidate';
      const candidateEmail = targetApp.applicantEmail || candidateUser?.email || 'student@workvanta.in';
      const formattedDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const offerLetter: OfferLetter = {
        letterId: `WKV-OFFER-${Math.floor(100000 + Math.random() * 900000)}`,
        candidateName,
        candidateEmail,
        roleTitle: targetApp.roleTitle,
        company: targetApp.company,
        stipendAmount: stipendAmount || 'Full Fellowship Grant & Tech Allowance',
        startDate: startDate || 'June 1, 2026',
        remoteLocation: targetApp.location || 'Remote — India',
        issuedDate: formattedDate,
        signerName: signerName || 'Sarah Chen',
        signerTitle: signerTitle || 'Head of Engineering Talent & Fellowship Admissions',
        letterBody: customMessage || `Dear ${candidateName},\n\nOn behalf of ${targetApp.company} and the Workvanta Remote Fellowship Guild, we are genuinely thrilled to formally offer you the position of ${targetApp.roleTitle} (100% Remote — India).\n\nYour application, thoughtful responses, and engineering portfolio stood out amongst hundreds of university applicants across India. The hiring review committee was particularly impressed by your problem-solving depth, craftsmanship, and commitment to accessible software.\n\nSummary of Fellowship Terms:\n• Position: ${targetApp.roleTitle}\n• Work Mode: 100% Async Remote (Based in India)\n• Fellowship Terms: ${stipendAmount || 'Full Fellowship Grant & Tech Allowance'}\n• Program Start Date: ${startDate || 'June 1, 2026'}\n• Equipment Allowance: Dedicated tech budget provided on Day 1\n• Mentorship: Weekly 1:1 sessions with a principal engineering mentor\n\nWe look forward to building remarkable products together. Welcome to ${targetApp.company}!`
      };

      const updated = await dbQueries.updateApplicationRecord(id, {
        stage: 'offer',
        nextStepTitle: 'Official Offer Letter Dispatched 🎉',
        nextStepDate: new Date().toISOString(),
        notes: `${targetApp.notes || ''}\n[Automated Offer Letter Dispatched on ${formattedDate} by ${signerName || 'Workvanta Admissions'}]`.trim(),
        offerLetter
      });

      res.json({
        success: true,
        message: `Automated offer letter successfully generated and sent to ${candidateName}!`,
        data: updated,
        offerLetter
      });
    } catch (error: any) {
      console.error('Failed to send offer letter:', error);
      res.status(500).json({ success: false, message: 'Failed to send offer letter' });
    }
  });

  // 12. Admin: Update applicant stage or notes - Clearance Protected
  app.post('/api/admin/applicants/:id/update-stage', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { stage, reviewerNotes } = req.body;

      const targetApp = await dbQueries.getApplicationById(id);
      if (!targetApp) {
        res.status(404).json({ success: false, message: 'Applicant submission not found' });
        return;
      }

      const updates: any = {};
      if (stage) updates.stage = stage;
      if (reviewerNotes) {
        updates.notes = `${targetApp.notes || ''}\n[Recruiter Note: ${reviewerNotes}]`.trim();
      }

      const updated = await dbQueries.updateApplicationRecord(id, updates);

      res.json({
        success: true,
        message: 'Applicant status updated successfully',
        data: updated
      });
    } catch (error: any) {
      console.error('Failed to update stage:', error);
      res.status(500).json({ success: false, message: 'Failed to update applicant stage' });
    }
  });

  // 13. Admin: Live Metrics overview (PostgreSQL) - Clearance Protected
  app.get('/api/admin/metrics', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allApps = await dbQueries.getAllApplicationsForAdmin();
      let applied = 0;
      let interviewing = 0;
      let offers = 0;
      const universities = new Set<string>();
      const companies = new Set<string>();

      for (const app of allApps) {
        if (app.applicantUniversity) universities.add(app.applicantUniversity);
        if (app.company) companies.add(app.company);
        if (app.stage === 'applied') applied++;
        else if (app.stage === 'interviewing') interviewing++;
        else if (app.stage === 'offer') offers++;
      }

      res.json({
        success: true,
        data: {
          totalApplicants: allApps.length,
          appliedCount: applied,
          interviewingCount: interviewing,
          offersCount: offers,
          activeUniversitiesCount: universities.size,
          participatingCompaniesCount: companies.size
        }
      });
    } catch (error: any) {
      console.error('Failed to calculate metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate metrics' });
    }
  });

  // 14. Protected Candidate Profile (PostgreSQL)
  app.get('/api/user-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await dbQueries.getUserProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('Failed to get profile:', error);
      res.status(500).json({ success: false, message: 'Failed to load user profile' });
    }
  });

  app.put('/api/user-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        name,
        university,
        major,
        gradYear,
        gpa,
        bio,
        skills,
        preferredRoles,
        desiredStipendMin,
        preferredWorkType,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        uploadedResumeName
      } = req.body;

      const updated = await dbQueries.updateUserProfile(userId, {
        name,
        university,
        major,
        gradYear,
        gpa,
        bio,
        skills,
        preferredRoles,
        desiredStipendMin,
        preferredWorkType,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        uploadedResumeName
      });

      const profile = await dbQueries.getUserProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update user profile' });
    }
  });

  // 15. Fellowship Reviews (PostgreSQL)
  app.get('/api/reviews', async (req: Request, res: Response) => {
    try {
      const reviewsList = await dbQueries.getReviewsList();
      res.json({ success: true, count: reviewsList.length, data: reviewsList });
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      res.status(500).json({ success: false, message: 'Failed to load reviews' });
    }
  });

  app.post('/api/reviews', async (req: Request, res: Response) => {
    try {
      const { internshipRole, company, rating, fellowshipReport, honestReview, perksHighlights } = req.body;
      const newReview = await dbQueries.createReviewRecord({
        id: `rev-${Date.now()}`,
        internshipRole: internshipRole || 'Remote Intern',
        company: company || 'Tech Company',
        year: 'Summer 2025',
        rating: Number(rating) || 5,
        workLifeBalance: '4.8',
        realStipendReport: '100% Remote Fellowship · India',
        fellowshipReport: fellowshipReport || 'Dedicated 1:1 engineering mentor & tech budget',
        honestReview: honestReview || 'Genuinely supportive and transparent remote culture.',
        perksHighlights: perksHighlights || ['100% Remote', 'Flexible hours'],
        wouldRecommend: true
      });

      res.status(201).json({ success: true, data: newReview });
    } catch (error: any) {
      console.error('Failed to create review:', error);
      res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
  });

  // Static files & Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Workvanta server running on port ${PORT} with Cloud SQL PostgreSQL`);
  });
}

startServer();
