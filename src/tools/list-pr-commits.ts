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

export function registerListPrCommits(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'list_pull_request_commits',
    {
      description:
        'List all commits included in a pull request. Returns hash, author, date, and message for each commit. Auto-paginates.',
      inputSchema,
    },
    async ({ workspace, repo_slug, pr_id }) => {
      logger.info({ workspace, repo_slug, pr_id }, 'Executing list_pull_request_commits');
      try {
        const commits = await service.listPullRequestCommits(workspace, repo_slug, pr_id);
        logger.info(
          { workspace, repo_slug, pr_id, count: commits.length },
          'list_pull_request_commits completed'
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(commits, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'list_pull_request_commits failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
