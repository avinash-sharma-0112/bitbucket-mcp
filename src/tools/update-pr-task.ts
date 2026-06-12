import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function registerUpdatePrTask(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'update_pull_request_task',
    {
      description: 'Update the content or state (RESOLVED / UNRESOLVED) of an existing PR task.',
      inputSchema: {
        workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
        repo_slug: z.string().min(1).describe('The repository slug'),
        pr_id: z.number().int().positive().describe('The pull request ID'),
        task_id: z.number().int().positive().describe('The task ID'),
        content: z.string().min(1).describe('Updated task text'),
        state: z.enum(['UNRESOLVED', 'RESOLVED']).describe('New state for the task'),
      },
    },
    async ({ workspace, repo_slug, pr_id, task_id, content, state }) => {
      logger.info({ workspace, repo_slug, pr_id, task_id, state }, 'Executing update_pull_request_task');
      try {
        const task = await service.updatePullRequestTask(workspace, repo_slug, pr_id, task_id, content, state);
        logger.info({ workspace, repo_slug, pr_id, task_id }, 'update_pull_request_task completed');
        return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, task_id, error }, 'update_pull_request_task failed');
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
