<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- App Router is the source of truth: route pages live in `src/app/**/page.tsx`, auth callbacks live in `src/app/auth/**/route.ts`, and the home route in `src/app/page.tsx` redirects to `/feed` or `/login` using `src/lib/server.ts`.
- Session refresh/protection runs through `src/proxy.ts` -> `src/lib/proxy.ts`; keep the per-request `createServerClient` pattern, the cookie passthrough, and the `auth.getClaims()` check intact when changing auth flow.
- Supabase client boundaries are split by runtime: browser code uses `src/lib/client.ts`, server code uses `src/lib/server.ts`, and proxy code uses `src/lib/proxy.ts`. All three read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Mutations belong in `src/app/protected/actions.ts`; they are server actions, perform ownership/validation checks there, and call `revalidatePath('/feed')` after successful post/comment/like changes.
- Feed UI is assembled from `src/components/feed/*`, with shared feed types/utilities in `src/lib/feed/*`. The feed page (`src/app/feed/page.tsx`) composes these pieces and signs image URLs from Supabase storage.
- Tests use Jest + React Testing Library with `src/components/__tests__/*.test.tsx`, `jest.config.ts`, and `jest.setup.ts`; update `package.json` scripts (`pnpm test`, `pnpm test:watch`, `pnpm test:coverage`) when adjusting test workflows.
- The implemented UI and copy follow the provided assets in `req-files/*.html` and `public/auth/*`; keep changes aligned with those references when touching login, sign-up, or feed screens.
<!-- END:nextjs-agent-rules -->
