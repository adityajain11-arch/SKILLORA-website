import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface FirestoreChatSession {
  id: string;
  ownerId: string;
  title: string;
  persona: 'coach' | 'interviewer' | 'resume';
  model: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
  contextRole?: string;
  messageCount: number;
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FirestoreChatMessage {
  id: string;
  sessionId: string;
  ownerId: string;
  role: 'user' | 'model';
  text: string;
  createdAt?: unknown;
}

export interface FirestoreVoiceNote {
  id: string;
  ownerId: string;
  title: string;
  transcript: string;
  durationSec: number;
  mimeType: string;
  personaContext?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function clampStr(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const trimmed = (val ?? fallback).trim();
  return trimmed.slice(0, maxLen) || fallback.slice(0, maxLen);
}

export function makeSafeFirestoreId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export async function syncFirebaseUserProfile(
  fbUser: FirebaseUser,
  extra?: { university?: string; gradYear?: string; major?: string }
): Promise<void> {
  if (!fbUser?.uid || !fbUser.emailVerified) return;

  const publicPath = `users/${fbUser.uid}`;
  const privatePath = `users/${fbUser.uid}/private/info`;

  try {
    const publicRef = doc(db, 'users', fbUser.uid);
    const existingSnap = await getDoc(publicRef);

    const displayName = clampStr(fbUser.displayName || fbUser.email?.split('@')[0], 100, 'Workvanta Student');
    const university = clampStr(extra?.university, 120, 'University in India');
    const photoUrl = fbUser.photoURL ? clampStr(fbUser.photoURL, 500) : undefined;

    if (!existingSnap.exists()) {
      await setDoc(publicRef, {
        uid: fbUser.uid,
        displayName,
        university,
        ...(photoUrl ? { photoUrl } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(publicRef, {
        displayName,
        university,
        ...(photoUrl ? { photoUrl } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  try {
    const privateRef = doc(db, 'users', fbUser.uid, 'private', 'info');
    await setDoc(privateRef, {
      uid: fbUser.uid,
      email: clampStr(fbUser.email, 160, `${fbUser.uid}@workvanta.in`),
      gradYear: clampStr(extra?.gradYear, 20, '2027'),
      major: clampStr(extra?.major, 120, 'Computer Science'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export function subscribeUserChatSessions(
  uid: string,
  onData: (sessions: FirestoreChatSession[]) => void
): Unsubscribe {
  const path = 'chatSessions';
  const q = query(
    collection(db, 'chatSessions'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreChatSession[] = snapshot.docs.map((d) => d.data() as FirestoreChatSession);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeChatMessages(
  sessionId: string,
  uid: string,
  onData: (messages: FirestoreChatMessage[]) => void
): Unsubscribe {
  const path = `chatSessions/${sessionId}/messages`;
  const q = query(
    collection(db, 'chatSessions', sessionId, 'messages'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreChatMessage[] = snapshot.docs.map((d) => d.data() as FirestoreChatMessage);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createFirestoreChatSession(params: {
  sessionId: string;
  ownerId: string;
  title: string;
  persona: 'coach' | 'interviewer' | 'resume';
  model: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
  contextRole?: string;
}): Promise<void> {
  const path = `chatSessions/${params.sessionId}`;
  try {
    await setDoc(doc(db, 'chatSessions', params.sessionId), {
      id: params.sessionId,
      ownerId: params.ownerId,
      title: clampStr(params.title, 140, 'Career Coaching Session'),
      persona: params.persona,
      model: params.model,
      ...(params.contextRole ? { contextRole: clampStr(params.contextRole, 160) } : {}),
      messageCount: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function appendFirestoreChatMessage(params: {
  sessionId: string;
  ownerId: string;
  role: 'user' | 'model';
  text: string;
  persona?: 'coach' | 'interviewer' | 'resume';
  model?: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
}): Promise<void> {
  const messageId = makeSafeFirestoreId('msg');
  const msgPath = `chatSessions/${params.sessionId}/messages/${messageId}`;
  const sessionPath = `chatSessions/${params.sessionId}`;

  try {
    await setDoc(doc(db, 'chatSessions', params.sessionId, 'messages', messageId), {
      id: messageId,
      sessionId: params.sessionId,
      ownerId: params.ownerId,
      role: params.role,
      text: clampStr(params.text, 12000, '...'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }

  try {
    await updateDoc(doc(db, 'chatSessions', params.sessionId), {
      messageCount: increment(1),
      ...(params.persona ? { persona: params.persona } : {}),
      ...(params.model ? { model: params.model } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, sessionPath);
  }
}

export async function deleteFirestoreChatSession(sessionId: string): Promise<void> {
  const path = `chatSessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'chatSessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserVoiceNotes(
  uid: string,
  onData: (notes: FirestoreVoiceNote[]) => void
): Unsubscribe {
  const path = 'voiceNotes';
  const q = query(
    collection(db, 'voiceNotes'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreVoiceNote[] = snapshot.docs.map((d) => d.data() as FirestoreVoiceNote);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createFirestoreVoiceNote(params: {
  ownerId: string;
  title: string;
  transcript: string;
  durationSec: number;
  mimeType: string;
  personaContext?: string;
}): Promise<string> {
  const noteId = makeSafeFirestoreId('vnote');
  const path = `voiceNotes/${noteId}`;
  try {
    await setDoc(doc(db, 'voiceNotes', noteId), {
      id: noteId,
      ownerId: params.ownerId,
      title: clampStr(params.title, 140, 'Voice Interview Practice Note'),
      transcript: clampStr(params.transcript, 16000, 'Empty transcript'),
      durationSec: Math.max(0, Math.min(7200, Math.round(params.durationSec || 0))),
      mimeType: clampStr(params.mimeType, 64, 'audio/webm'),
      ...(params.personaContext ? { personaContext: clampStr(params.personaContext, 64) } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return noteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFirestoreVoiceNote(noteId: string): Promise<void> {
  const path = `voiceNotes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'voiceNotes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
