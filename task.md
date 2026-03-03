# Bitbucket MCP Server (Open Source Edition)

## Project Goal

Build a production-grade, open-source Model Context Protocol (MCP) server that integrates with Bitbucket and exposes repository and pull request functionality as MCP tools.

This project will be published publicly on GitHub and must be:

- Secure by default
- Well-documented
- Extensible
- Cleanly architected
- Easy to install
- Easy to configure
- Ready for community contributions

Target Runtime: Node.js 18+
Language: TypeScript (strict mode)

---

# 1. Supported Platforms

## Primary

- Bitbucket Cloud (v2 API)
  - Base URL: https://api.bitbucket.org/2.0

## Optional (Architecture-ready, not required for MVP)

- Bitbucket Server / Data Center

The architecture must allow adding Bitbucket Server support later without major refactoring.

---

# 2. Authentication

## Bitbucket Cloud

- Username + App Password (Basic Auth)
- Loaded via environment variables

No credentials must ever:

- Be hardcoded
- Be logged
- Be printed in error messages

---

# 3. Technical Stack

- TypeScript (strict mode)
- Node.js 18+
- @modelcontextprotocol/sdk
- axios
- zod (input validation)
- dotenv
- pino (structured logging)
- eslint + prettier
- tsup (or tsc for build)

---

# 4. Public Project Requirements

The repository must include:

- MIT License
- README.md
- CONTRIBUTING.md
- .gitignore
- .env.example
- ESLint config
- Prettier config
- tsconfig.json
- package.json
- Proper scripts section
- Clear folder structure

---

# 5. Required MCP Tools

Each tool must:

- Validate input with Zod
- Handle pagination
- Handle API errors gracefully
- Return structured JSON
- Not crash the MCP server

---

## 5.1 list_repositories

**Input:**

```json
{
  "workspace": "string"
}
```

**Return:**

- `name`
- `slug`
- `is_private`
- `updated_on`

**Endpoint:** `GET /repositories/{workspace}`

Must auto-handle pagination.

---

## 5.2 list_pull_requests

**Input:**

```json
{
  "workspace": "string",
  "repo_slug": "string",
  "state": "OPEN | MERGED | DECLINED (optional)"
}
```

**Return:**

- `id`
- `title`
- `state`
- `author`
- `source_branch`
- `destination_branch`
- `created_on`

**Endpoint:** `GET /repositories/{workspace}/{repo_slug}/pullrequests`

---

## 5.3 get_pull_request_details

**Input:**

```json
{
  "workspace": "string",
  "repo_slug": "string",
  "pr_id": "number"
}
```

**Return:**

- `title`
- `description`
- `state`
- `reviewers`
- `participants`
- `merge_commit` (if exists)

---

## 5.4 get_pull_request_diff

**Input:**

```json
{
  "workspace": "string",
  "repo_slug": "string",
  "pr_id": "number"
}
```

**Return:**

- Raw unified diff as string

Must handle large diffs safely.

---

## 5.5 list_pull_request_commits

**Input:**

```json
{
  "workspace": "string",
  "repo_slug": "string",
  "pr_id": "number"
}
```

**Return:**

- `hash`
- `author`
- `date`
- `message`

---

## 5.6 create_pull_request_comment

**Input:**

```json
{
  "workspace": "string",
  "repo_slug": "string",
  "pr_id": "number",
  "content": "string"
}
```

**Rules:**

- Limit content to 10,000 characters
- Validate input
- Return comment ID + content

---

# 6. Architecture Requirements

Use clean, modular structure:

```
bitbucket-mcp/
│
├── src/
│   ├── server.ts
│   ├── tools/
│   ├── services/
│   ├── config/
│   ├── utils/
│
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
├── README.md
├── CONTRIBUTING.md
├── LICENSE
```

---

# 7. Core Implementation Rules

## 7.1 Bitbucket Client

Create reusable client:

- Configured Axios instance
- Auth configured
- Interceptors for:
  - Logging
  - Error normalization
- Clean separation from tools

## 7.2 Pagination Handling

Bitbucket returns:

```json
{
  "values": [],
  "next": "url"
}
```

You must:

- Automatically fetch all pages
- Merge results
- Prevent infinite loops

## 7.3 Error Handling

All tools must:

- Catch API errors
- Return structured error responses
- Never crash server
- Provide clear error messages

## 7.4 Logging

Use pino:

- Log requests
- Log response status
- Do NOT log credentials
- Respect `LOG_LEVEL` env variable

---

# 8. MCP Server Setup

Server must:

- Register all tools
- Use Stdio transport
- Export metadata:
  - `name`: `bitbucket-mcp`
  - `version`
  - `description`

---

# 9. Environment Variables

**Required:**

```
BITBUCKET_USERNAME=
BITBUCKET_APP_PASSWORD=
```

**Optional:**

```
LOG_LEVEL=info
```

If required variables are missing: fail fast with a descriptive error.

---

# 10. Scripts Section

`package.json` must include:

- `dev`
- `build`
- `start`
- `lint`
- `format`

---

# 11. README Requirements

README must include:

- What is MCP?
- What is this project?
- Installation steps
- Environment setup
- How to create a Bitbucket App Password
- How to run locally
- How to connect to Claude Desktop
- Example Claude config
- Troubleshooting
- Security considerations

---

# 12. Security Requirements

- No secrets in logs
- No hardcoded credentials
- Validate all tool inputs
- Sanitize external inputs
- Limit comment length

---

# 13. Code Quality Requirements

- Strict TypeScript
- No `any` types
- Modular design
- Proper async/await
- Clean error handling
- Clear typing
- No duplicated logic

---

# 14. Stretch Goals (Optional)

- Rate limit detection
- In-memory caching
- Bitbucket Server support
- Repository search tool
- PR file list tool
- GitHub Actions CI workflow
- Unit tests for services

---

# 15. Definition of Done

The project is complete when:

- `npm install` works
- `npm run build` succeeds
- `node dist/server.js` runs without error
- Claude Desktop can:
  - List repos
  - List PRs
  - Fetch diff
  - Post comment
- Code is clean, modular, documented, and publish-ready