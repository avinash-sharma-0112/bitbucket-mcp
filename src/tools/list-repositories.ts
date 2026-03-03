import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const inputSchema = {
  workspace: z.string().min(1).describe('The Bitbucket workspace slug (e.g. "my-team")'),
};

export function registerListRepositories(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'list_repositories',
    {
      description: 'List all repositories in a Bitbucket workspace. Auto-paginates to return every repository.',
      inputSchema,
    },
    async ({ workspace }) => {
      logger.info({ workspace }, 'Executing list_repositories');
      try {
        const repos = await service.listRepositories(workspace);
        logger.info({ workspace, count: repos.length }, 'list_repositories completed');
        return {
          content: [{ type: 'text', text: JSON.stringify(repos, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, error }, 'list_repositories failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
