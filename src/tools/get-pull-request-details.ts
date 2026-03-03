import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const inputSchema = {
  workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
  repo_slug: z.string().min(1).describe('The repository slug'),
  pr_id: z.number().int().positive().describe('The pull request ID'),
};

export function registerGetPullRequestDetails(
  server: McpServer,
  service: BitbucketService
): void {
  server.registerTool(
    'get_pull_request_details',
    {
      description:
        'Fetch full details of a pull request including title, description, state, reviewers, participants, and merge commit.',
      inputSchema,
    },
    async ({ workspace, repo_slug, pr_id }) => {
      logger.info({ workspace, repo_slug, pr_id }, 'Executing get_pull_request_details');
      try {
        const details = await service.getPullRequestDetails(workspace, repo_slug, pr_id);
        logger.info({ workspace, repo_slug, pr_id }, 'get_pull_request_details completed');
        return {
          content: [{ type: 'text', text: JSON.stringify(details, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'get_pull_request_details failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
