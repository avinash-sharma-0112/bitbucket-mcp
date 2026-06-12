import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function registerListPrTasks(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'list_pull_request_tasks',
    {
      description: 'List all tasks on a pull request.',
      inputSchema: {
        workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
        repo_slug: z.string().min(1).describe('The repository slug'),
        pr_id: z.number().int().positive().describe('The pull request ID'),
      },
    },
    async ({ workspace, repo_slug, pr_id }) => {
      logger.info({ workspace, repo_slug, pr_id }, 'Executing list_pull_request_tasks');
      try {
        const tasks = await service.listPullRequestTasks(workspace, repo_slug, pr_id);
        logger.info({ workspace, repo_slug, pr_id, count: tasks.length }, 'list_pull_request_tasks completed');
        return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'list_pull_request_tasks failed');
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
