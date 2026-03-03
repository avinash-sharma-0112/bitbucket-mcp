import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BitbucketService } from '../services/bitbucket.service.js';
import { normalizeError, formatError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { TONES, toneInstruction } from './tones.js';

const MAX_COMMENT_LENGTH = 10_000;

const inputSchema = {
  workspace: z.string().min(1).describe('The Bitbucket workspace slug'),
  repo_slug: z.string().min(1).describe('The repository slug'),
  pr_id: z.number().int().positive().describe('The pull request ID'),
  content: z
    .string()
    .min(1)
    .max(MAX_COMMENT_LENGTH)
    .describe(
      `The comment body (markdown supported, max ${MAX_COMMENT_LENGTH} characters). ` +
        `Write this in the style specified by the tone parameter.`
    ),
  tone: z
    .enum(TONES)
    .optional()
    .describe(
      'The personality/style to use when writing the comment. ' +
        'When specified, write the content field in this tone before calling the tool.'
    ),
};

export function registerCreatePrComment(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'create_pull_request_comment',
    {
      description:
        'Post a general comment on a pull request. Markdown is supported. Content is limited to 10,000 characters. ' +
        'When a tone is provided, write the content in that style: ' +
        toneInstruction(),
      inputSchema,
    },
    async ({ workspace, repo_slug, pr_id, content, tone }) => {
      logger.info({ workspace, repo_slug, pr_id, tone }, 'Executing create_pull_request_comment');
      try {
        const comment = await service.createPullRequestComment(
          workspace,
          repo_slug,
          pr_id,
          content
        );
        logger.info(
          { workspace, repo_slug, pr_id, commentId: comment.id },
          'create_pull_request_comment completed'
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn({ workspace, repo_slug, pr_id, error }, 'create_pull_request_comment failed');
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
