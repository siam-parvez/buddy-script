-- Feed + auth support schema for Buddy Script
-- Run this in Supabase SQL editor (or as a migration) after enabling Auth.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  image_path text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comment_not_self_parent check (parent_id is null or parent_id <> id)
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_posts_created_at_desc on public.posts (created_at desc);
create index if not exists idx_posts_author_created on public.posts (author_id, created_at desc);
create index if not exists idx_comments_post_parent_created on public.comments (post_id, parent_id, created_at asc);
create index if not exists idx_post_likes_post on public.post_likes (post_id);
create index if not exists idx_comment_likes_comment on public.comment_likes (comment_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

create or replace trigger comments_set_updated_at
before update on public.comments
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  )
  on conflict (id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.comment_likes enable row level security;

-- Profiles: readable by authenticated users, writable by owner.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Posts: public posts are visible to everyone authenticated, private only to author.
drop policy if exists "posts_select_visibility" on public.posts;
create policy "posts_select_visibility"
on public.posts
for select
to authenticated
using (visibility = 'public' or author_id = auth.uid());

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
on public.posts
for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
on public.posts
for delete
to authenticated
using (author_id = auth.uid());

-- Comments/replies follow post visibility.
drop policy if exists "comments_select_visible_posts" on public.comments;
create policy "comments_select_visible_posts"
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

drop policy if exists "comments_insert_visible_posts" on public.comments;
create policy "comments_insert_visible_posts"
on public.comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
on public.comments
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
on public.comments
for delete
to authenticated
using (author_id = auth.uid());

-- Post likes follow post visibility.
drop policy if exists "post_likes_select_visible_posts" on public.post_likes;
create policy "post_likes_select_visible_posts"
on public.post_likes
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_likes.post_id
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own"
on public.post_likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = post_likes.post_id
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own"
on public.post_likes
for delete
to authenticated
using (user_id = auth.uid());

-- Comment/reply likes follow comment visibility via post visibility.
drop policy if exists "comment_likes_select_visible" on public.comment_likes;
create policy "comment_likes_select_visible"
on public.comment_likes
for select
to authenticated
using (
  exists (
    select 1
    from public.comments c
    join public.posts p on p.id = c.post_id
    where c.id = comment_likes.comment_id
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

drop policy if exists "comment_likes_insert_own" on public.comment_likes;
create policy "comment_likes_insert_own"
on public.comment_likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.comments c
    join public.posts p on p.id = c.post_id
    where c.id = comment_likes.comment_id
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

drop policy if exists "comment_likes_delete_own" on public.comment_likes;
create policy "comment_likes_delete_own"
on public.comment_likes
for delete
to authenticated
using (user_id = auth.uid());

-- Storage bucket for post images.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', false)
on conflict (id) do nothing;

-- Users can upload/delete only inside their own folder: <user_id>/...
drop policy if exists "post_images_insert_own_folder" on storage.objects;
create policy "post_images_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "post_images_delete_own_folder" on storage.objects;
create policy "post_images_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Read allowed only when the file belongs to a post visible to the current user.
drop policy if exists "post_images_select_visible_posts" on storage.objects;
create policy "post_images_select_visible_posts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'post-images'
  and exists (
    select 1
    from public.posts p
    where p.image_path = name
      and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

