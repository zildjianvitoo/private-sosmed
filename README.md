# Serenity Pulse

Serenity Pulse is a private social media experience built with Next.js 15, designed for sharing moments with a close network. It pairs a rich React Query front end with a Prisma-powered SQLite backend to handle authentication, friendships, photo uploads, and real-time style notifications.

## Features

- **Account Management** – Credential-based auth with NextAuth, protected routes, and profile editing.
- **Social Graph** – Friend requests (send, accept, decline, cancel) backed by Prisma relations with notifications for key events.
- **Media Feed** – Optimistic uploads (PNG/JPEG/WebP up to 5 MB) via Next.js route handlers, rendered in an infinite scroll feed.
- **Notifications** – SQLite-backed notifications surfaced in a live dropdown with mark-as-read behavior.
- **Profiles** – Dedicated `/profile` overview with friend counts and a 3 × 3 photo grid, plus `/profile/[id]` for viewing other members.
- **UI System** – Tailwind CSS + shadcn/ui components, self-hosted Geist fonts for consistent rendering offline.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS, shadcn/ui, locally hosted Geist Sans/Mono
- **State**: React Query for server state and optimistic mutations
- **Data Layer**: Prisma ORM with SQLite
- **Auth**: NextAuth credentials provider
- **Validation**: Zod
- **Testing**: ESLint & Prettier (additional Vitest/Playwright planned per roadmap)

## Prerequisites

- Node.js ≥ 18
- npm (or pnpm/yarn/bun)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**
   Copy `.env.example` to `.env` and set the required secrets:
   - `DATABASE_URL` (defaults to local `sqlite` file)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `STORAGE_PATH` (optional override for uploads directory)

3. **Database setup**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app listens on [http://localhost:3000](http://localhost:3000).

## Project Scripts

| Command                                   | Description                                                 |
| ----------------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                             | Start Next.js in development mode (Turbopack).              |
| `npm run build`                           | Production build.                                           |
| `npm run start`                           | Start the production server.                                |
| `npm run lint`                            | Run ESLint with zero-warning enforcement.                   |
| `npm run lint:fix`                        | Auto-fix lint issues.                                       |
| `npm run format` / `npm run format:write` | Prettier check or write.                                    |
| `npm run db:generate`                     | Generate Prisma client.                                     |
| `npm run db:migrate`                      | Apply migrations.                                           |
| `npm run db:seed`                         | Seed demo data (users, friendships, photos, notifications). |
| `npm run db:studio`                       | Open Prisma Studio.                                         |

## Development Notes

- **Uploads** are stored under `public/uploads`. `STORAGE_PATH` can redirect to another folder for local experimentation.
- **Fonts** are bundled under `app/fonts/` and registered with `next/font/local` so builds do not rely on Google Fonts connectivity.
- **Notifications** are exposed via `/api/notifications` with GET (list + unread count) and PATCH (mark read).
- **Roadmap** lives in `AGENTS.md`, outlining completed phases and upcoming deliverables (tests, accessibility audit, deployment notes, etc.).

## Testing & Quality

Currently ESLint + Prettier enforce code quality. Phase 5 of the roadmap reserves work for Vitest, API integration tests, and Playwright E2E coverage.

## Deployment

The project targets Vercel or any Next.js-compatible host. For production, plan to externalize SQLite (e.g., LibSQL/Turso) or mount persistent storage for `DATABASE_URL`. See `AGENTS.md` Phase 6 for deployment checklist and future CI integration.

## Contributing

Follow the suggested workflow in `AGENTS.md`: make focused changes, run lint/tests, commit with conventional messages (e.g., `feat: ...`), and keep the roadmap updated after major milestones.

---

Built with ❤️ by the Serenity Pulse team.
