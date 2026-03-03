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
  file_path: z
    .string()
    .min(1)
    .describe('Path to the file in the diff, relative to the repo root (e.g. "src/utils/pagination.ts")'),
  line_number: z
    .number()
    .int()
    .positive()
    .describe('The destination line number in the file to attach the comment to'),
  start_line: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Optional start line for a multi-line comment selection (must be <= line_number)'),
  tone: z
    .enum(TONES)
    .optional()
    .describe(
      'The personality/style to use when writing the comment. ' +
        'When specified, write the content field in this tone before calling the tool.'
    ),
};

export function registerCreateInlinePrComment(server: McpServer, service: BitbucketService): void {
  server.registerTool(
    'create_inline_pull_request_comment',
    {
      description:
        'Post an inline review comment on a specific file and line in a pull request diff. ' +
        'Use this for code-review feedback pinned to a location. For general PR discussion use create_pull_request_comment instead. ' +
        'When a tone is provided, write the content in that style: ' +
        toneInstruction(),
      inputSchema,
    },
    async ({ workspace, repo_slug, pr_id, content, file_path, line_number, start_line, tone }) => {
      logger.info(
        { workspace, repo_slug, pr_id, file_path, line_number, tone },
        'Executing create_inline_pull_request_comment'
      );
      try {
        const comment = await service.createPullRequestComment(
          workspace,
          repo_slug,
          pr_id,
          content,
          { path: file_path, to: line_number, ...(start_line !== undefined && { from: start_line }) }
        );
        logger.info(
          { workspace, repo_slug, pr_id, commentId: comment.id },
          'create_inline_pull_request_comment completed'
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
        };
      } catch (err) {
        const error = normalizeError(err);
        logger.warn(
          { workspace, repo_slug, pr_id, file_path, line_number, error },
          'create_inline_pull_request_comment failed'
        );
        return {
          content: [{ type: 'text', text: formatError(error) }],
          isError: true,
        };
      }
    }
  );
}
