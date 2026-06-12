import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function registerCreatePrTask(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'create_pull_request_task',
    {
      description: 'Create a task on a pull request. Optionally attach it to a specific comment.',
      inputSchema: {
        workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
        repo_slug: z.string().min(1).describe('The repository slug'),
        pr_id: z.number().int().positive().describe('The pull request ID'),
        content: z.string().min(1).describe('The task text'),
        comment_id: z.number().int().positive().optional().describe('ID of a comment to attach this task to'),
      },
    },
    async ({ workspace, repo_slug, pr_id, content, comment_id }) => {
      logger.info({ workspace, repo_slug, pr_id, comment_id }, 'Executing create_pull_request_task');
      try {
        const task = await service.createPullRequestTask(workspace, repo_slug, pr_id, content, comment_id);
        logger.info({ workspace, repo_slug, pr_id, taskId: task.id }, 'create_pull_request_task completed');
        return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'create_pull_request_task failed');
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
