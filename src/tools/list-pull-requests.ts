import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const PR_STATES = ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'] as const;

const inputSchema = {
  workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
  repo_slug: z.string().min(1).describe('The repository slug'),
  state: z
    .enum(PR_STATES)
    .optional()
    .describe('Filter by PR state. Defaults to OPEN when omitted.'),
};

export function registerListPullRequests(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'list_pull_requests',
    {
      description:
        'List pull requests for a Bitbucket repository. Optionally filter by state (OPEN, MERGED, DECLINED, SUPERSEDED). Auto-paginates.',
      inputSchema,
    },
    async ({ workspace, repo_slug, state }) => {
      logger.info({ workspace, repo_slug, state }, 'Executing list_pull_requests');
      try {
        const prs = await service.listPullRequests(workspace, repo_slug, state);
        logger.info({ workspace, repo_slug, count: prs.length }, 'list_pull_requests completed');
        return {
          content: [{ type: 'text', text: JSON.stringify(prs, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, error }, 'list_pull_requests failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
