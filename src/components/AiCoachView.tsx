import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Square,
  Upload,
  Sparkles,
  Bot,
  User as UserIcon,
  Plus,
  Trash2,
  Cloud,
  Volume2,
  FileAudio,
  Briefcase,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  FirestoreChatSession,
  FirestoreVoiceNote,
  subscribeUserChatSessions,
  subscribeChatMessages,
  subscribeUserVoiceNotes,
  createFirestoreChatSession,
  appendFirestoreChatMessage,
  deleteFirestoreChatSession,
  createFirestoreVoiceNote,
  deleteFirestoreVoiceNote,
  syncFirebaseUserProfile,
  makeSafeFirestoreId,
} from '../lib/firestore-sync';
import { Internship, AuthUser } from '../types';

interface AiCoachViewProps {
  internships: Internship[];
  currentUser: AuthUser | null;
  onGoogleSessionLinked?: (user: AuthUser, token?: string) => void;
}

type PersonaType = 'coach' | 'interviewer' | 'resume';
type ModelType = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

interface LocalMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const PERSONA_LABELS: Record<PersonaType, { label: string; desc: string; starters: string[] }> = {
  coach: {
    label: 'Career Mentor',
    desc: 'Remote internship strategy, open-source prep & cohort guidance',
    starters: [
      'How do I stand out for Linear or Figma remote internships in India?',
      'Give me a 2-week prep roadmap for an async engineering fellowship.',
    ],
  },
  interviewer: {
    label: 'Mock Interviewer',
    desc: 'Conversational technical & system design practice (zero LeetCode trickery)',
    starters: [
      'Start a relaxed 30-minute pair programming & UI architecture mock interview.',
      'Ask me a practical question about state sync and frontend performance.',
    ],
  },
  resume: {
    label: 'Resume & Pitch Strategist',
    desc: 'Transform student project descriptions into high-impact stories',
    starters: [
      'Help me rewrite my project bullet points for a Product Engineering role.',
      'Draft a crisp 4-sentence cold intro message to a remote startup founder.',
    ],
  },
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio stream.'));
    reader.readAsDataURL(blob);
  });
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  internships,
  currentUser,
  onGoogleSessionLinked,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  // Coach settings
  const [persona, setPersona] = useState<PersonaType>('coach');
  const [model, setModel] = useState<ModelType>('gemini-4-hydrogen');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Multi-turn chat state
  const [sessions, setSessions] = useState<FirestoreChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Audio recording & transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<FirestoreVoiceNote[]>([]);
  const [localVoiceNotes, setLocalVoiceNotes] = useState<
    Array<{ id: string; title: string; transcript: string; durationSec: number }>
  >([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordingSecRef = useRef(0);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Watch Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Scroll chat thread on new messages
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Firestore real-time listeners (strictly gated on authenticated & verified Firebase user)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      setSessions([]);
      setVoiceNotes([]);
      return;
    }

    const unsubSessions = subscribeUserChatSessions(firebaseUser.uid, (list) => {
      setSessions(list);
      setActiveSessionId((prev) => prev || (list[0]?.id ?? null));
    });

    const unsubNotes = subscribeUserVoiceNotes(firebaseUser.uid, (notes) => {
      setVoiceNotes(notes);
    });

    return () => {
      unsubSessions();
      unsubNotes();
    };
  }, [authReady, firebaseUser]);

  // Subscribe to messages for active Firestore session
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified || !activeSessionId) {
      return;
    }

    const unsubMsgs = subscribeChatMessages(activeSessionId, firebaseUser.uid, (cloudMsgs) => {
      setMessages(
        cloudMsgs.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
        }))
      );
    });

    return () => unsubMsgs();
  }, [authReady, firebaseUser, activeSessionId]);

  const handleEnableCloudSync = async () => {
    setChatError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await syncFirebaseUserProfile(result.user, {
        university: currentUser?.university || 'University in India',
        gradYear: currentUser?.gradYear || '2027',
        major: currentUser?.major || 'Computer Science',
      });
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.success && data.user && onGoogleSessionLinked) {
        onGoogleSessionLinked(data.user, data.token);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setChatError(err?.message || 'Could not connect Google Cloud Firestore sync.');
      }
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setChatError(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!firebaseUser) return;
    try {
      await deleteFirestoreChatSession(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err: any) {
      setChatError(err?.message || 'Failed to delete session.');
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const content = (overrideText ?? inputText).trim();
    if (!content || isSending) return;

    setChatError(null);
    if (!overrideText) setInputText('');
    setIsSending(true);

    const userMsg: LocalMessage = {
      id: `local-u-${Date.now()}`,
      role: 'user',
      text: content,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    let targetSessionId = activeSessionId;
    const canUseCloud = Boolean(firebaseUser && firebaseUser.emailVerified);

    try {
      if (canUseCloud && firebaseUser) {
        if (!targetSessionId) {
          targetSessionId = makeSafeFirestoreId('chat');
          await createFirestoreChatSession({
            sessionId: targetSessionId,
            ownerId: firebaseUser.uid,
            title: content.slice(0, 80),
            persona,
            model,
            contextRole: selectedRole || undefined,
          });
          setActiveSessionId(targetSessionId);
        }
        await appendFirestoreChatMessage({
          sessionId: targetSessionId,
          ownerId: firebaseUser.uid,
          role: 'user',
          text: content,
          persona,
          model,
        });
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          persona,
          model,
          contextRole: selectedRole || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'AI Coach could not complete your request.');
      }

      const replyText = String(data.reply || '').trim();
      const modelMsg: LocalMessage = {
        id: `local-m-${Date.now()}`,
        role: 'model',
        text: replyText,
      };
      setMessages((prev) => [...prev, modelMsg]);

      if (canUseCloud && firebaseUser && targetSessionId) {
        await appendFirestoreChatMessage({
          sessionId: targetSessionId,
          ownerId: firebaseUser.uid,
          role: 'model',
          text: replyText,
          persona,
          model,
        });
      }
    } catch (err: any) {
      setChatError(err?.message || 'Unable to reach Workvanta AI Coach.');
    } finally {
      setIsSending(false);
    }
  };

  // ==========================================
  // AUDIO RECORDING & TRANSCRIPTION
  // ==========================================

  const processAudioTranscription = async (blob: Blob, durationSeconds: number, sourceTitle: string) => {
    setIsTranscribing(true);
    setTranscribeError(null);
    try {
      const audioBase64 = await blobToBase64(blob);
      const mimeType = blob.type || 'audio/webm';

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          promptHint: `Transcribe this student interview response or career question accurately.`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Transcription failed.');
      }

      const transcript = String(data.transcript || '').trim();
      if (!transcript) {
        throw new Error('No speech was detected in the recording.');
      }

      // Append transcript cleanly into chat input so user can send or edit immediately
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));

      // Save note to Firestore if authenticated, else keep in session state
      if (firebaseUser && firebaseUser.emailVerified) {
        await createFirestoreVoiceNote({
          ownerId: firebaseUser.uid,
          title: sourceTitle,
          transcript,
          durationSec: durationSeconds,
          mimeType,
          personaContext: PERSONA_LABELS[persona].label,
        });
      } else {
        setLocalVoiceNotes((prev) => [
          {
            id: `local-note-${Date.now()}`,
            title: sourceTitle,
            transcript,
            durationSec: durationSeconds,
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setTranscribeError(err?.message || 'Audio transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStartRecording = async () => {
    setTranscribeError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setTranscribeError('Microphone capture is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recordingSecRef.current = 0;
      setRecordingSec(0);

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const dur = recordingSecRef.current;
        setIsRecording(false);
        if (blob.size > 0) {
          processAudioTranscription(
            blob,
            dur,
            `Voice Practice (${PERSONA_LABELS[persona].label})`
          );
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        recordingSecRef.current += 1;
        setRecordingSec(recordingSecRef.current);
      }, 1000);
    } catch (err: any) {
      setTranscribeError(
        err?.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow microphone permissions or upload an audio clip.'
          : err?.message || 'Could not start microphone recording.'
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUploadAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processAudioTranscription(file, 0, file.name.slice(0, 120));
  };

  const displayedNotes = firebaseUser?.emailVerified
    ? voiceNotes
    : localVoiceNotes;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] p-5 sm:p-8 cozy-card-shadow flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C6CF0]/10 dark:bg-[#A99CFF]/15 text-[#7C6CF0] dark:text-[#A99CFF] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Workvanta AI Career Coach & Voice Lab</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#2D2A3E] dark:text-[#F2EEFF]">
            Multi-Turn Interview Prep & Audio Transcription
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6880] dark:text-[#A5A0BA] max-w-2xl">
            Practice mock interviews with persistent multi-turn memory, record spoken answers or upload audio clips for instant transcription, and sync your coaching history to Firestore.
          </p>
        </div>

        {/* Cloud Sync Pill */}
        <div className="flex items-center gap-3 shrink-0 min-w-0 max-w-full">
          {firebaseUser && firebaseUser.emailVerified ? (
            <div className="px-4 py-2.5 rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 text-xs font-semibold text-[#006949] dark:text-[#5EE3B0] flex items-center gap-2 min-w-0 max-w-full">
              <Cloud className="w-4 h-4 shrink-0" />
              <span className="truncate">Firestore Sync ({firebaseUser.email})</span>
            </div>
          ) : (
            <button
              onClick={handleEnableCloudSync}
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-2xl bg-[#7C6CF0] hover:bg-[#6a59e6] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 shrink-0" />
              <span>Connect Google for Firestore Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Coach Mode, Role Grounding, Saved Sessions & Voice Notes */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Coach Persona & Model Selector */}
          <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] p-5 cozy-card-shadow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF]">
                Coaching Mode
              </h2>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelType)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none"
                aria-label="Select Gemini model"
              >
                <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Balanced)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast)</option>
              </select>
            </div>

            <div className="space-y-2">
              {(Object.keys(PERSONA_LABELS) as PersonaType[]).map((key) => {
                const item = PERSONA_LABELS[key];
                const active = persona === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPersona(key)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#7C6CF0]/10 dark:bg-[#A99CFF]/15 border-[#7C6CF0] text-[#2D2A3E] dark:text-[#F2EEFF]'
                        : 'bg-[#FFF8F0]/60 dark:bg-[#1E1A2C]/60 border-[#7C6CF0]/10 dark:border-[#3D3759] text-[#6B6880] dark:text-[#A5A0BA] hover:border-[#7C6CF0]/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                      {item.label}
                    </div>
                    <div className="text-[11px] mt-0.5 leading-snug">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Target Internship Grounding */}
            <div className="pt-2 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                <Briefcase className="w-3.5 h-3.5 text-[#7C6CF0]" />
                <span>Ground in Target Remote Role</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none"
              >
                <option value="">General India Remote Fellowship Prep</option>
                {internships.map((role) => (
                  <option key={role.id} value={`${role.title} at ${role.company} (${role.location})`}>
                    {role.company} — {role.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Saved Firestore Chat Threads */}
          {firebaseUser?.emailVerified && (
            <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] p-5 cozy-card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold flex items-center gap-2 text-[#2D2A3E] dark:text-[#F2EEFF]">
                  <MessageSquare className="w-4 h-4 text-[#7C6CF0]" />
                  <span>Saved Sessions ({sessions.length})</span>
                </h2>
                <button
                  onClick={handleNewChat}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#7C6CF0]/10 text-[#7C6CF0] dark:text-[#A99CFF] hover:bg-[#7C6CF0]/20 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                  Start a conversation to persist your multi-turn history to Firestore.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                        activeSessionId === s.id
                          ? 'bg-[#7C6CF0]/10 border-[#7C6CF0]/40 text-[#2D2A3E] dark:text-white font-semibold'
                          : 'bg-[#FFF8F0]/60 dark:bg-[#1E1A2C]/60 border-transparent text-[#6B6880] dark:text-[#A5A0BA]'
                      }`}
                    >
                      <button
                        onClick={() => setActiveSessionId(s.id)}
                        className="flex-1 text-left truncate cursor-pointer"
                      >
                        {s.title}
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-[#6B6880] hover:text-rose-500 p-1 cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Voice Transcription Notes Archive */}
          <div className="rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] p-5 cozy-card-shadow space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold flex items-center gap-2 text-[#2D2A3E] dark:text-[#F2EEFF]">
                <FileAudio className="w-4 h-4 text-[#FF8A65]" />
                <span>Voice Transcripts ({displayedNotes.length})</span>
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF8A65]/15 text-[#FF8A65]">
                Gemini 3.5 Transcribe
              </span>
            </div>

            {displayedNotes.length === 0 ? (
              <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                Record a spoken interview answer or upload an audio clip below to save transcripts.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {displayedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF] truncate">
                        {note.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setInputText(note.transcript)}
                          className="text-[10px] font-bold text-[#7C6CF0] dark:text-[#A99CFF] hover:underline cursor-pointer"
                        >
                          Use in Chat
                        </button>
                        {firebaseUser?.emailVerified && (
                          <button
                            onClick={() => deleteFirestoreVoiceNote(note.id)}
                            className="text-[#6B6880] hover:text-rose-500 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] line-clamp-3">
                      {note.transcript}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Column: Multi-Turn Chat Thread & Audio Recorder Controls */}
        <section className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] cozy-card-shadow flex flex-col h-[72vh] min-h-[480px] sm:h-[680px] overflow-hidden">
          {/* Thread Top Bar */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C6CF0] to-[#34D399] flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  {PERSONA_LABELS[persona].label}
                </div>
                <div className="text-[11px] text-[#6B6880] dark:text-[#A5A0BA] truncate">
                  {selectedRole || 'All Remote Fellowships Across India'} · {messages.length} turns
                </div>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 rounded-xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] hover:border-[#7C6CF0] flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Thread</span>
            </button>
          </div>

          {/* Scrollable Message History */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#7C6CF0]/15 text-[#7C6CF0] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-[#2D2A3E] dark:text-[#F2EEFF]">
                    Start a Multi-Turn Coaching Conversation
                  </h3>
                  <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                    Ask questions by typing or click the microphone below to transcribe your spoken mock interview answers.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 w-full">
                  {PERSONA_LABELS[persona].starters.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3.5 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 hover:border-[#7C6CF0] text-left text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] transition-all cursor-pointer"
                    >
                      “{prompt}”
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isUser
                          ? 'bg-[#7C6CF0] text-white'
                          : 'bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0]'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isUser
                          ? 'bg-[#7C6CF0] text-white rounded-tr-xs'
                          : 'bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 dark:border-[#3D3759] text-[#2D2A3E] dark:text-[#F2EEFF] rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/15 text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                  Thinking through your fellowship context...
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Errors */}
          {(chatError || transcribeError) && (
            <div className="mx-4 sm:mx-6 mb-2 p-3 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{chatError || transcribeError}</span>
            </div>
          )}

          {/* Audio Recording Status Bar */}
          {(isRecording || isTranscribing) && (
            <div className="mx-4 sm:mx-6 mb-2 px-3 sm:px-4 py-2.5 rounded-2xl bg-[#FF8A65]/15 border border-[#FF8A65]/30 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF]">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#FF8A65] shrink-0" />
                <span>
                  {isRecording
                    ? `Recording spoken audio... ${recordingSec}s`
                    : 'Transcribing audio with Gemini 3.5 Transcribe...'}
                </span>
              </div>
              {isRecording && (
                <button
                  onClick={handleStopRecording}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop & Transcribe</span>
                </button>
              )}
            </div>
          )}

          {/* Composer & Audio Transcription Toolbar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-[#7C6CF0]/15 dark:border-[#3D3759] bg-[#FFF8F0]/50 dark:bg-[#1E1A2C]/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isTranscribing}
                title={isRecording ? 'Stop Recording' : 'Record Voice Answer'}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 ${
                  isRecording
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white dark:bg-[#26223A] border-[#7C6CF0]/25 text-[#2D2A3E] dark:text-[#F2EEFF] hover:border-[#7C6CF0]'
                }`}
              >
                {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5 text-[#FF8A65]" />}
                <span>{isRecording ? 'Stop' : 'Speak'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleUploadAudioFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTranscribing || isRecording}
                title="Upload Audio File for Transcription"
                className="p-2.5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/25 text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#7C6CF0] hover:border-[#7C6CF0] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask your Career Coach or speak an answer to transcribe..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 text-xs sm:text-sm text-[#2D2A3E] dark:text-[#F2EEFF] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending || isTranscribing}
              className="px-5 py-2.5 rounded-2xl bg-[#7C6CF0] hover:bg-[#6a59e6] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
