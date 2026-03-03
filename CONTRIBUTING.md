# Contributing to bitbucket-mcp

Thank you for your interest in contributing! This guide will help you get started.

---

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Run in dev mode: `npm run dev`

---

## Development Workflow

```bash
# Start in watch mode
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format

# Build
npm run build
```

---

## Project Conventions

### TypeScript

- **Strict mode is enforced.** No `any` types.
- Use `unknown` for caught errors and narrow them explicitly.
- Prefer `interface` for object shapes returned to callers; use `type` for unions/intersections.
- Use `.js` extensions in all relative imports (required for ESM).

### Adding a New Tool

1. Create `src/tools/your-tool-name.ts`
2. Export a `registerYourToolName(server, service)` function
3. Define the Zod input schema inline (named `inputSchema`)
4. Call `server.tool(name, description, inputSchema, handler)`
5. In the handler: wrap the service call in try/catch, use `normalizeError` + `formatError`, and return `{ content: [{ type: 'text', text: ... }], isError: true }` on failure
6. Import and call your registration function in `src/server.ts`
7. Add the new API method to `BitbucketService` if needed

### Logging

- All logs go to **stderr** via pino — stdout is reserved for the MCP stdio transport.
- Use `logger.info` for normal operations, `logger.debug` for verbose/request-level detail, `logger.warn` for handled errors, `logger.error` for unexpected failures.
- **Never log credentials**, request headers, or any value from `config.bitbucket.*`.

### Error Handling

- All tool handlers must catch errors and return `{ isError: true }` — never let exceptions propagate to crash the server.
- Use `normalizeError(err)` to convert unknown throws to a safe `ApiError` shape.
- Use `formatError(apiError)` to produce the user-visible string.

---

## Pull Request Guidelines

- One feature or fix per PR
- Include a clear description of what changed and why
- Ensure `npm run lint` and `npm run build` pass before submitting
- If adding a new tool, update the tools table in `README.md`

---

## Reporting Issues

Please open an issue describing:

- What you expected to happen
- What actually happened
- Relevant error messages (redact any credentials)
- Node.js version (`node --version`)
- OS

---

## Security Issues

Please **do not** open a public issue for security vulnerabilities. Email the maintainers privately or use GitHub's private vulnerability reporting.

---

## Code of Conduct

Be respectful and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
