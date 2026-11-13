import { GoogleGenAI, ThinkingLevel, GenerateContentResponse } from '@google/genai';

export type CoachPersona = 'coach' | 'interviewer' | 'resume';
export type ChatModelId = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

export interface ChatTurnInput {
  role: 'user' | 'model';
  text: string;
}

const PERSONA_SYSTEM_INSTRUCTIONS: Record<CoachPersona, string> = {
  coach:
    'You are Workvanta AI Career Coach, a warm, insightful mentor helping university students across India land 100% remote internships and fellowships. Give practical, zero-fluff guidance on open-source preparation, async remote communication, portfolio building, and interview readiness. Keep responses structured, encouraging, and concise.',
  interviewer:
    'You are Workvanta Mock Technical Interviewer conducting relaxed, high-signal remote fellowship interviews (zero LeetCode trickery—focus on system design intuition, React/TypeScript/backend craftsmanship, real project trade-offs, and debugging thought process). Ask one thoughtful follow-up question at a time and give constructive feedback on the candidate’s answers.',
  resume:
    'You are Workvanta Resume & Pitch Strategist helping Indian early-career builders refine bullet points, project stories, GitHub READMEs, and cold outreach notes for remote tech roles. Rewrite weak phrasing into measurable impact and highlight craftsmanship.',
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function runMultiTurnChat(params: {
  messages: ChatTurnInput[];
  persona?: CoachPersona;
  model?: ChatModelId;
  contextRole?: string;
}): Promise<{ reply: string; modelUsed: ChatModelId }> {
  const ai = getGeminiClient();
  const persona: CoachPersona = params.persona && params.persona in PERSONA_SYSTEM_INSTRUCTIONS
    ? params.persona
    : 'coach';
  const model: ChatModelId = params.model === 'gemini-3.1-flash-lite'
    ? 'gemini-3.1-flash-lite'
    : 'gemini-4-hydrogen';

  const validMessages = (params.messages || []).filter(
    (m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim().length > 0
  );

  if (validMessages.length === 0) {
    throw new Error('At least one user message is required.');
  }

  const lastMessage = validMessages[validMessages.length - 1];
  if (lastMessage.role !== 'user') {
    throw new Error('The latest message in the conversation must come from the user.');
  }

  const priorTurns = validMessages.slice(0, -1).map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const roleContext = params.contextRole?.trim()
    ? `\n\nTarget Fellowship Context: The student is preparing for "${params.contextRole.trim()}". Tailor advice and mock questions toward this role.`
    : '';

  const systemInstruction = `${PERSONA_SYSTEM_INSTRUCTIONS[persona]}${roleContext}`;

  const config: Record<string, unknown> = {
    systemInstruction,
  };

  if (model === 'gemini-3.1-flash-lite') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
  } else {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  }

  const chat = ai.chats.create({
    model,
    config,
    history: priorTurns,
  });

  const response: GenerateContentResponse = await chat.sendMessage({
    message: lastMessage.text,
  });

  const reply = (response.text ?? '').trim();
  if (!reply) {
    throw new Error('Gemini returned an empty response.');
  }

  return { reply, modelUsed: model };
}

export async function transcribeAudioBuffer(params: {
  audioBase64: string;
  mimeType: string;
  promptHint?: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const cleanBase64 = params.audioBase64.replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('Audio data is empty.');
  }

  const allowedMimeTypes = [
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
    'audio/flac',
  ];

  const baseMime = (params.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
  const safeMime = allowedMimeTypes.includes(baseMime) ? baseMime : 'audio/webm';

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: safeMime,
            data: cleanBase64,
          },
        },
        {
          text:
            params.promptHint?.trim() ||
            'Transcribe this audio accurately with proper punctuation and capitalization. Return only the transcribed speech.',
        },
      ],
    },
  });

  return (response.text ?? '').trim();
}
