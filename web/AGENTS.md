<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Env vars

Use `env` from `web/env/server.ts` for server-only env vars. Do not read signing secrets with raw `process.env` in app code. Keep `.env*`, `data/`, and `storage/` out of git.
