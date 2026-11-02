import { db } from './index.ts';
import { users, internships, applications, bookmarks, reviews } from './schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

// ==========================================
// USER REPOSITORY
// ==========================================

export async function getUserById(id: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw new Error('Database query failed for getUserById', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw new Error('Database query failed for getUserByEmail', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getUserByUid:', error);
    throw new Error('Database query failed for getUserByUid', { cause: error });
  }
}

export async function getOrCreateFirebaseUser(uid: string, email: string, name?: string) {
  try {
    // Check if user with this UID exists
    const existingByUid = await getUserByUid(uid);
    if (existingByUid) {
      return existingByUid;
    }

    // Check if user with this email exists
    const existingByEmail = await getUserByEmail(email);
    if (existingByEmail) {
      // Link Firebase UID to existing account
      const updated = await db
        .update(users)
        .set({ uid })
        .where(eq(users.id, existingByEmail.id))
        .returning();
      return updated[0];
    }

    // Insert new user
    const id = `usr-fb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newUser = await db
      .insert(users)
      .values({
        id,
        uid,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        university: 'University in India',
        major: 'Computer Science',
        gradYear: '2027',
        gpa: '3.85',
        bio: 'Remote engineering fellow passionate about building accessible, performant software.',
        skills: ['TypeScript', 'React', 'Git', 'Node.js'],
        preferredRoles: ['Frontend Engineering', 'Full-Stack'],
        desiredStipendMin: 40,
        preferredWorkType: 'Remote',
        portfolioUrl: 'https://github.com',
        githubUrl: 'https://github.com',
        linkedinUrl: 'https://linkedin.com',
        uploadedResumeName: `${(name || 'Fellow').replace(/\s+/g, '_')}_Resume.pdf`,
      })
      .returning();

    return newUser[0];
  } catch (error) {
    console.error('Error in getOrCreateFirebaseUser:', error);
    throw new Error('Database query failed for getOrCreateFirebaseUser', { cause: error });
  }
}

export async function createUserRecord(userData: typeof users.$inferInsert) {
  try {
    const rows = await db.insert(users).values(userData).returning();
    return rows[0];
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    throw new Error('Database query failed for createUserRecord', { cause: error });
  }
}

export async function getUserProfile(userId: string) {
  try {
    const user = await getUserById(userId);
    if (!user) return null;

    return {
      name: user.name,
      university: user.university || 'University in India',
      major: user.major || 'Computer Science',
      gradYear: user.gradYear || '2027',
      gpa: user.gpa || '3.85',
      bio: user.bio || '',
      skills: (user.skills as string[]) || ['TypeScript', 'React', 'Git'],
      preferredRoles: (user.preferredRoles as string[]) || ['Frontend Engineering', 'Full-Stack'],
      desiredStipendMin: user.desiredStipendMin ?? 40,
      preferredWorkType: user.preferredWorkType || 'Remote',
      portfolioUrl: user.portfolioUrl || '',
      githubUrl: user.githubUrl || '',
      linkedinUrl: user.linkedinUrl || '',
      uploadedResumeName: user.uploadedResumeName || 'Student_Resume_2026.pdf',
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw new Error('Database query failed for getUserProfile', { cause: error });
  }
}

export async function updateUserProfile(userId: string, updates: Partial<typeof users.$inferInsert>) {
  try {
    const rows = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new Error('Database query failed for updateUserProfile', { cause: error });
  }
}

// ==========================================
// INTERNSHIPS REPOSITORY
// ==========================================

export async function getInternshipsList() {
  try {
    return await db.select().from(internships);
  } catch (error) {
    console.error('Error in getInternshipsList:', error);
    throw new Error('Database query failed for getInternshipsList', { cause: error });
  }
}

export async function getInternshipById(id: string) {
  try {
    const rows = await db.select().from(internships).where(eq(internships.id, id)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getInternshipById:', error);
    throw new Error('Database query failed for getInternshipById', { cause: error });
  }
}

// ==========================================
// BOOKMARKS REPOSITORY
// ==========================================

export async function getUserBookmarks(userId: string): Promise<string[]> {
  try {
    const rows = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
    return rows.map((r) => r.internshipId);
  } catch (error) {
    console.error('Error in getUserBookmarks:', error);
    throw new Error('Database query failed for getUserBookmarks', { cause: error });
  }
}

export async function toggleUserBookmark(userId: string, internshipId: string): Promise<string[]> {
  try {
    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.internshipId, internshipId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    } else {
      await db.insert(bookmarks).values({
        id: `bm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId,
        internshipId,
      });
    }

    return await getUserBookmarks(userId);
  } catch (error) {
    console.error('Error in toggleUserBookmark:', error);
    throw new Error('Database query failed for toggleUserBookmark', { cause: error });
  }
}

// ==========================================
// APPLICATIONS REPOSITORY
// ==========================================

export async function getUserApplications(userId: string) {
  try {
    const rows = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));
    // Sort descending by appliedDate or createdAt
    return rows.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  } catch (error) {
    console.error('Error in getUserApplications:', error);
    throw new Error('Database query failed for getUserApplications', { cause: error });
  }
}

export async function getAllApplicationsForAdmin() {
  try {
    const rows = await db
      .select({
        app: applications,
        userName: users.name,
        userEmail: users.email,
        userUniversity: users.university,
        userMajor: users.major,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id));

    const result = rows.map((row) => ({
      ...row.app,
      applicantName: row.app.applicantName || row.userName || 'Candidate',
      applicantEmail: row.app.applicantEmail || row.userEmail || 'student@workvanta.in',
      applicantUniversity: row.app.applicantUniversity || row.userUniversity || 'University in India',
      applicantMajor: row.app.applicantMajor || row.userMajor || 'Computer Science',
    }));

    result.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
    return result;
  } catch (error) {
    console.error('Error in getAllApplicationsForAdmin:', error);
    throw new Error('Database query failed for getAllApplicationsForAdmin', { cause: error });
  }
}

export async function getApplicationById(id: string) {
  try {
    const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getApplicationById:', error);
    throw new Error('Database query failed for getApplicationById', { cause: error });
  }
}

export async function createApplicationRecord(data: typeof applications.$inferInsert) {
  try {
    const rows = await db.insert(applications).values(data).returning();
    return rows[0];
  } catch (error) {
    console.error('Error in createApplicationRecord:', error);
    throw new Error('Database query failed for createApplicationRecord', { cause: error });
  }
}

export async function updateApplicationRecord(id: string, updates: Partial<typeof applications.$inferInsert>) {
  try {
    const rows = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning();
    return rows[0] || null;
  } catch (error) {
    console.error('Error in updateApplicationRecord:', error);
    throw new Error('Database query failed for updateApplicationRecord', { cause: error });
  }
}

export async function deleteApplicationRecord(id: string, userId: string) {
  try {
    const deleted = await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Error in deleteApplicationRecord:', error);
    throw new Error('Database query failed for deleteApplicationRecord', { cause: error });
  }
}

// ==========================================
// REVIEWS REPOSITORY
// ==========================================

export async function getReviewsList() {
  try {
    const rows = await db.select().from(reviews);
    return rows.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  } catch (error) {
    console.error('Error in getReviewsList:', error);
    throw new Error('Database query failed for getReviewsList', { cause: error });
  }
}

export async function createReviewRecord(data: typeof reviews.$inferInsert) {
  try {
    const rows = await db.insert(reviews).values(data).returning();
    return rows[0];
  } catch (error) {
    console.error('Error in createReviewRecord:', error);
    throw new Error('Database query failed for createReviewRecord', { cause: error });
  }
}

// ==========================================
// SEEDING HELPER
// ==========================================

export async function seedInitialDatabaseIfEmpty(
  seedInternships: any[],
  seedReviews: any[],
  seedUsers: any[],
  seedApps: any[]
) {
  try {
    // 1. Seed internships
    const existingInternships = await db.select({ count: sql<number>`count(*)` }).from(internships);
    if (Number(existingInternships[0]?.count || 0) === 0) {
      console.log('Seeding initial remote internships into PostgreSQL...');
      for (const item of seedInternships) {
        await db.insert(internships).values(item).onConflictDoNothing();
      }
    }

    // 2. Seed reviews
    const existingReviews = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    if (Number(existingReviews[0]?.count || 0) === 0) {
      console.log('Seeding initial fellowship reviews into PostgreSQL...');
      for (const rev of seedReviews) {
        await db.insert(reviews).values(rev).onConflictDoNothing();
      }
    }

    // 3. Seed users
    for (const u of seedUsers) {
      await db.insert(users).values(u).onConflictDoNothing();
    }

    // 4. Seed applications
    const existingApps = await db.select({ count: sql<number>`count(*)` }).from(applications);
    if (Number(existingApps[0]?.count || 0) === 0) {
      console.log('Seeding initial candidate applications into PostgreSQL...');
      for (const app of seedApps) {
        await db.insert(applications).values(app).onConflictDoNothing();
      }
    }
  } catch (error) {
    console.error('Warning during database seeding:', error);
  }
}
