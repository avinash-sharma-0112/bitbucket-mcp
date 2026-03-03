import { AxiosError } from 'axios';

export interface ApiError {
  error: true;
  status?: number;
  message: string;
}

/**
 * Normalizes any thrown value into a safe, structured error object.
 * Credentials are never included in the output.
 */
export function normalizeError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    // Extract message from Bitbucket error response shape, fall back to axios message
    const bitbucketMessage =
      (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    const message = bitbucketMessage ?? err.message;
    return { error: true, status, message };
  }

  if (err instanceof Error) {
    return { error: true, message: err.message };
  }

  return { error: true, message: 'An unknown error occurred' };
}

/**
 * Formats a normalizeError result into a human-readable MCP error response string.
 */
export function formatError(err: ApiError): string {
  const statusPart = err.status !== undefined ? ` (HTTP ${err.status})` : '';
  return `Error${statusPart}: ${err.message}`;
}
