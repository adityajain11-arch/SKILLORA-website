import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { adminAuth } from './src/lib/firebase-admin.ts';
import firebaseConfig from './firebase-applet-config.json';
import * as dbQueries from './src/db/queries.ts';
import { runMultiTurnChat, transcribeAudioBuffer } from './src/lib/gemini-server.ts';
import {
  SKILLORA_FIXED_DETAILS,
  OFFER_LETTER_TEMPLATE_PDF_PATH,
  buildSkilloraOfferBody,
  formatOfferDate,
  generateSkilloraOfferPdfBuffer,
} from './server/offerLetterGenerator.ts';

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
    companyLogo: '/logos/linear.svg',
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
    companyLogo: '/logos/figma.svg',
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
    companyLogo: '/logos/watershed.svg',
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
    companyLogo: '/logos/supabase.svg',
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
    companyLogo: '/logos/duolingo.svg',
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
    companyLogo: '/logos/canva.svg',
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

// Persistent HMAC-SHA256 session token signing (survives server restarts & page refreshes)
const TOKEN_SECRET =
  process.env.SESSION_SECRET ||
  crypto
    .createHash('sha256')
    .update(String(process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || 'workvanta-persistent-vault-2026'))
    .digest('hex');

const revokedTokens = new Set<string>();

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
  const payload = {
    uid: userId,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days persistent session
    jti: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
  return `wkv2.${payloadB64}.${sigB64}`;
}

function verifySessionToken(token: string): { userId: string } | null {
  try {
    if (!token || revokedTokens.has(token)) return null;
    if (!token.startsWith('wkv2.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, payloadB64, sigB64] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
    const actualBuf = Buffer.from(sigB64, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload?.uid || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
      return null;
    }
    return { userId: String(payload.uid) };
  } catch {
    return null;
  }
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string; name?: string } | null> {
  if (!idToken || idToken.startsWith('wkv2.')) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded?.uid) {
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || (decoded as any).displayName,
      };
    }
  } catch (adminErr) {
    // Fallback to Google Identity Toolkit REST lookup using project Web API key
    try {
      if (firebaseConfig?.apiKey) {
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }
        );
        if (lookupRes.ok) {
          const lookupData = (await lookupRes.json()) as {
            users?: Array<{ localId?: string; email?: string; displayName?: string }>;
          };
          const fbUser = lookupData?.users?.[0];
          if (fbUser?.localId) {
            return {
              uid: fbUser.localId,
              email: fbUser.email,
              name: fbUser.displayName,
            };
          }
        }
      }
    } catch (restErr) {
      console.error('Firebase token verification error:', adminErr, restErr);
    }
  }

  return null;
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
    companyLogo: '/logos/linear.svg',
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
    companyLogo: '/logos/figma.svg',
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
    companyLogo: '/logos/watershed.svg',
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

  // 1. Persistent HMAC-signed session token
  const session = verifySessionToken(token);
  if (session) {
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
  const decoded = await verifyFirebaseIdToken(token);
  if (decoded?.uid) {
    try {
      let user = await dbQueries.getUserByUid(decoded.uid);
      if (!user && decoded.email) {
        user = await dbQueries.getUserByEmail(decoded.email);
      }
      if (!user) {
        user = await dbQueries.getOrCreateFirebaseUser(
          decoded.uid,
          decoded.email || `${decoded.uid}@workvanta.firebase`,
          decoded.name
        );
      }
      req.user = user;
      req.token = token;
      return next();
    } catch (err) {
      console.error('Error resolving Firebase user in requireAuth:', err);
    }
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

  // 1. Check persistent HMAC-signed session token
  const session = verifySessionToken(token);
  if (session) {
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
  const decoded = await verifyFirebaseIdToken(token);
  if (decoded && decoded.email?.toLowerCase() === 'admin@workvanta.in') {
    try {
      let user = await dbQueries.getUserByUid(decoded.uid);
      if (!user && decoded.email) {
        user = await dbQueries.getUserByEmail(decoded.email);
      }
      if (!user) {
        user = await dbQueries.getOrCreateFirebaseUser(
          decoded.uid,
          decoded.email || 'admin@workvanta.in',
          decoded.name || 'Admissions Lead'
        );
      }
      req.user = user;
      req.token = token;
      return next();
    } catch {}
  }

  res.status(403).json({
    success: false,
    message: 'Access Denied: Administrator role required. Unauthorized users cannot access recruiter records.'
  });
}

async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = verifySessionToken(token);
    if (session) {
      try {
        const user = await dbQueries.getUserById(session.userId);
        if (user) {
          req.user = user;
          req.token = token;
          return next();
        }
      } catch {}
    }

    const decoded = await verifyFirebaseIdToken(token);
    if (decoded?.uid) {
      try {
        let user = await dbQueries.getUserByUid(decoded.uid);
        if (!user && decoded.email) {
          user = await dbQueries.getUserByEmail(decoded.email);
        }
        if (user) {
          req.user = user;
          req.token = token;
          return next();
        }
      } catch {}
    }
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize DB seed
  await initDbSeed();

  // ==========================================
  // SECURE AUTHENTICATION ENDPOINTS
  // ==========================================

  // 1. Google Sign-In via Firebase Auth (Linked & Persisted to PostgreSQL)
  app.post('/api/auth/google', async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        res.status(400).json({ success: false, message: 'ID token is required' });
        return;
      }

      const decoded = await verifyFirebaseIdToken(idToken);
      if (!decoded?.uid) {
        res.status(401).json({ success: false, message: 'Google token verification failed. Please sign in again.' });
        return;
      }

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
        authProvider: 'email',
        loginCount: 1,
        lastLoginAt: new Date(),
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

      await dbQueries.recordUserLogin(user.id, 'email');
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
      revokedTokens.add(req.token);
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

      await dbQueries.recordUserLogin(user.id, 'admin');
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
        linkedinId,
        resumeFileName
      } = req.body;

      const cleanResumeName = typeof resumeFileName === 'string' ? resumeFileName.trim() : '';
      if (!cleanResumeName || !/\.(pdf|doc|docx)$/i.test(cleanResumeName)) {
        res.status(400).json({
          success: false,
          message: 'Please upload a valid resume file (PDF, DOC, or DOCX) before submitting.'
        });
        return;
      }

      const cleanLinkedinId = typeof linkedinId === 'string' ? linkedinId.trim() : '';
      if (!cleanLinkedinId) {
        res.status(400).json({
          success: false,
          message: 'LinkedIn ID is required unless marked as NA.'
        });
        return;
      }

      const user = req.user!;
      const baseNotes = (typeof notes === 'string' && notes.trim()) || 'Submitted application via Workvanta.';
      const notesWithLinkedin = baseNotes.includes('LinkedIn ID:')
        ? baseNotes
        : `${baseNotes}\nLinkedIn ID: ${cleanLinkedinId}`;

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
        companyLogo: companyLogo || '/logos/workvanta-default.svg',
        location: location || 'Remote — India',
        stage: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        nextStepTitle: 'Application Confirmation & Review',
        nextStepDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        notes: notesWithLinkedin,
        stipendDisplay: stipendDisplay || '100% Remote Fellowship · India',
        storyAnswer,
        portfolioUrl,
        resumeFileName: cleanResumeName
      });

      await dbQueries.updateUserProfile(user.id, {
        uploadedResumeName: cleanResumeName,
        ...(cleanLinkedinId.toUpperCase() !== 'NA' ? { linkedinUrl: cleanLinkedinId } : { linkedinUrl: 'NA' })
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
        candidateName: overrideName,
        issuedDate: overrideDate,
        domain: overrideDomain,
      } = req.body;

      const targetApp = await dbQueries.getApplicationById(id);
      if (!targetApp) {
        res.status(404).json({ success: false, message: 'Applicant submission not found' });
        return;
      }

      const candidateUser = await dbQueries.getUserById(targetApp.userId);
      const candidateName =
        (typeof overrideName === 'string' && overrideName.trim()) ||
        targetApp.applicantName ||
        candidateUser?.name ||
        'Candidate';
      const candidateEmail = targetApp.applicantEmail || candidateUser?.email || 'student@workvanta.in';
      const domain =
        (typeof overrideDomain === 'string' && overrideDomain.trim()) ||
        targetApp.roleTitle ||
        'Software Engineering';
      const formattedDate = formatOfferDate(overrideDate);

      const offerLetter: OfferLetter = {
        letterId: `SKL-OFFER-${Math.floor(100000 + Math.random() * 900000)}`,
        candidateName,
        candidateEmail,
        roleTitle: domain,
        company: SKILLORA_FIXED_DETAILS.company,
        stipendAmount: SKILLORA_FIXED_DETAILS.stipendAmount,
        startDate: formattedDate,
        remoteLocation: SKILLORA_FIXED_DETAILS.remoteLocation,
        issuedDate: formattedDate,
        signerName: SKILLORA_FIXED_DETAILS.signerName,
        signerTitle: SKILLORA_FIXED_DETAILS.signerTitle,
        letterBody: buildSkilloraOfferBody(domain),
      };

      const updated = await dbQueries.updateApplicationRecord(id, {
        stage: 'offer',
        nextStepTitle: 'Official Offer Letter Dispatched 🎉',
        nextStepDate: new Date().toISOString(),
        notes: `${targetApp.notes || ''}\n[Skillora Offer Letter Dispatched on ${formattedDate} for ${domain}]`.trim(),
        offerLetter
      });

      res.json({
        success: true,
        message: `Offer letter generated and sent to ${candidateName}!`,
        data: updated,
        offerLetter
      });
    } catch (error: any) {
      console.error('Failed to send offer letter:', error);
      res.status(500).json({ success: false, message: 'Failed to send offer letter' });
    }
  });

  // 11b. Download Generated Skillora Offer Letter PDF (Owning Student or Admin)
  app.get('/api/applications/:id/offer-letter.pdf', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const targetApp = await dbQueries.getApplicationById(id);
      if (!targetApp) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      const isAdmin = req.user?.role === 'admin';
      if (!isAdmin && targetApp.userId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      if (!targetApp.offerLetter) {
        res.status(404).json({ success: false, message: 'Offer letter has not been generated yet' });
        return;
      }

      const offer = targetApp.offerLetter as OfferLetter;
      const pdfBuffer = generateSkilloraOfferPdfBuffer({
        candidateName: offer.candidateName,
        issuedDate: offer.issuedDate,
        domain: offer.roleTitle,
      });

      const safeFileName = offer.candidateName.replace(/[^a-zA-Z0-9_-]+/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="offer_letter_${safeFileName}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Failed to generate offer letter PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate offer letter PDF' });
    }
  });

  // 11c. Serve Stored Reference Offer Letter Template PDF (Admin)
  app.get('/api/admin/offer-letter-template.pdf', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.sendFile(OFFER_LETTER_TEMPLATE_PDF_PATH);
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

  // 14. Admin: Schedule Interview Call - Clearance Protected
  app.post('/api/admin/applicants/:id/schedule-interview', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { interviewTitle, interviewDate, meetingLink, interviewerNotes } = req.body;

      const targetApp = await dbQueries.getApplicationById(id);
      if (!targetApp) {
        res.status(404).json({ success: false, message: 'Applicant submission not found' });
        return;
      }

      const updates: any = {
        stage: 'interviewing',
        nextStepTitle: interviewTitle || 'Pair Programming Jam (Remote Video)',
        nextStepDate: interviewDate || new Date(Date.now() + 3 * 86400000).toISOString()
      };

      const meetingInfo = meetingLink ? `\n[Video Meeting Link: ${meetingLink}]` : '';
      const notesInfo = interviewerNotes ? `\n[Interview Note: ${interviewerNotes}]` : '';
      updates.notes = `${targetApp.notes || ''}${meetingInfo}${notesInfo}`.trim();

      const updated = await dbQueries.updateApplicationRecord(id, updates);

      res.json({
        success: true,
        message: `Interview call successfully scheduled with ${targetApp.applicantName}!`,
        data: updated
      });
    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      res.status(500).json({ success: false, message: 'Failed to schedule interview' });
    }
  });

  // 15. Admin: Get all registered users who signed up - Clearance Protected
  app.get('/api/admin/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userList = await dbQueries.getAllUsersForAdmin();
      res.json({
        success: true,
        count: userList.length,
        data: userList
      });
    } catch (error: any) {
      console.error('Failed to get users:', error);
      res.status(500).json({ success: false, message: 'Failed to load user directory' });
    }
  });

  // 16. Admin: Create new remote internship - Clearance Protected
  app.post('/api/admin/internships', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        company,
        companyLogo,
        location,
        workType,
        category,
        hourlyRate,
        monthlyStipend,
        housingStipendMonthly,
        matchScore,
        matchReason,
        friendlyDescription,
        culturePillars,
        responsibilities,
        noJargonSkills,
        interviewRoadmap,
        alumniQuote,
        deadline,
        season
      } = req.body;

      if (!title || !company) {
        res.status(400).json({ success: false, message: 'Role title and company name are required' });
        return;
      }

      const newId = `intern-${Date.now()}`;
      const newInternship = await dbQueries.createInternshipRecord({
        id: newId,
        title: title.trim(),
        company: company.trim(),
        companyLogo: companyLogo?.trim() || '/logos/workvanta-default.svg',
        location: location?.trim() || 'Remote — India',
        workType: workType || 'Remote',
        category: category || 'Software Engineering',
        hourlyRate: Number(hourlyRate) || 50,
        monthlyStipend: Number(monthlyStipend) || 8000,
        housingStipendMonthly: Number(housingStipendMonthly) || 0,
        matchScore: Number(matchScore) || 90,
        matchReason: matchReason?.trim() || 'Matched based on high-impact student projects.',
        friendlyDescription: friendlyDescription?.trim() || 'Exciting remote fellowship opportunity in India.',
        culturePillars: Array.isArray(culturePillars) && culturePillars.length > 0 ? culturePillars : ['Remote First', 'Mentorship Driven', 'High Ownership'],
        responsibilities: Array.isArray(responsibilities) && responsibilities.length > 0 ? responsibilities : ['Collaborate on product features with engineering team', 'Participate in team jams and code reviews'],
        noJargonSkills: Array.isArray(noJargonSkills) && noJargonSkills.length > 0 ? noJargonSkills : ['TypeScript', 'React', 'Problem Solving'],
        interviewRoadmap: Array.isArray(interviewRoadmap) && interviewRoadmap.length > 0 ? interviewRoadmap : [
          { step: 1, title: 'Intro Chat', duration: '30 mins', description: 'Meet the team and share your projects' },
          { step: 2, title: 'Technical Jam', duration: '45 mins', description: 'Practical coding exploration' }
        ],
        alumniQuote: alumniQuote || {
          quote: 'A supportive, asynchronous team culture with genuine mentorship.',
          studentName: 'Workvanta Fellow',
          school: 'Indian University',
          year: '2026'
        },
        deadline: deadline || '2026-12-31',
        season: season || 'Summer 2026'
      });

      res.status(201).json({
        success: true,
        message: 'New remote internship published successfully',
        data: newInternship
      });
    } catch (error: any) {
      console.error('Failed to create internship:', error);
      res.status(500).json({ success: false, message: 'Failed to create internship' });
    }
  });

  // 17. Admin: Update existing internship - Clearance Protected
  app.put('/api/admin/internships/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const target = await dbQueries.getInternshipById(id);
      if (!target) {
        res.status(404).json({ success: false, message: 'Internship not found' });
        return;
      }

      const updated = await dbQueries.updateInternshipRecord(id, req.body);
      res.json({
        success: true,
        message: 'Internship updated successfully',
        data: updated
      });
    } catch (error: any) {
      console.error('Failed to update internship:', error);
      res.status(500).json({ success: false, message: 'Failed to update internship' });
    }
  });

  // 18. Admin: Delete internship - Clearance Protected
  app.delete('/api/admin/internships/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await dbQueries.deleteInternshipRecord(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Internship not found' });
        return;
      }
      res.json({
        success: true,
        message: 'Internship listing removed successfully'
      });
    } catch (error: any) {
      console.error('Failed to delete internship:', error);
      res.status(500).json({ success: false, message: 'Failed to delete internship' });
    }
  });

  // 19. Protected Candidate Profile (PostgreSQL)
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

  // ==========================================
  // GEMINI AI CHATBOT & AUDIO TRANSCRIPTION
  // ==========================================

  app.post('/api/ai/chat', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { messages, persona, model, contextRole } = req.body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ success: false, message: 'Conversation messages array is required.' });
        return;
      }

      const result = await runMultiTurnChat({
        messages,
        persona,
        model,
        contextRole,
      });

      res.json({
        success: true,
        reply: result.reply,
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      console.error('Gemini chat endpoint error:', error);
      const status = typeof error?.status === 'number' ? error.status : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        message: error?.message || 'Failed to generate AI Coach response.',
      });
    }
  });

  app.post('/api/ai/transcribe', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { audioBase64, mimeType, promptHint } = req.body || {};
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        res.status(400).json({ success: false, message: 'audioBase64 payload is required.' });
        return;
      }

      const transcript = await transcribeAudioBuffer({
        audioBase64,
        mimeType: typeof mimeType === 'string' ? mimeType : 'audio/webm',
        promptHint: typeof promptHint === 'string' ? promptHint : undefined,
      });

      res.json({
        success: true,
        transcript,
      });
    } catch (error: any) {
      console.error('Gemini audio transcription error:', error);
      const status = typeof error?.status === 'number' ? error.status : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        message: error?.message || 'Failed to transcribe audio.',
      });
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
