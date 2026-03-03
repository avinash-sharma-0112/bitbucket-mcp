# bitbucket-mcp

A production-grade, open-source **Model Context Protocol (MCP)** server that integrates with **Bitbucket Cloud**. Expose your Bitbucket repositories and pull requests as MCP tools — ready to use with Claude Desktop and any other MCP-compatible client.

---

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that lets AI models (like Claude) communicate with external tools and data sources in a structured, secure way. An MCP server exposes *tools* that an AI client can call, with typed inputs and structured outputs.

## What is this project?

`bitbucket-mcp` is an MCP server that wraps the Bitbucket Cloud REST API v2. Once connected to Claude Desktop, you can ask Claude to:

- List all repos in your workspace
- Show open (or merged/declined) pull requests
- Fetch PR details, diffs, and commit history
- Post review comments on PRs

---

## Features

| Tool | Description |
|---|---|
| `list_repositories` | List all repos in a workspace (paginated) |
| `list_pull_requests` | List PRs with optional state filter |
| `get_pull_request_details` | Full PR info: reviewers, participants, merge commit |
| `get_pull_request_diff` | Raw unified diff (large diffs safely truncated) |
| `list_pull_request_commits` | All commits in a PR |
| `create_pull_request_comment` | Post a comment on a PR |

---

## Requirements

- **Node.js 18+**
- A **Bitbucket Cloud** account
- A **Bitbucket App Password** (see below)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/bitbucket-mcp.git
cd bitbucket-mcp

# Install dependencies
npm install

# Build
npm run build
```

---

## Environment Setup

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
BITBUCKET_USERNAME=your_bitbucket_username
BITBUCKET_APP_PASSWORD=your_app_password
LOG_LEVEL=info
```

### How to create a Bitbucket App Password

1. Log in to [bitbucket.org](https://bitbucket.org)
2. Click your avatar → **Personal settings**
3. Go to **App passwords** → **Create app password**
4. Give it a label (e.g. `mcp-server`)
5. Select the following permissions:
   - **Repositories**: `Read`
   - **Pull requests**: `Read`, `Write` (Write needed for posting comments)
6. Click **Create** and copy the generated password into `.env`

> **Security:** App passwords are scoped and can be revoked at any time. Never use your actual Bitbucket password.

---

## Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# Production
npm run build
npm start
```

The server communicates over **stdio** — it has no HTTP port. It is designed to be launched by an MCP client such as Claude Desktop.

---

## Connecting to Claude Desktop

Add the following to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/absolute/path/to/bitbucket-mcp/dist/server.js"],
      "env": {
        "BITBUCKET_USERNAME": "your_bitbucket_username",
        "BITBUCKET_APP_PASSWORD": "your_app_password",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

> Replace `/absolute/path/to/bitbucket-mcp` with the actual path where you cloned the repo.

After saving, **restart Claude Desktop**. You should see the Bitbucket tools available in Claude's tool list.

### Example prompts

```
"List all repositories in my workspace 'acme-corp'"
"Show me the open pull requests in repo 'backend-api'"
"Fetch the diff for PR #42 in workspace 'acme-corp', repo 'backend-api'"
"Post a comment on PR #42: 'LGTM! Great work on the refactor.'"
```

---

## Development

```bash
# Lint
npm run lint

# Format
npm run format

# Watch mode
npm run dev
```

---

## Troubleshooting

**Server fails to start with "Missing required environment variable"**
→ Make sure `.env` exists and both `BITBUCKET_USERNAME` and `BITBUCKET_APP_PASSWORD` are set.

**401 Unauthorized errors**
→ Verify your App Password is correct and has the required permissions (Repositories: Read, Pull requests: Read/Write).

**403 Forbidden errors**
→ Your account may not have access to the workspace or repository you're querying.

**Tools not appearing in Claude Desktop**
→ Check that the path in `claude_desktop_config.json` is correct and the build has run (`npm run build`). Restart Claude Desktop after config changes.

**Large diffs are truncated**
→ By design. Diffs over 500,000 characters are truncated with a notice appended. This prevents overwhelming the LLM context window.

---

## Security Considerations

- **Credentials are never logged.** The Axios interceptors strip auth headers from all log output.
- **No hardcoded secrets.** All credentials are loaded exclusively from environment variables.
- **All tool inputs are validated** with [Zod](https://zod.dev) before any API call is made.
- **Comment length is capped** at 10,000 characters to prevent abuse.
- Use App Passwords (not your account password); they can be individually revoked.
- Run the server with the minimum required App Password permissions.

---

## Project Structure

```
bitbucket-mcp/
├── src/
│   ├── server.ts              # MCP server entry point
│   ├── config/
│   │   └── index.ts           # Env var loading & validation
│   ├── services/
│   │   ├── bitbucket.client.ts  # Axios client with auth & interceptors
│   │   └── bitbucket.service.ts # Bitbucket API methods
│   ├── tools/
│   │   ├── list-repositories.ts
│   │   ├── list-pull-requests.ts
│   │   ├── get-pull-request-details.ts
│   │   ├── get-pull-request-diff.ts
│   │   ├── list-pr-commits.ts
│   │   └── create-pr-comment.ts
│   └── utils/
│       ├── logger.ts          # Pino logger (stderr only)
│       ├── errors.ts          # Error normalization
│       └── pagination.ts      # Auto-pagination utility
├── tests/
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── LICENSE
├── package.json
├── tsconfig.json
└── README.md
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
