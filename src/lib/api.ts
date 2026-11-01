const configuredApiBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredApiBaseUrl?.replace(/\/+$/, '') ?? '';
export const TRANSLATION_AUDIO_ENDPOINT = '/api/tts/translation-audio';

export function resolveApiBaseUrl(
  configuredBaseUrl: string | undefined,
  isProduction: boolean,
): string {
  const value = configuredBaseUrl?.trim();
  if (!value) {
    if (isProduction) {
      throw new Error('The server API is not configured. Set VITE_API_BASE_URL to the deployed API origin and redeploy the frontend.');
    }
    return '';
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_BASE_URL must be the deployed API origin, such as https://your-service.onrender.com.');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (isProduction && url.protocol !== 'https:')
  ) {
    throw new Error('VITE_API_BASE_URL must be a public HTTPS API origin without credentials or a path.');
  }

  return url.origin;
}

export function resolveApiUrl(
  path: string,
  configuredBaseUrl: string | undefined,
  isProduction: boolean,
): string {
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveApiBaseUrl(configuredBaseUrl, isProduction)}${apiPath}`;
}

export function getApiUrl(path: string): string {
  return resolveApiUrl(path, import.meta.env?.VITE_API_BASE_URL, import.meta.env?.PROD ?? false);
}
