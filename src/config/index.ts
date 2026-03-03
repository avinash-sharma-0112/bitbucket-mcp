import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve .env relative to this file's directory so the server works regardless
// of what directory the MCP host (Claude Code, Claude Desktop, etc.) launches it from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Resolve Bitbucket credentials.
 *
 * Bitbucket Cloud supports two auth methods (both use HTTP Basic Auth):
 *
 *   API Token (recommended, newer):
 *     BITBUCKET_EMAIL=you@example.com
 *     BITBUCKET_API_TOKEN=<token from Personal Settings → API tokens>
 *
 *   App Password (legacy, still supported):
 *     BITBUCKET_USERNAME=your_bitbucket_username
 *     BITBUCKET_APP_PASSWORD=<password from Personal Settings → App passwords>
 *
 * API Token takes precedence if both are set.
 */
function resolveAuth(): { authUser: string; authToken: string } {
  const email = process.env['BITBUCKET_EMAIL'];
  const apiToken = process.env['BITBUCKET_API_TOKEN'];
  const username = process.env['BITBUCKET_USERNAME'];
  const appPassword = process.env['BITBUCKET_APP_PASSWORD'];

  if (email && apiToken) {
    return { authUser: email, authToken: apiToken };
  }

  if (username && appPassword) {
    return { authUser: username, authToken: appPassword };
  }

  throw new Error(
    'Bitbucket credentials not configured.\n' +
      'Option 1 — API Token (recommended):\n' +
      '  BITBUCKET_EMAIL=you@example.com\n' +
      '  BITBUCKET_API_TOKEN=<token>\n' +
      'Option 2 — App Password (legacy):\n' +
      '  BITBUCKET_USERNAME=your_username\n' +
      '  BITBUCKET_APP_PASSWORD=<password>\n' +
      'Copy .env.example to .env and fill in your credentials.'
  );
}

const auth = resolveAuth();

export const config = {
  bitbucket: {
    authUser: auth.authUser,
    authToken: auth.authToken,
    baseUrl: 'https://api.bitbucket.org/2.0',
  },
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
} as const;
