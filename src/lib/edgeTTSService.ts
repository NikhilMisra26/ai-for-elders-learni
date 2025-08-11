import { errorHandler } from './errorHandler';

export interface EdgeTTSRequest {
  text: string;
  voice: string;
  rate: number;
}

export interface EdgeTTSResponse {
  audioUrl: string;
}

export class EdgeTTSServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EdgeTTSServiceError';
  }
}

export interface EdgeTTSService {
  generateSpeech: (request: EdgeTTSRequest) => Promise<EdgeTTSResponse>;
  createAudioElement: (url: string, volume: number) => HTMLAudioElement;
  checkServerHealth: () => Promise<boolean>;
  estimateDuration: (text: string, rate: number) => number;
  getAvailableVoices: () => Promise<string[]>;
}

function buildSSML(text: string, voice: string, rate: number): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\.\s+/g, '. <break time="600ms"/> ');
  return `
    <speak version="1.0" xml:lang="en-US">
      <voice name="${voice}">
        <mstts:express-as style="assistant">
          <prosody rate="${rate}">${withBreaks}</prosody>
        </mstts:express-as>
      </voice>
    </speak>
  `;
}

async function generateSpeech(
  request: EdgeTTSRequest,
): Promise<EdgeTTSResponse> {
  try {
    const ssml = buildSSML(request.text, request.voice, request.rate);
    const response = await fetch('/api/edge-tts/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssml }),
    });
    if (!response.ok) {
      throw new EdgeTTSServiceError('Failed to generate speech');
    }
    const data = (await response.json()) as EdgeTTSResponse;
    return data;
  } catch (error) {
    errorHandler.logError(
      'Edge TTS generation failed',
      error instanceof Error ? error : new Error(String(error)),
      { component: 'edge_tts_service', action: 'generate' },
    );
    throw error;
  }
}

function createAudioElement(url: string, volume: number): HTMLAudioElement {
  const audio = new Audio(url);
  audio.volume = volume;
  return audio;
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/edge-tts/health');
    return response.ok;
  } catch {
    return false;
  }
}

function estimateDuration(text: string, rate: number): number {
  const words = text.trim().split(/\s+/).length;
  const wordsPerMinute = 150 * rate;
  const minutes = words / wordsPerMinute;
  return Math.ceil(minutes * 60);
}

async function getAvailableVoices(): Promise<string[]> {
  try {
    const response = await fetch('/api/edge-tts/voices');
    if (!response.ok) return [];
    const data = (await response.json()) as { voices: string[] };
    return data.voices;
  } catch {
    return [];
  }
}

export function getSeniorFriendlyVoices(): string[] {
  return ['en-US-JennyNeural', 'en-US-AriaNeural', 'en-US-GuyNeural'];
}

export function formatSpeechDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const edgeTTSService: EdgeTTSService = {
  generateSpeech,
  createAudioElement,
  checkServerHealth,
  estimateDuration,
  getAvailableVoices,
};
