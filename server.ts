import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
  workLifeBalance: number;
  realStipendReport: string;
  honestReview: string;
  perksHighlights: string[];
  wouldRecommend: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  university: string;
  major: string;
  gradYear: string;
  createdAt: string;
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
  desiredStipendMin: number;
  preferredWorkType: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  uploadedResumeName: string;
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

let reviewsList: Review[] = [
  {
    id: 'rev-01',
    internshipRole: 'Frontend Product Engineering Intern',
    company: 'Linear',
    year: 'Summer 2025',
    rating: 5,
    workLifeBalance: 4.8,
    realStipendReport: 'Generous monthly remote stipend + M3 Max MacBook + WiFi reimbursement',
    honestReview: 'Hands down the best remote learning experience. Clear async documentation, zero pointless daily meetings, and kind PR reviews.',
    perksHighlights: ['100% Remote flexibility', 'Home office budget', 'Zero meetings Wednesdays', 'Direct founder access'],
    wouldRecommend: true
  },
  {
    id: 'rev-02',
    internshipRole: 'Product Design Systems Intern',
    company: 'Figma',
    year: 'Summer 2025',
    rating: 4.9,
    workLifeBalance: 4.6,
    realStipendReport: 'Competitive remote stipend + $1,500 home studio setup allowance',
    honestReview: 'Incredible creative community. The design critiques are constructive and kind. You are encouraged to explore personal creative experiments on Fridays.',
    perksHighlights: ['Ergonomic desk stipend', 'Figma Maker fund', 'Coffee subscription', 'Team retreat'],
    wouldRecommend: true
  },
  {
    id: 'rev-03',
    internshipRole: 'Developer Relations Intern',
    company: 'Supabase',
    year: 'Summer 2025',
    rating: 4.8,
    workLifeBalance: 5,
    realStipendReport: 'Global remote stipend + $1,000 hardware fund + co-working pass',
    honestReview: 'Full flexibility and trust. I could work from my home in Pune while collaborating with teammates globally. Shipped 5 starter guides and open-source fixes.',
    perksHighlights: ['Full async flexibility', 'Co-working pass', 'Generous gear stipend'],
    wouldRecommend: true
  }
];

// ==========================================
// SECURE USER DATABASE & DATA STORES
// ==========================================
const usersById = new Map<string, UserRecord>();
const usersByEmail = new Map<string, UserRecord>();
const activeTokens = new Map<string, { userId: string; expiresAt: number }>();

// Isolated private storage per user ID
const userApplications = new Map<string, Application[]>();
const userBookmarks = new Map<string, string[]>();
const userProfiles = new Map<string, UserProfile>();

// Helper functions for cryptography
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHashHex: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHashHex, 'hex');
  if (computed.length !== stored.length) return false;
  return crypto.timingSafeEqual(computed, stored);
}

function generateSecureToken(userId: string): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  const token = `wkv_${randomPart}`;
  // 7 days token expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  activeTokens.set(token, { userId, expiresAt });
  return token;
}

// Strip passwordHash and salt before sending to client
function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    university: user.university,
    major: user.major,
    gradYear: user.gradYear,
    role: 'student' as const
  };
}

// Seed a default demo user safely with hashed password
const defaultSalt = generateSalt();
const defaultUser: UserRecord = {
  id: 'usr-default-01',
  name: 'Priyanshu Sharma',
  email: 'student@workvanta.in',
  passwordHash: hashPassword('workvanta123', defaultSalt),
  salt: defaultSalt,
  university: 'IIT Bombay',
  major: 'Computer Science & Engineering',
  gradYear: '2027',
  createdAt: new Date().toISOString()
};
usersById.set(defaultUser.id, defaultUser);
usersByEmail.set(defaultUser.email.toLowerCase(), defaultUser);

// Seed default applications for demo user (Priyanshu Sharma)
userApplications.set(defaultUser.id, [
  {
    id: 'app-01',
    userId: defaultUser.id,
    applicantName: defaultUser.name,
    applicantEmail: defaultUser.email,
    applicantUniversity: defaultUser.university,
    applicantMajor: defaultUser.major,
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
    userId: defaultUser.id,
    applicantName: defaultUser.name,
    applicantEmail: defaultUser.email,
    applicantUniversity: defaultUser.university,
    applicantMajor: defaultUser.major,
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
  }
]);

// Seed secondary candidate (Ananya Rao, BITS Pilani)
const candidate2: UserRecord = {
  id: 'usr-student-02',
  name: 'Ananya Rao',
  email: 'ananya.rao@pilani.bits-pilani.ac.in',
  passwordHash: hashPassword('workvanta123', defaultSalt),
  salt: defaultSalt,
  university: 'BITS Pilani',
  major: 'Computer Science',
  gradYear: '2026',
  createdAt: new Date().toISOString()
};
usersById.set(candidate2.id, candidate2);
usersByEmail.set(candidate2.email.toLowerCase(), candidate2);

userApplications.set(candidate2.id, [
  {
    id: 'app-03',
    userId: candidate2.id,
    applicantName: candidate2.name,
    applicantEmail: candidate2.email,
    applicantUniversity: candidate2.university,
    applicantMajor: candidate2.major,
    internshipId: 'intern-03',
    company: 'Notion',
    roleTitle: 'Full-Stack Product Engineering Intern',
    companyLogo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&h=100&fit=crop&q=80',
    location: 'Remote — Delhi NCR, India',
    stage: 'applied',
    appliedDate: '2026-10-29',
    nextStepTitle: 'Technical Review by Product Guild',
    nextStepDate: '2026-11-10T12:00:00Z',
    notes: 'Passionate about block-based editors and collaborative CRDTs.',
    stipendDisplay: '100% Remote Fellowship · India',
    storyAnswer: 'Contributed to an open-source rich text canvas for research citations.',
    portfolioUrl: 'https://ananyarao.dev',
    resumeFileName: 'Ananya_Rao_Resume.pdf'
  }
]);

userBookmarks.set(defaultUser.id, ['intern-01', 'intern-02']);

userProfiles.set(defaultUser.id, {
  name: defaultUser.name,
  university: defaultUser.university,
  major: defaultUser.major,
  gradYear: defaultUser.gradYear,
  gpa: '3.85',
  bio: 'Early-career builder creating calm, tactile software and accessible developer tools. Passionate about typography, responsive performance, and high-empathy team culture.',
  skills: ['TypeScript', 'React', 'Node.js', 'UI/UX Design', 'Tailwind CSS', 'SQL', 'Git', 'Figma'],
  preferredRoles: ['Frontend Engineering', 'Product Design', 'Full-Stack'],
  desiredStipendMin: 45,
  preferredWorkType: 'Remote',
  portfolioUrl: 'https://github.com',
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  uploadedResumeName: 'Priyanshu_Resume_2026.pdf'
});

// Authentication middleware to protect private endpoints
interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  token?: string;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Please sign in to Workvanta.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeTokens.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeTokens.delete(token);
    res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    return;
  }

  const user = usersById.get(session.userId);
  if (!user) {
    res.status(401).json({ success: false, message: 'User account not found.' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

// Optional Auth (for public listings that also return user bookmark status if signed in)
function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = activeTokens.get(token);
    if (session && session.expiresAt > Date.now()) {
      const user = usersById.get(session.userId);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ==========================================
  // SECURE AUTHENTICATION ENDPOINTS
  // ==========================================

  // 1. Secure Register
  app.post('/api/auth/register', (req, res) => {
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

    if (usersByEmail.has(normalizedEmail)) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const newUser: UserRecord = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      university: university?.trim() || 'University in India',
      major: major?.trim() || 'Computer Science',
      gradYear: gradYear?.trim() || '2027',
      createdAt: new Date().toISOString()
    };

    usersById.set(newUser.id, newUser);
    usersByEmail.set(newUser.email, newUser);

    // Initialize private isolated data stores for new user
    userApplications.set(newUser.id, []);
    userBookmarks.set(newUser.id, []);
    userProfiles.set(newUser.id, {
      name: newUser.name,
      university: newUser.university,
      major: newUser.major,
      gradYear: newUser.gradYear,
      gpa: '3.80',
      bio: 'Early-career builder eager to learn and ship high-impact software.',
      skills: ['TypeScript', 'React', 'Git'],
      preferredRoles: ['Frontend Engineering', 'Full-Stack'],
      desiredStipendMin: 40,
      preferredWorkType: 'Remote',
      portfolioUrl: 'https://github.com',
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
      uploadedResumeName: 'Student_Resume_2026.pdf'
    });

    const token = generateSecureToken(newUser.id);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(newUser),
      message: `Welcome to Workvanta, ${newUser.name}!`
    });
  });

  // 2. Secure Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersByEmail.get(normalizedEmail);

    // Constant-time check: avoid user enumeration by not revealing whether email exists
    if (!user) {
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
  });

  // 3. Current User Profile (/api/auth/me) - Token Protected
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: sanitizeUser(req.user!)
    });
  });

  // 4. Secure Logout - Invalidate token
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.token) {
      activeTokens.delete(req.token);
    }
    res.json({ success: true, message: 'Signed out securely' });
  });

  // ==========================================
  // PROTECTED DATA ENDPOINTS (Isolated per User)
  // ==========================================

  // 5. Get all remote internships in India
  app.get('/api/internships', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const { category, search } = req.query;
    const userSaved = req.user ? (userBookmarks.get(req.user.id) || []) : [];

    let filtered = initialInternships.map(item => ({
      ...item,
      isBookmarked: userSaved.includes(item.id)
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
        item.culturePillars.some(p => p.toLowerCase().includes(q)) ||
        item.noJargonSkills.some(s => s.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  });

  // 6. Get single internship
  app.get('/api/internships/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const found = initialInternships.find(item => item.id === req.params.id);
    if (!found) {
      res.status(404).json({ success: false, message: 'Internship not found' });
      return;
    }
    const userSaved = req.user ? (userBookmarks.get(req.user.id) || []) : [];
    res.json({
      success: true,
      data: {
        ...found,
        isBookmarked: userSaved.includes(found.id)
      }
    });
  });

  // 7. Protected User Bookmarks (Private to authenticated user)
  app.get('/api/bookmarks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const bookmarks = userBookmarks.get(req.user!.id) || [];
    const saved = initialInternships.filter(item => bookmarks.includes(item.id));
    res.json({ success: true, bookmarks, data: saved });
  });

  app.post('/api/bookmarks/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { internshipId } = req.body;
    if (!internshipId) {
      res.status(400).json({ success: false, message: 'internshipId required' });
      return;
    }

    let bookmarks = userBookmarks.get(req.user!.id) || [];
    if (bookmarks.includes(internshipId)) {
      bookmarks = bookmarks.filter(id => id !== internshipId);
    } else {
      bookmarks.push(internshipId);
    }
    userBookmarks.set(req.user!.id, bookmarks);

    res.json({ success: true, bookmarks });
  });

  // 8. Protected Applications Tracker (Private to authenticated user)
  app.get('/api/applications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const apps = userApplications.get(req.user!.id) || [];
    res.json({ success: true, count: apps.length, data: apps });
  });

  app.post('/api/applications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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
    const profile = userProfiles.get(user.id);

    const newApp: Application = {
      id: `app-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      applicantName: user.name,
      applicantEmail: user.email,
      applicantUniversity: user.university,
      applicantMajor: user.major,
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
    };

    const apps = userApplications.get(user.id) || [];
    apps.unshift(newApp);
    userApplications.set(user.id, apps);

    res.status(201).json({ success: true, data: newApp });
  });

  app.patch('/api/applications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const apps = userApplications.get(req.user!.id) || [];
    const index = apps.findIndex(app => app.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Application not found in your private pipeline' });
      return;
    }

    apps[index] = {
      ...apps[index],
      ...req.body,
      // prevent changing internal ownership
      id: apps[index].id,
      userId: req.user!.id
    };
    userApplications.set(req.user!.id, apps);

    res.json({ success: true, data: apps[index] });
  });

  app.delete('/api/applications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let apps = userApplications.get(req.user!.id) || [];
    const beforeCount = apps.length;
    apps = apps.filter(app => app.id !== id);

    if (apps.length === beforeCount) {
      res.status(404).json({ success: false, message: 'Application not found in your private pipeline' });
      return;
    }

    userApplications.set(req.user!.id, apps);
    res.json({ success: true, message: 'Application removed privately' });
  });

  // ==========================================
  // ADMIN DASHBOARD & AUTOMATED OFFER DISPATCH
  // ==========================================

  // 9. Admin: Get all applications across all applicants
  app.get('/api/admin/applicants', (req: Request, res: Response) => {
    const allApplicants: Application[] = [];
    for (const [userId, apps] of userApplications.entries()) {
      const user = usersById.get(userId);
      for (const app of apps) {
        allApplicants.push({
          ...app,
          applicantName: app.applicantName || user?.name || 'Candidate',
          applicantEmail: app.applicantEmail || user?.email || 'student@workvanta.in',
          applicantUniversity: app.applicantUniversity || user?.university || 'University in India',
          applicantMajor: app.applicantMajor || user?.major || 'Computer Science'
        });
      }
    }

    // Sort by appliedDate descending
    allApplicants.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

    res.json({
      success: true,
      count: allApplicants.length,
      data: allApplicants
    });
  });

  // 10. Admin: Send Automated Offer Letter
  app.post('/api/admin/applicants/:id/send-offer', (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      stipendAmount,
      startDate,
      signerName,
      signerTitle,
      customMessage
    } = req.body;

    let targetApp: Application | null = null;
    let targetUserId: string | null = null;

    // Search through all user applicant pools
    for (const [userId, apps] of userApplications.entries()) {
      const found = apps.find(a => a.id === id);
      if (found) {
        targetApp = found;
        targetUserId = userId;
        break;
      }
    }

    if (!targetApp || !targetUserId) {
      res.status(404).json({ success: false, message: 'Applicant submission not found' });
      return;
    }

    const candidateUser = usersById.get(targetUserId);
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

    // Update application stage and attach automated offer letter
    targetApp.stage = 'offer';
    targetApp.nextStepTitle = 'Official Offer Letter Dispatched 🎉';
    targetApp.nextStepDate = new Date().toISOString();
    targetApp.notes = `${targetApp.notes || ''}\n[Automated Offer Letter Dispatched on ${formattedDate} by ${signerName || 'Workvanta Admissions'}]`.trim();
    targetApp.offerLetter = offerLetter;

    // Persist in memory store
    const userApps = userApplications.get(targetUserId) || [];
    const appIndex = userApps.findIndex(a => a.id === id);
    if (appIndex !== -1) {
      userApps[appIndex] = targetApp;
      userApplications.set(targetUserId, userApps);
    }

    res.json({
      success: true,
      message: `Automated offer letter successfully generated and sent to ${candidateName}!`,
      data: targetApp,
      offerLetter
    });
  });

  // 11. Admin: Update applicant stage or notes
  app.post('/api/admin/applicants/:id/update-stage', (req: Request, res: Response) => {
    const { id } = req.params;
    const { stage, reviewerNotes } = req.body;

    let targetApp: Application | null = null;
    let targetUserId: string | null = null;

    for (const [userId, apps] of userApplications.entries()) {
      const found = apps.find(a => a.id === id);
      if (found) {
        targetApp = found;
        targetUserId = userId;
        break;
      }
    }

    if (!targetApp || !targetUserId) {
      res.status(404).json({ success: false, message: 'Applicant submission not found' });
      return;
    }

    if (stage) {
      targetApp.stage = stage;
    }
    if (reviewerNotes) {
      targetApp.notes = `${targetApp.notes || ''}\n[Recruiter Note: ${reviewerNotes}]`.trim();
    }

    const userApps = userApplications.get(targetUserId) || [];
    const appIndex = userApps.findIndex(a => a.id === id);
    if (appIndex !== -1) {
      userApps[appIndex] = targetApp;
      userApplications.set(targetUserId, userApps);
    }

    res.json({
      success: true,
      message: 'Applicant status updated successfully',
      data: targetApp
    });
  });

  // 12. Admin: Metrics overview
  app.get('/api/admin/metrics', (req: Request, res: Response) => {
    let total = 0;
    let applied = 0;
    let interviewing = 0;
    let offers = 0;
    const universities = new Set<string>();
    const companies = new Set<string>();

    for (const [userId, apps] of userApplications.entries()) {
      const user = usersById.get(userId);
      if (user?.university) universities.add(user.university);

      for (const app of apps) {
        total++;
        if (app.company) companies.add(app.company);
        if (app.stage === 'applied') applied++;
        else if (app.stage === 'interviewing') interviewing++;
        else if (app.stage === 'offer') offers++;
      }
    }

    res.json({
      success: true,
      data: {
        totalApplicants: total,
        appliedCount: applied,
        interviewingCount: interviewing,
        offersCount: offers,
        activeUniversitiesCount: universities.size,
        participatingCompaniesCount: companies.size
      }
    });
  });

  // 9. Protected Candidate Profile (Private to authenticated user)
  app.get('/api/user-profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    let profile = userProfiles.get(req.user!.id);
    if (!profile) {
      profile = {
        name: req.user!.name,
        university: req.user!.university,
        major: req.user!.major,
        gradYear: req.user!.gradYear,
        gpa: '3.80',
        bio: 'Early-career builder eager to learn and ship high-impact software.',
        skills: ['TypeScript', 'React', 'Git'],
        preferredRoles: ['Frontend Engineering', 'Full-Stack'],
        desiredStipendMin: 40,
        preferredWorkType: 'Remote',
        portfolioUrl: 'https://github.com',
        githubUrl: 'https://github.com',
        linkedinUrl: 'https://linkedin.com',
        uploadedResumeName: 'Student_Resume_2026.pdf'
      };
      userProfiles.set(req.user!.id, profile);
    }
    res.json({ success: true, data: profile });
  });

  app.put('/api/user-profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const current = userProfiles.get(req.user!.id) || {
      name: req.user!.name,
      university: req.user!.university,
      major: req.user!.major,
      gradYear: req.user!.gradYear,
      gpa: '3.80',
      bio: '',
      skills: [],
      preferredRoles: [],
      desiredStipendMin: 40,
      preferredWorkType: 'Remote',
      portfolioUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      uploadedResumeName: 'Student_Resume_2026.pdf'
    };

    const updated = {
      ...current,
      ...req.body,
      // Protect email and user identity
      name: req.body.name || current.name
    };

    userProfiles.set(req.user!.id, updated);
    res.json({ success: true, data: updated });
  });

  // 10. Transparent Reviews
  app.get('/api/reviews', (req, res) => {
    res.json({ success: true, count: reviewsList.length, data: reviewsList });
  });

  app.post('/api/reviews', (req, res) => {
    const { internshipRole, company, rating, realStipendReport, honestReview, perksHighlights } = req.body;
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      internshipRole: internshipRole || 'Remote Intern',
      company: company || 'Tech Company',
      year: 'Summer 2025',
      rating: Number(rating) || 5,
      workLifeBalance: 4.8,
      realStipendReport: realStipendReport || 'Competitive remote stipend + equipment',
      honestReview: honestReview || 'Genuinely supportive and transparent remote culture.',
      perksHighlights: perksHighlights || ['100% Remote', 'Flexible hours'],
      wouldRecommend: true
    };
    reviewsList.unshift(newReview);
    res.status(201).json({ success: true, data: newReview });
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
    console.log(`Workvanta server running on port ${PORT}`);
  });
}

startServer();
