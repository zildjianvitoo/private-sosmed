# Project Brief: Simple Social Media App

## Objective

Create a responsive Next.js 15 application (TypeScript) that allows users to manage basic profiles, add friends, and upload/share photos. The UI should follow Tailwind CSS design tokens with shadcn/ui components, and data should sync via React Query against a SQLite-backed API layer.

## Functional Requirements

- **Accounts & auth**: Users can register, log in, and maintain a session; password hashes stored securely.
- **Profile basics**: Users can view/update display name, avatar, short bio; profile cards show friend counts and recent photos.
- **Friendship flow**: Users can search others, send friend requests, cancel, accept/deny; friendships become mutual on acceptance.
- **Photo sharing**: Users can upload images (JPEG/PNG/WebP, max 5 MB), add captions, and see their own and friends’ uploads in a chronological feed.
- **Activity feed**: Landing page shows latest uploads from user or friends with infinite scroll/pagination.
- **Notifications**: Badge or list for pending friend requests and confirmations.
- **Responsive layout**: Works on mobile-first breakpoints through desktop, with touch-friendly interactions.

## Non-Functional Requirements

- **Accessibility**: Meet core WCAG 2.1 AA patterns (semantic regions, keyboard navigation, focus management).
- **Performance**: Core pages hydrate under 2 s on mid-tier mobile; image uploads handled via background mutation with optimistic UI.
- **Security**: Enforce auth on protected routes, validate uploads server-side, sanitize user input, store secrets via `.env`.
- **Persistence**: SQLite database lives in repo for local dev; production strategy documented including backup/restore.
- **Testing**: Unit tests for data utilities, integration tests for API routes, and critical e2e happy path (friend request + upload + feed).

## Stack & Key Libraries

- Next.js 14 App Router with TypeScript aliases for app structure (`app/`, `components/`, `lib/`).
- Tailwind CSS + shadcn/ui for design system primitives and consistent theming.
- React Query (TanStack Query) for server state, mutations, optimistic updates, and caching.
- Prisma ORM with SQLite for schema management, migrations, and type-safe queries.
- NextAuth.js for credential-based auth (email/password) and session management; optionally extend with OAuth later.
- Upload pipeline: Next.js Route Handlers + `multer`-style lightweight lib or `uploadthing` alternative; images stored under `/public/uploads` (local) with CDN strategy documented for prod.
- Zod for runtime validation of API payloads and shared form schemas.

## Initial Data Model

- `User`: id, email, passwordHash, displayName, avatarUrl, bio, createdAt.
- `FriendRequest`: id, requesterId, receiverId, status (`pending|accepted|declined`), timestamps.
- `Friendship`: id, userOneId, userTwoId, createdAt.
- `Photo`: id, ownerId, filePath, caption, createdAt, visibility.
- `Notification`: id, userId, type (`friend_request|upload`), metadata JSON, readAt.

## Implementation Roadmap

### Phase 0 – Tooling & Project Hygiene

- [x] Confirm Node.js ≥18 and install deps; add commit hooks (lint-staged, husky) if desired.
- [x] Enable ESLint + Prettier config for consistent TypeScript formatting.
- [x] Document environment variables in `.env.example` (NEXTAUTH_SECRET, NEXTAUTH_URL, STORAGE_PATH, etc.).

Phase 0 deliverables live under `package.json` scripts, `.husky/pre-commit`, `.eslintrc.json`, `.prettierignore`, `prettier.config.mjs`, and `.env.example`; linting uses the ESLint CLI with Prettier integration and lint-staged for staged formatting.

### Phase 1 – UI Foundation

- [x] Verify Tailwind setup; extend theme tokens for brand colors, typography, and breakpoints.
- [x] Install shadcn generator; scaffold reusable components (Button, Input, Dialog, Avatar, Skeleton, Tabs).
- [x] Build responsive shell: navigation bar (logo, notifications, profile dropdown), `app/(auth)` grouping for auth pages, `app/(feed)` for main experience.

Phase 1 introduces an aurora-inspired palette (indigo primary with aqua accents), tailwind 4 tokenisation via `@theme`, shadcn UI scaffolding under `components/ui`, and a responsive feed shell composed with `SiteHeader`, `ThemeToggle`, and `Card` primitives.

### Phase 2 – Auth & User Model

- [x] Initialize Prisma with SQLite (`npx prisma init --datasource-provider sqlite`).
- [x] Define `User` schema, baseline migration, and seed developer accounts.
- [x] Wire NextAuth credential provider using Prisma adapter; add registration API + form with Zod validation.
- [x] Protect authenticated routes with middleware, redirect unauthenticated users to `/login`.

Phase 2 adds Prisma schema + baseline migration SQL (`prisma/migrations/0001_init/`), a seed script for `demo@sosmed.local` (`npm run db:seed`), credential-based NextAuth setup (`auth.config.ts`, `/api/auth/register`), React Query + Session providers in the app shell, and guarded routes via `middleware.ts` with login/register flows under `app/(auth)`. Fresh environments can run `npm run db:migrate && npm run db:seed` to materialise the auth schema locally.

### Phase 3 – Social Graph

- [x] Add Prisma models for `FriendRequest` and `Friendship`; create migrations and update seeds.
- [x] Implement API routes:
  - `POST /api/friend-requests` (create or auto-accept),
  - `PATCH /api/friend-requests/:id` (accept/decline),
  - `DELETE /api/friend-requests/:id` (cancel),
  - `GET /api/friend-requests` and `GET /api/friends`.
- [x] Integrate React Query hooks for listing/searching users, sending requests, and optimistic acceptance.
- [x] Render UI components: searchable user list with status badges, notification badge counting pending requests.

Phase 3 delivers a dedicated friends dashboard (`app/friends/page.tsx`) with React Query-powered mutations, new REST endpoints under `/api/friend-requests`, `/api/friends`, and `/api/users/search`, plus SQLite schema additions (`prisma/migrations/0002_social_graph/`). Seed data now provisions demo accounts with pre-populated friendships/requests (`npm run db:seed`).

Suggested connections now filter out existing friends and rank prospects by mutual connections, ensuring the module surfaces genuinely new people to follow.

### Phase 4 – Media Upload & Feed

- [x] Add `Photo` schema with owner relation; store file path + caption.
- [x] Configure upload handler (Next.js Route Handler with FormData) writing to `public/uploads` (local) and returning metadata; ensure file type/size validation.
- [ ] Add image processing step (optional: sharp for resizing thumbnails).
- [x] Build feed API returning paginated photo cards (cursor-based on `createdAt`).
- [x] Build React Query hooks/components for upload form (with optimistic preview) and infinite feed list using shadcn cards.

Phase 4 ships local media uploads via `/api/photos` with validation, the Prisma-backed `Photo` model/migration (`prisma/migrations/0003_media_feed/`), seeded sample photos stored under `public/uploads/`, and a React Query powered feed (`FeedTimeline`) with client-side pagination plus a `PostComposer` handling uploads. Image resizing is deferred for a future enhancement. We also refreshed the member profile experience: `/profile` now highlights bio, friend count, and a responsive 3 × 3 photo grid, while the profile editing form moved to a dedicated `/settings` route.

### Phase 5 – Notifications & Polish

- [x] Create `Notification` model + queries for pending friend requests and confirmations.
- [x] Surface notifications in header dropdown and mark-as-read mutation.
- [x] Add user profile page with photo gallery grid, friend list.
- [x] Implement responsive adjustments (mobile tabs, gesture-friendly buttons) and accessibility audit.
- [ ] Write unit and integration tests (`vitest` + `@testing-library/react`), plus Playwright e2e covering core flow.

Phase 5 introduces a SQLite-backed `Notification` table (`prisma/migrations/0004_notifications/`) with seed data, REST endpoints under `/api/notifications`, and mutation hooks that generate alerts whenever friend requests or uploads occur. The site header now ships a live React Query-powered notifications tray with mark-as-read semantics, while `/profile/[id]` renders public-facing profile cards that reuse the refreshed overview component. Feed uploads broadcast to friends, and profile/settings flows share the same responsive layout refinements.

### Phase 6 – Deployment & Documentation

1. Provide production notes: migrating SQLite to file storage (e.g., Turso/LibSQL) or ensuring persistent volume.
2. Add instructions for running migrations, seeding, starting dev server in README.
3. Set up CI (GitHub Actions) running lint/test/prisma migrate check.
4. Create backlog section for stretch goals (comments, likes, direct messaging, real-time updates).

## Suggested Workflow Practices

- Commit and push after completing each task, using concise conventional commit messages (e.g., `feat: add friend request flow`).
- Centralize fetch/service logic under `lib/api/` modules so components stay declarative and reuse consistent request helpers.
- Track upcoming tasks in `docs/backlog.md` or tickets rather than expanding this file indefinitely.
- Update this roadmap after major milestones; archive completed phases with dates for historical context.
- Keep design decisions and schema changes summarized in ADRs under `docs/adr/` when choices become complex.
