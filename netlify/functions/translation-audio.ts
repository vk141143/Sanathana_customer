import { getHarvedCorsHeaders } from '../../server/cors';
import { createSarvamTtsDependencies } from '../../server/sarvamTtsDependencies';
import {
  createTranslationAudioHandler,
  SarvamTtsConfigurationError,
  type SarvamTtsDependencies,
  type TranslationAudioResponse,
} from '../../server/translationAudioHandler';

interface NetlifyFunctionEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded?: boolean;
}

interface NetlifyFunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

const MAX_NETLIFY_AUDIO_BYTES = 4 * 1024 * 1024;

function getHeader(headers: Record<string, string | undefined>, name: string): string | undefined {
  const key = Object.keys(headers).find(header => header.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

function toNetlifyResponse(
  result: TranslationAudioResponse,
  corsHeaders: Record<string, string>,
): NetlifyFunctionResponse {
  const headers = { ...corsHeaders, ...result.headers };
  if (Buffer.isBuffer(result.body)) {
    if (result.body.length > MAX_NETLIFY_AUDIO_BYTES) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Generated audio exceeds the Netlify Function response size limit.' }),
      };
    }
    return {
      statusCode: result.statusCode,
      headers,
      body: result.body.toString('base64'),
      isBase64Encoded: true,
    };
  }

  headers['Content-Type'] = 'application/json; charset=utf-8';
  return {
    statusCode: result.statusCode,
    headers,
    body: JSON.stringify(result.body),
  };
}

export function createNetlifyTranslationAudioHandler(
  dependencies: SarvamTtsDependencies,
  configuredOrigins?: string,
) {
  const handleTranslationAudio = createTranslationAudioHandler(
    dependencies,
    MAX_NETLIFY_AUDIO_BYTES,
  );

  return async (event: NetlifyFunctionEvent): Promise<NetlifyFunctionResponse> => {
    const origin = getHeader(event.headers ?? {}, 'origin');
    const corsHeaders = getHarvedCorsHeaders(origin, configuredOrigins);
    if (!corsHeaders) {
      return toNetlifyResponse(
        { statusCode: 403, body: { error: 'This origin is not allowed.' } },
        {},
      );
    }

    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '600',
        },
        body: '',
      };
    }
    if (event.httpMethod !== 'POST') {
      return toNetlifyResponse(
        { statusCode: 405, headers: { Allow: 'POST, OPTIONS' }, body: { error: 'Method not allowed.' } },
        corsHeaders,
      );
    }

    let requestBody: unknown;
    try {
      if (event.body) {
        const bodyText = event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString('utf8')
          : event.body;
        requestBody = JSON.parse(bodyText) as unknown;
      }
    } catch {
      return toNetlifyResponse(
        { statusCode: 400, body: { error: 'Request body must be valid JSON.' } },
        corsHeaders,
      );
    }

    const result = await handleTranslationAudio(
      getHeader(event.headers ?? {}, 'authorization'),
      requestBody,
    );
    return toNetlifyResponse(result, corsHeaders);
  };
}

let configuredHandler: ReturnType<typeof createNetlifyTranslationAudioHandler> | undefined;

export async function handler(event: NetlifyFunctionEvent): Promise<NetlifyFunctionResponse> {
  try {
    if (!configuredHandler) {
      const dependencies = createSarvamTtsDependencies();
      configuredHandler = createNetlifyTranslationAudioHandler(
        dependencies,
        process.env.HARVED_ALLOWED_ORIGINS,
      );
    }
    return await configuredHandler(event);
  } catch (error) {
    console.error(
      'Netlify translation audio function configuration failed:',
      error instanceof Error ? error.name : 'UnknownError',
    );
    const configurationError = error instanceof SarvamTtsConfigurationError;
    return toNetlifyResponse(
      {
        statusCode: 503,
        body: {
          error: configurationError
            ? error.message
            : 'Translation audio is not configured. Check the Netlify Function environment variables.',
        },
      },
      {},
    );
  }
}
