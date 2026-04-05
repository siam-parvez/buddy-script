# Buddy Script

Next.js 16 + Supabase social app implementing:

- Authentication and authorization
- Registration (first name, last name, email, password)
- Protected feed route (`/feed`)
- Create post (text + optional image)
- Post privacy (`public`/`private`)
- Like/unlike for posts, comments, and replies
- Comments + replies
- "Liked by" display for posts/comments/replies

## Stack

- Frontend: Next.js App Router (React 19)
- Backend/data/auth/storage: Supabase
- DB: Postgres (via Supabase)

## 1) Environment setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY
```

## 2) Database + storage setup

Run `supabase/schema.sql` in Supabase SQL editor.

Or run the automated CLI setup:

```bash
pnpm setup:supabase
```

If CLI is not authenticated yet:

```bash
npx supabase login
```

If your project ref is not derivable from `.env.local`, also export:

```bash
export SUPABASE_PROJECT_REF=YOUR_PROJECT_REF
```

This creates:

- `profiles`
- `posts`
- `comments` (supports replies via `parent_id`)
- `post_likes`
- `comment_likes`
- Indexes for feed read patterns
- RLS policies for authz and visibility
- `post-images` storage bucket + storage policies
- Trigger to create/update profile rows from auth users

## 3) Install and run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Behavior:

- If authenticated, `/` redirects to `/feed`
- If not authenticated, `/` redirects to `/login`

## Implemented pages and files

- `src/app/feed/page.tsx`: Feed page (based on `req-files/feed.html`) + feed rendering
- `src/components/login-form.tsx`: Login UI (provided design) + email login + Google OAuth
- `src/components/sign-up-form.tsx`: Registration UI (provided design) + first/last/email/password
- `src/app/protected/actions.ts`: Server Actions for post/comment/like mutations
- `supabase/schema.sql`: Database schema, RLS, storage setup

## Notes

- Feed results are shown with newest posts first.
- Private posts are visible only to the post author.
- Image uploads are limited to 5MB and image MIME types.
- Supabase RLS enforces authz at DB/storage level.
