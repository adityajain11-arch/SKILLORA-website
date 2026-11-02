import { pgTable, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  salt: text('salt'),
  university: text('university'),
  major: text('major'),
  gradYear: text('grad_year'),
  gpa: text('gpa'),
  bio: text('bio'),
  skills: json('skills').$type<string[]>(),
  preferredRoles: json('preferred_roles').$type<string[]>(),
  desiredStipendMin: integer('desired_stipend_min'),
  preferredWorkType: text('preferred_work_type'),
  portfolioUrl: text('portfolio_url'),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  uploadedResumeName: text('uploaded_resume_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const internships = pgTable('internships', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  companyLogo: text('company_logo').notNull(),
  location: text('location').notNull(),
  workType: text('work_type').notNull(),
  category: text('category').notNull(),
  hourlyRate: integer('hourly_rate').notNull(),
  monthlyStipend: integer('monthly_stipend').notNull(),
  housingStipendMonthly: integer('housing_stipend_monthly').notNull(),
  matchScore: integer('match_score').notNull(),
  matchReason: text('match_reason').notNull(),
  friendlyDescription: text('friendly_description').notNull(),
  culturePillars: json('culture_pillars').$type<string[]>().notNull(),
  responsibilities: json('responsibilities').$type<string[]>().notNull(),
  noJargonSkills: json('no_jargon_skills').$type<string[]>().notNull(),
  interviewRoadmap: json('interview_roadmap').$type<any[]>().notNull(),
  alumniQuote: json('alumni_quote').$type<any>().notNull(),
  deadline: text('deadline').notNull(),
  season: text('season').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  applicantName: text('applicant_name'),
  applicantEmail: text('applicant_email'),
  applicantUniversity: text('applicant_university'),
  applicantMajor: text('applicant_major'),
  internshipId: text('internship_id').notNull(),
  company: text('company').notNull(),
  roleTitle: text('role_title').notNull(),
  companyLogo: text('company_logo').notNull(),
  location: text('location').notNull(),
  stage: text('stage').notNull(),
  appliedDate: text('applied_date').notNull(),
  nextStepTitle: text('next_step_title'),
  nextStepDate: text('next_step_date'),
  notes: text('notes'),
  stipendDisplay: text('stipend_display').notNull(),
  storyAnswer: text('story_answer'),
  portfolioUrl: text('portfolio_url'),
  resumeFileName: text('resume_file_name'),
  offerLetter: json('offer_letter').$type<any>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookmarks = pgTable('bookmarks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  internshipId: text('internship_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  internshipRole: text('internship_role').notNull(),
  company: text('company').notNull(),
  year: text('year').notNull(),
  rating: integer('rating').notNull(),
  workLifeBalance: text('work_life_balance').notNull(),
  realStipendReport: text('real_stipend_report'),
  fellowshipReport: text('fellowship_report'),
  honestReview: text('honest_review').notNull(),
  perksHighlights: json('perks_highlights').$type<string[]>().notNull(),
  wouldRecommend: boolean('would_recommend').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  bookmarks: many(bookmarks),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));
