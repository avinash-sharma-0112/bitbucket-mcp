import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function registerDeletePrTask(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'delete_pull_request_task',
    {
      description: 'Delete a task from a pull request.',
      inputSchema: {
        workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
        repo_slug: z.string().min(1).describe('The repository slug'),
        pr_id: z.number().int().positive().describe('The pull request ID'),
        task_id: z.number().int().positive().describe('The task ID to delete'),
      },
    },
    async ({ workspace, repo_slug, pr_id, task_id }) => {
      logger.info({ workspace, repo_slug, pr_id, task_id }, 'Executing delete_pull_request_task');
      try {
        await service.deletePullRequestTask(workspace, repo_slug, pr_id, task_id);
        logger.info({ workspace, repo_slug, pr_id, task_id }, 'delete_pull_request_task completed');
        return { content: [{ type: 'text', text: `Task ${task_id} deleted successfully.` }] };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, task_id, error }, 'delete_pull_request_task failed');
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
