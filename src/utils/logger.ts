import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Structured logger using pino.
 * All output goes to stderr to avoid interfering with the MCP stdio transport on stdout.
 */
export const logger = pino(
  { level: config.logLevel },
  // fd 2 = stderr; MCP protocol uses stdout exclusively
  pino.destination({ dest: 2, sync: false })
);
