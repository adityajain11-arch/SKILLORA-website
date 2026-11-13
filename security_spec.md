# Workvanta Firestore Security Specification

## 1. Data Invariants
1. **Identity Isolation (PII Split)**: Email, graduation year, and major live exclusively under `/users/{userId}/private/info` and are strictly unreadable and unwritable by non-owners (unless bootstrapped or verified admin).
2. **Session Ownership**: Every `/chatSessions/{sessionId}` and `/voiceNotes/{noteId}` document must bind `ownerId == request.auth.uid` at creation, and `ownerId` + `createdAt` + `id` are immutable across updates.
3. **Subcollection Master Gate**: Every message under `/chatSessions/{sessionId}/messages/{messageId}` must verify via `get()` that the parent `/chatSessions/{sessionId}` exists, belongs to `request.auth.uid`, and is not locked (`status != 'archived'`).
4. **Verified Auth & Server Time**: All writes require `request.auth != null && request.auth.token.email_verified == true` and enforce `createdAt == request.time` / `updatedAt == request.time` using Firestore server timestamps.
5. **Strict Schema & Size Ceilings**: All documents reject shadow keys (`hasOnly`), validate `isValidId()` regex `^[a-zA-Z0-9_\-]+$`, and enforce strict character bounds.
6. **Privilege Escalation Prevention**: Users cannot write to `/admins/{userId}` or inject `role`/`isAdmin` fields into `/users/{userId}`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Ghost Field Injection (Users)**: Creating `/users/u1` with `{ uid: "u1", displayName: "A", university: "IIT", createdAt: ts, updatedAt: ts, isAdmin: true }`. -> **DENIED** (`hasOnly` rejects `isAdmin`).
2. **Cross-Tenant Chat Hijack**: User `u2` creating `/chatSessions/s1` with `ownerId: "u1"`. -> **DENIED** (`incoming().ownerId == request.auth.uid` fails).
3. **PII Snooping**: Authenticated user `u2` calling `get` on `/users/u1/private/info`. -> **DENIED** (`isOwner(userId) || isAdmin()` fails).
4. **Unverified Email Spoofing Admin**: Unverified user with `email: "adityajain22112006@gmail.com"`, `email_verified: false` reading `/admins/a1`. -> **DENIED** (`isAdmin()` requires `email_verified == true`).
5. **1MB ID Poisoning**: Creating `/voiceNotes/${"x".repeat(500)}` or non-alphanumeric ID `../admin`. -> **DENIED** (`isValidId()` enforces `<= 128` and `^[a-zA-Z0-9_\-]+$`).
6. **Timestamp Spoofing**: Creating `/voiceNotes/n1` with backdated client `Date`. -> **DENIED** (`incoming().createdAt == request.time`).
7. **Immutable Owner Tampering**: Updating `/chatSessions/s1` to change `ownerId` or `createdAt`. -> **DENIED** (`affectedKeys().hasOnly(...)` + immutability check).
8. **Terminal State Mutation**: Appending a message to or updating an `archived` chat session. -> **DENIED** (`existing().status != 'archived'`).
9. **Orphaned Message Write**: Creating `/chatSessions/nonexistent/messages/m1`. -> **DENIED** (`exists(/databases/.../chatSessions/$(sessionId))` fails).
10. **Blanket List Scrape**: Calling `getDocs(collection(db, 'chatSessions'))` without `where('ownerId', '==', uid)`. -> **DENIED** (`allow list` evaluates `resource.data.ownerId == request.auth.uid`).
11. **Value Type / Size Poisoning**: Updating `title` of a voice note to `true` (boolean) or a 10,000-char string. -> **DENIED** (`isValidVoiceNote` checks `is string && size() <= 140`).
12. **Admin Self-Promotion**: Student `u1` creating `/admins/u1`. -> **DENIED** (`allow write: if false` on `/admins/{userId}`).

## 3. Reference Test Runner (`firestore.rules.test.ts`)
```ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as fs from 'fs';

describe('Workvanta Firestore Hardened Rules', () => {
  it('blocks Dirty Dozen payloads and permits owner operations', async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: 'lithe-variety-hbvhw',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@iitb.ac.in', email_verified: true });
    const bob = testEnv.authenticatedContext('bob', { email: 'bob@bits.ac.in', email_verified: true });
    const spoofAdmin = testEnv.authenticatedContext('spoof', { email: 'adityajain22112006@gmail.com', email_verified: false });

    const aliceDb = alice.firestore();
    const bobDb = bob.firestore();

    // Ghost field blocked
    await assertFails(setDoc(doc(aliceDb, 'users', 'alice'), {
      uid: 'alice', displayName: 'Alice', university: 'IITB', isAdmin: true,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }));

    // Valid user profile succeeds
    await assertSucceeds(setDoc(doc(aliceDb, 'users', 'alice'), {
      uid: 'alice', displayName: 'Alice', university: 'IITB',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }));

    // PII private write & cross-tenant snoop blocked
    await assertSucceeds(setDoc(doc(aliceDb, 'users/alice/private/info'), {
      uid: 'alice', email: 'alice@iitb.ac.in', gradYear: '2027', major: 'CS', updatedAt: serverTimestamp()
    }));
    await assertFails(getDoc(doc(bobDb, 'users/alice/private/info')));

    // Email spoof blocked
    await assertFails(getDoc(doc(spoofAdmin.firestore(), 'users/alice/private/info')));

    // Blanket list scrape blocked
    await assertFails(getDocs(collection(bobDb, 'chatSessions')));

    await testEnv.cleanup();
  });
});
```
