# Vivid Architecture

Next.js 16 CMS in `vivid/`. Path alias: `@/*` → `vivid/`.

## Layers

```
app/           routing, page composition (minimal logic)
components/    React UI, Lexical nodes/plugins, layouts
hooks/         React Query wrappers + page orchestrators
lib/           pure TS, API clients, auth, validators (no JSX)
services/      server-only domain logic + Prisma
shared/        cross-cutting constants, id helpers
types/         shared DTOs between layers
tests/         unit tests mirroring lib/ and services/
```

### Request flow

**Admin (`/vivid/*`):** page → `hooks/api/use-*.ts` → `lib/api/*Client.ts` → `app/api/**` → `services/*.service.ts` → Prisma

**Reader (RSC):** page → `services/*.service.ts` → Prisma

**Reader (client pagination):** component → `fetch('/api/public/*')`

Pages and API routes must not import Prisma directly. Use services.

### Auth

- Middleware protects `/vivid/*` pages, not `/api/*`
- Every admin API route must call auth (via `authedHandler`)
- Intentionally public: `auth/login`, `auth/logout`

## Naming

| Kind | File | Export | Import example |
|------|------|--------|----------------|
| shadcn ui | kebab-case.tsx | named | `import { Button } from '@/components/ui/button'` |
| Feature component | PascalCase.tsx | named | `import { PostCard } from '@/components/public/PostCard'` |
| Lexical node | PascalCase.tsx | named | `import { GalleryNode, $createGalleryNode } from '...'` |
| Hook | use-kebab-case.ts | named | `import { usePosts } from '@/hooks/api/use-posts'` |
| lib module | kebab-case.ts | named | `import { sanitizeLexicalRoot } from '@/lib/editor/sanitize-lexical-state'` |
| API client | camelCase + Client | named | `postsClient.ts` |
| Service | kebab + .service.ts | named | `posts.service.ts` |
| App Router page | page.tsx | default | required by Next.js |

Phase 0.1 (named exports migration) complete.

## Data fetching conventions

| Surface | Read | Write |
|---------|------|-------|
| Admin `/vivid/*` | React Query hook (`hooks/api/use-*.ts`) | React Query mutation |
| Public RSC pages | Direct `services/*.service.ts` call | N/A |
| Public client pagination | `fetch` to `/api/public/*` or React Query | — |

Query keys: `lib/query-keys.ts` — use `queryKeys.*` in hooks; do not hardcode string arrays.

Shared DTOs: `types/` (re-exported from `lib/api/*Client.ts` for backward compatibility).

Request validation in routes: Zod schemas in `lib/validators/schemas.ts` and `lib/validators/query-schemas.ts`; use `parseJsonBody`, `parseSearchParams`, `parseRouteParams` from `lib/validators/parse.ts` (throws `ZodError` → handled by `apiHandler`). Keep `validateRequest` only where non-throwing checks are needed (e.g. tests).

`/api/public/*` means authenticated reader API for client-side pagination; RSC pages call services directly.

## Colocation

- Feature UI next to feature: `components/editor/post-editor/`, `components/admin/posts/`
- React contexts/providers in `components/`, not `lib/`
- Pure logic without React in `lib/`, tests in `tests/`

## Editor / Lexical

Two intentional React surfaces:

1. **Editor** — `components/editor/nodes/*` DecoratorNodes (interactive)
2. **Reader** — `components/public/PostContent.tsx` (read-only)

Shared pure logic in `lib/editor/` and `lib/editor/lexical/`:

- `walk-tree.ts` — single JSON walker
- `plaintext`, `collect-media-ids`, `sanitize-state`
- `image-layout`, `resolve-media-src`, `youtube-utils`, `insert-block`

New media block checklist:

1. DecoratorNode in `components/editor/nodes/`
2. Walker visitor in `lib/editor/lexical/`
3. Case in PostContent (all `LEXICAL_NODE_TYPE` values)
4. Shared helpers where duplicated

Do not merge editor nodes and PostContent into one component.

Editor layout:

```
components/editor/
  LexicalEditor.tsx
  editor-nodes.ts
  nodes/          ImageNode, GalleryNode, AudioNode, YouTubeNode, shared/
  plugins/        *Plugin.tsx
  floating/       toolbar, link editor, InsertBlockPlus
  post-editor/    page shell

lib/editor/
  link-utils.ts, floating-panel-position.ts, ...
  lexical/        walk-tree, plaintext, collect-media-ids, ...
```

## Tests

Tests live in `vivid/tests/`, not colocated with source.

Run after each phase: `npm test` in `vivid/`.

## Refactoring plan

Active plan: `.cursor/plans/vivid_refactoring_plan_e02713b2.plan.md`

Execution order: Phase 0 → 1 (security) → 2 (editor) → 0.1 (naming) → 3 (admin UI) → 4 (data layer)

Planning workflow: `/productize` → `/architecti` → `/finalize` (`.cursor/commands/`)
