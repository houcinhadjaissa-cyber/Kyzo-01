# AIOS — AI Operating System

A personal AI software-building platform for one user. Build, deploy, scan, and automate entire apps from your phone — no coding required.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo 54 + Expo Router (file-based routing)
- API: Express 5
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- **OpenAPI spec** → `lib/api-spec/openapi.yaml` (source of truth for all API contracts)
- **Generated hooks** → `lib/api-client-react/src/generated/api.ts`
- **Generated Zod schemas** → `lib/api-zod/src/generated/`
- **Mobile app** → `artifacts/mobile/app/` (Expo Router file-based routes)
- **API routes** → `artifacts/api-server/src/routes/`
- **Design tokens** → `artifacts/mobile/constants/colors.ts`
- **App icon** → `artifacts/mobile/assets/images/icon.png`

## Architecture decisions

- **In-memory data store** — API routes use seeded in-memory arrays. Add a database by provisioning PostgreSQL + Drizzle ORM and migrating the route handlers.
- **OpenAPI-first** — all API changes go through `lib/api-spec/openapi.yaml` first, then regenerate with codegen. Never bypass the generated client.
- **Full dark theme** — `constants/colors.ts` has matching `light` and `dark` keys (both deep-space palette) for a permanently dark app.
- **Model routing** — AI model catalog is served from the API; extend to call OpenRouter/DeepSeek/Qwen by adding real API keys in environment secrets.
- **No auth on first build** — single-user private tool; add Replit Auth if needed.

## Product

AIOS lets a solo non-technical founder build production-grade apps entirely from their phone:

- **Command Center** — live stats dashboard (projects, deployments, security score, AI cost)
- **Projects** — create, generate, scan, and deploy software projects via AI
- **Workflows** — automate recurring tasks (security scans, deployments, SEO, reports)
- **Deployments** — track all deployments across every project with provider and status
- **AI Models** — browse and switch between DeepSeek, Qwen, Mistral, Claude, GPT models
- **Security Scanner** — per-project vulnerability scoring with OWASP-style findings

## User preferences

- Phone-first, no coding required
- Ultra-premium dark cinematic aesthetic (space-age, Apple Vision Pro × Linear)
- Low operating costs — route cheap models for simple tasks, powerful models only when needed
- Maximum automation — everything should feel autonomous

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Do NOT restart the Expo workflow for code-only changes — Metro HMR handles it automatically
- Only restart Expo when adding new packages or hitting a Metro bundler error
- The API server uses in-memory data — restarting it resets all runtime state

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile-specific patterns and pitfalls
