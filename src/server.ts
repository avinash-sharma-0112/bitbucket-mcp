import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createBitbucketClient } from './services/bitbucket.client.js';
import { BitbucketService } from './services/bitbucket.service.js';

import { registerListRepositories } from './tools/list-repositories.js';
import { registerListPullRequests } from './tools/list-pull-requests.js';
import { registerGetPullRequestDetails } from './tools/get-pull-request-details.js';
import { registerGetPullRequestDiff } from './tools/get-pull-request-diff.js';
import { registerListPrCommits } from './tools/list-pr-commits.js';
import { registerCreatePrComment } from './tools/create-pr-comment.js';
import { registerCreateInlinePrComment } from './tools/create-inline-pr-comment.js';

import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  // createBitbucketClient() triggers config loading; will throw + exit if env vars are missing
  const client = createBitbucketClient();
  const service = new BitbucketService(client);

  const server = new McpServer({
    name: 'bitbucket-mcp',
    version: '1.0.0',
  });

  // Register all tools
  registerListRepositories(server, service);
  registerListPullRequests(server, service);
  registerGetPullRequestDetails(server, service);
  registerGetPullRequestDiff(server, service);
  registerListPrCommits(server, service);
  registerCreatePrComment(server, service);
  registerCreateInlinePrComment(server, service);

  // Connect using stdio transport (Claude Desktop / MCP clients communicate over stdin/stdout)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Bitbucket MCP server started and listening on stdio');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // Write to stderr so it's visible even when stdout is the MCP channel
  process.stderr.write(`Fatal error: ${message}\n`);
  process.exit(1);
});
