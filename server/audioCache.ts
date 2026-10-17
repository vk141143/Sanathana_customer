import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { AudioCache } from './sarvamTtsRouter';

const MAX_MEMORY_CACHE_ENTRIES = 32;
const MAX_MEMORY_CACHE_BYTES = 24 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

class MemoryAudioCache implements AudioCache {
  private readonly items = new Map<string, Buffer>();
  private totalBytes = 0;

  async get(key: string): Promise<Buffer | null> {
    const audio = this.items.get(key);
    if (!audio) return null;
    this.items.delete(key);
    this.items.set(key, audio);
    return audio;
  }

  async set(key: string, audio: Buffer): Promise<void> {
    const existing = this.items.get(key);
    if (existing) this.totalBytes -= existing.length;
    this.items.delete(key);

    if (audio.length > MAX_MEMORY_CACHE_BYTES) return;
    while (
      this.items.size >= MAX_MEMORY_CACHE_ENTRIES ||
      this.totalBytes + audio.length > MAX_MEMORY_CACHE_BYTES
    ) {
      const oldestKey = this.items.keys().next().value;
      if (!oldestKey) break;
      const oldestAudio = this.items.get(oldestKey);
      if (oldestAudio) this.totalBytes -= oldestAudio.length;
      this.items.delete(oldestKey);
    }

    this.items.set(key, audio);
    this.totalBytes += audio.length;
  }
}

class R2AudioCache implements AudioCache {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async get(key: string): Promise<Buffer | null> {
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!object.Body) throw new Error('R2 returned an empty audio object.');
      if (typeof object.ContentLength === 'number' && object.ContentLength > MAX_AUDIO_BYTES) {
        throw new Error('R2 audio object has an invalid size.');
      }
      const bytes = await object.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') return null;
      if (error && typeof error === 'object' && '$metadata' in error) {
        const metadata = error.$metadata;
        if (metadata && typeof metadata === 'object' && 'httpStatusCode' in metadata && metadata.httpStatusCode === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  async set(key: string, audio: Buffer): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: audio,
      ContentType: 'audio/wav',
      CacheControl: 'private, max-age=31536000, immutable',
    }));
  }
}

export function createAudioCache(environment: NodeJS.ProcessEnv = process.env): AudioCache {
  const accountId = environment.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = environment.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = environment.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = environment.CLOUDFLARE_R2_BUCKET_NAME;
  const configured = [accountId, accessKeyId, secretAccessKey, bucket].filter(Boolean).length;

  if (configured === 0) return new MemoryAudioCache();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Cloudflare R2 audio cache configuration is incomplete.');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return new R2AudioCache(client, bucket);
}
