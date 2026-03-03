import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/** Truncate diffs larger than this to avoid overwhelming LLM context windows */
const MAX_DIFF_CHARS = 500_000;

const inputSchema = {
  workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
  repo_slug: z.string().min(1).describe('The repository slug'),
  pr_id: z.number().int().positive().describe('The pull request ID'),
};

export function registerGetPullRequestDiff(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'get_pull_request_diff',
    {
      description:
        'Fetch the raw unified diff for a pull request. Returns the complete diff as a string. Very large diffs are truncated at 500,000 characters.',
      inputSchema,
    },
    async ({ workspace, repo_slug, pr_id }) => {
      logger.info({ workspace, repo_slug, pr_id }, 'Executing get_pull_request_diff');
      try {
        let diff = await service.getPullRequestDiff(workspace, repo_slug, pr_id);
        let truncated = false;

        if (diff.length > MAX_DIFF_CHARS) {
          diff = diff.slice(0, MAX_DIFF_CHARS);
          truncated = true;
          logger.warn(
            { workspace, repo_slug, pr_id, originalLength: diff.length },
            'Diff truncated due to size'
          );
        }

        const notice = truncated
          ? `\n\n[TRUNCATED: diff exceeded ${MAX_DIFF_CHARS.toLocaleString()} characters]`
          : '';

        logger.info(
          { workspace, repo_slug, pr_id, chars: diff.length },
          'get_pull_request_diff completed'
        );
        return {
          content: [{ type: 'text', text: diff + notice }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'get_pull_request_diff failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
