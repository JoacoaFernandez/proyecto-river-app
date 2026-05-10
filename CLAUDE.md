# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

River App is a River Plate (Argentine football club) fan application — a monorepo with a NestJS backend and a React frontend. It pulls live match data from API-Football, generates AI press releases via Google Gemini, and serves a JWT-authenticated frontend.

## Repository Layout

```
apps/
  backend/   — NestJS + Prisma + PostgreSQL
  frontend/  — React 19 + Vite + TailwindCSS
docker-compose.yml  — PostgreSQL (5432) and Redis (6379)
```

## Commands

### Backend (`apps/backend`)

```bash
npm run start:dev     # Development server with hot reload
npm run build         # Compile TypeScript
npm run start:prod    # Run compiled dist/main.js
npm run lint          # ESLint with auto-fix
npm run format        # Prettier
npm run test          # Jest unit tests
npm run test:watch    # Jest in watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests (test/jest-e2e.json)
npx prisma migrate dev   # Apply DB migrations
npx prisma db seed       # Seed squad from API-Football
```

### Frontend (`apps/frontend`)

```bash
npm run dev      # Vite dev server
npm run build    # tsc + Vite bundle
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Architecture

### Backend Modules

Each domain is a self-contained NestJS module under `src/`:

- **auth/** — JWT + Passport authentication; 1-day token expiry; secret from `JWT_SECRET` env var
- **matches/** — Match CRUD + `SyncService` that fetches from API-Football; `LiveApiService` caches responses for 15 minutes to stay within rate limits
- **news/** — Article management + `NewsAiService` which calls Google Gemini to generate press releases
- **players/** — Squad data; seeded automatically from API-Football via `prisma/seed.ts`
- **formations/** — Tactical formations linked to matches

Swagger API docs are auto-generated at `/api` (JWT bearer auth configured).

### Frontend Services

Services in `src/services/` are thin Axios wrappers over the backend API:
- `auth.service.ts`, `matches.service.ts`, `players.service.ts`, `news.service.ts`, `live.service.ts`

JWT is stored in `localStorage` under the key `river_app_token`.

Custom River red brand color is `#E30613` (configured in `tailwind.config.js`).

## Environment Variables

Backend `.env` (required):
```
DATABASE_URL          # PostgreSQL connection string
API_FOOTBALL_KEY      # API-Football credentials
RIVER_PLATE_TEAM_ID   # 268 (Copa Libertadores) or 435 (local)
GEMINI_API_KEY        # Google Gemini for AI press releases
JWT_SECRET            # Token signing secret
```

## Key Conventions

- **Live data caching**: `LiveApiService` caches API-Football responses for 15 minutes — avoid calling it in tight loops.
- **Dual team IDs**: River Plate appears as ID 268 (international competitions) and 435 (Argentine league) in API-Football.
- **AI news**: Press releases go through `NewsAiService` (Gemini); regular articles use standard CRUD.
- **Seeding**: `prisma/seed.ts` auto-syncs the real River Plate squad on first DB setup.
- **CORS**: Backend calls `enableCors()` — no additional proxy needed during local development.
- **WebSockets**: socket.io is wired in `live-api.module.ts` but not yet used by the frontend.
