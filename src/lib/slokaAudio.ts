export interface SlokaAudioSource {
  audioUrl?: string | null;
  audioR2Path?: string | null;
  audioR2Key?: string | null;
}

const successfulAudioStatuses = new Set(['ready', 'uploaded', 'published']);

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function getSlokaAudioReference(source: SlokaAudioSource): string | null {
  const audioUrl = source.audioUrl?.trim();
  if (audioUrl && isPublicHttpsUrl(audioUrl)) return audioUrl;

  const path = source.audioR2Path?.trim();
  if (path) return path;
  const key = source.audioR2Key?.trim();
  return key || null;
}

export function hasSlokaAudio(
  source: SlokaAudioSource,
  audioStatus: string | null | undefined,
): boolean {
  return Boolean(getSlokaAudioReference(source)) &&
    successfulAudioStatuses.has(audioStatus?.trim().toLowerCase() ?? '');
}

export function resolveSlokaAudioUrl(audioReference: string, publicBaseUrl?: string): string {
  const reference = audioReference.trim();
  if (!reference) throw new Error('Sloka audio path is empty.');

  if (/^https?:\/\//i.test(reference)) {
    let audioUrl: URL;
    try {
      audioUrl = new URL(reference);
    } catch {
      throw new Error('Sloka audio URL is invalid.');
    }
    if (audioUrl.protocol !== 'https:' || audioUrl.username || audioUrl.password) {
      throw new Error('Sloka audio URL must use a public HTTPS address.');
    }
    return audioUrl.href;
  }

  if (!publicBaseUrl) throw new Error('Sloka audio delivery is not configured.');
  let baseUrl: URL;
  try {
    baseUrl = new URL(publicBaseUrl.trim());
  } catch {
    throw new Error('Sloka audio delivery is not configured.');
  }
  if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) {
    throw new Error('Sloka audio delivery URL is invalid.');
  }

  const base = `${baseUrl.href.replace(/\/+$/, '')}/`;
  return new URL(reference.replace(/^\/+/, ''), base).href;
}

export type SlokaAudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';

export interface SlokaAudioState {
  slokaId: string | null;
  status: SlokaAudioStatus;
  error: string | null;
}

type AudioFactory = () => HTMLAudioElement;

const EMPTY_STATE: SlokaAudioState = { slokaId: null, status: 'idle', error: null };
const PLAYBACK_ERROR = "Couldn't play this sloka right now. Please try again.";
const r2PublicBaseUrl = import.meta.env?.VITE_R2_PUBLIC_URL?.trim() ?? '';

function releaseAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.onplaying = null;
  audio.onwaiting = null;
  audio.onpause = null;
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

export class SlokaAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private operation = 0;
  private state: SlokaAudioState = EMPTY_STATE;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly publicBaseUrl: string = r2PublicBaseUrl,
    private readonly createAudio: AudioFactory = () => new Audio(),
  ) {}

  getSnapshot = (): SlokaAudioState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  toggle = async (slokaId: string, source: SlokaAudioSource): Promise<void> => {
    if (this.state.slokaId === slokaId) {
      if (this.state.status === 'playing') {
        this.audio?.pause();
        return;
      }
      if (this.state.status === 'paused' && this.audio) {
        await this.resume(slokaId);
        return;
      }
      if (this.state.status === 'loading') return;
    }

    await this.start(slokaId, source);
  };

  stop = (slokaId?: string): void => {
    if (slokaId && this.state.slokaId !== slokaId) return;
    this.operation += 1;
    const audio = this.audio;
    this.audio = null;
    releaseAudio(audio);
    this.setState(EMPTY_STATE);
  };

  private async start(slokaId: string, source: SlokaAudioSource): Promise<void> {
    this.stop();
    const operation = ++this.operation;
    this.setState({ slokaId, status: 'loading', error: null });

    try {
      const audioReference = getSlokaAudioReference(source);
      if (!audioReference) throw new Error('Sloka audio source is missing.');
      const resolvedUrl = resolveSlokaAudioUrl(audioReference, this.publicBaseUrl);
      const audio = this.createAudio();
      this.audio = audio;
      audio.preload = 'none';
      audio.onplaying = () => {
        if (this.operation === operation && this.audio === audio) {
          this.setState({ slokaId, status: 'playing', error: null });
        }
      };
      audio.onwaiting = () => {
        if (this.operation === operation && this.audio === audio) {
          this.setState({ slokaId, status: 'loading', error: null });
        }
      };
      audio.onpause = () => {
        if (this.operation === operation && this.audio === audio && !audio.ended) {
          this.setState({ slokaId, status: 'paused', error: null });
        }
      };
      audio.onended = () => {
        if (this.operation !== operation || this.audio !== audio) return;
        this.audio = null;
        releaseAudio(audio);
        this.setState({ slokaId, status: 'completed', error: null });
      };
      audio.onerror = () => this.fail(operation, slokaId, audio);
      audio.src = resolvedUrl;
      await audio.play();
      if (operation === this.operation && this.audio === audio) {
        this.setState({ slokaId, status: 'playing', error: null });
      }
    } catch {
      if (operation !== this.operation) return;
      this.fail(operation, slokaId, this.audio);
    }
  }

  private async resume(slokaId: string): Promise<void> {
    const audio = this.audio;
    if (!audio) return;
    const operation = this.operation;
    try {
      await audio.play();
      if (operation === this.operation && this.audio === audio) {
        this.setState({ slokaId, status: 'playing', error: null });
      }
    } catch {
      if (operation === this.operation && this.audio === audio) {
        this.fail(operation, slokaId, audio);
      }
    }
  }

  private fail(operation: number, slokaId: string, audio: HTMLAudioElement | null): void {
    if (operation !== this.operation) return;
    if (this.audio === audio) this.audio = null;
    releaseAudio(audio);
    this.setState({ slokaId, status: 'error', error: PLAYBACK_ERROR });
  }

  private setState(state: SlokaAudioState): void {
    this.state = state;
    this.listeners.forEach(listener => listener());
  }
}

export const slokaAudioPlayer = new SlokaAudioPlayer();
