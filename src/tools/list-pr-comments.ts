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

export function registerListPrComments(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'list_pull_request_comments',
    {
      description:
        'List all comments on a pull request. Returns id, content, and optional inline ' +
        'location (file path and line numbers) for each comment. Auto-paginates.',
      inputSchema,
    },
    async ({ workspace, repo_slug, pr_id }) => {
      logger.info({ workspace, repo_slug, pr_id }, 'Executing list_pull_request_comments');
      try {
        const comments = await service.listPullRequestComments(workspace, repo_slug, pr_id);
        logger.info(
          { workspace, repo_slug, pr_id, count: comments.length },
          'list_pull_request_comments completed'
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'list_pull_request_comments failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
