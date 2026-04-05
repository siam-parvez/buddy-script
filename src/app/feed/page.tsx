import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'

import { CreatePostCard } from '@/components/feed/create-post-card'
import { FeedHeader } from '@/components/feed/feed-header'
import { FeedPostCard } from '@/components/feed/feed-post-card'
import { LeftSidebar, RightSidebar } from '@/components/feed/feed-sidebars'
import type { FeedPost, PostRecord, CommentRecord } from '@/lib/feed/feed-types'
import { getFullName, getNameFallback } from '@/lib/feed/feed-utils'

function getCurrentUserAvatarUrl(
  profileAvatarUrl: string | null | undefined,
  userMetadata: Record<string, unknown> | undefined
) {
  const profileAvatar = profileAvatarUrl?.trim() ?? ''
  if (profileAvatar) {
    return profileAvatar
  }

  const metadataAvatar = userMetadata?.avatar_url
  if (typeof metadataAvatar === 'string' && metadataAvatar.trim()) {
    return metadataAvatar.trim()
  }

  const picture = userMetadata?.picture
  if (typeof picture === 'string' && picture.trim()) {
    return picture.trim()
  }

  return null
}

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('first_name,last_name,email,avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (currentProfileError) {
    throw new Error(currentProfileError.message)
  }

  const currentUserName = getFullName(currentProfile, getNameFallback(currentProfile, 'Unknown user'))
  const currentUserAvatarUrl = getCurrentUserAvatarUrl(currentProfile?.avatar_url, user.user_metadata)

  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select(
      `
      id,
      author_id,
      content,
      image_path,
      visibility,
      created_at,
      author:profiles!posts_author_id_fkey(first_name,last_name,email,avatar_url),
      likes:post_likes(user_id,profile:profiles!post_likes_user_id_fkey(first_name,last_name,email,avatar_url))
    `
    )
    .order('created_at', { ascending: false })

  if (postsError) {
    const tableMissing = postsError.message.includes("Could not find the table 'public.posts'")

    if (!tableMissing) {
      throw new Error(postsError.message)
    }

    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-[#f4f6fb] text-slate-900 transition-colors duration-300 dark:bg-[#07101f] dark:text-slate-100">
        <FeedHeader currentUserName={currentUserName} currentUserAvatarUrl={currentUserAvatarUrl} />

        <main className="relative mx-auto flex min-h-0 flex-1 items-center px-4 pt-[80px] pb-4 sm:px-6 sm:pt-[80px] sm:pb-6">
          <div className="w-full rounded-[28px] border border-white/70 bg-white/90 p-6 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Database setup required</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Supabase is connected, but feed tables are missing. Run `supabase/schema.sql` in your Supabase SQL editor, then refresh this page.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Original error: {postsError.message}</p>
          </div>
        </main>
      </div>
    )
  }

  const rawPosts = (postsData ?? []) as unknown as PostRecord[]
  const postIds = rawPosts.map((post) => post.id)

  const { data: commentsData, error: commentsError } = postIds.length
    ? await supabase
        .from('comments')
        .select(
          `
          id,
          post_id,
          parent_id,
          content,
          created_at,
          author_id,
          author:profiles!comments_author_id_fkey(first_name,last_name,email,avatar_url),
          likes:comment_likes(user_id,profile:profiles!comment_likes_user_id_fkey(first_name,last_name,email,avatar_url))
        `
        )
        .in('post_id', postIds)
    : { data: [], error: null }

  if (commentsError) {
    throw new Error(commentsError.message)
  }

  const comments = (commentsData ?? []) as unknown as CommentRecord[]
  const commentsByPost = new Map<string, CommentRecord[]>()

  for (const comment of comments) {
    const list = commentsByPost.get(comment.post_id) ?? []
    list.push(comment)
    commentsByPost.set(comment.post_id, list)
  }

  const feedPosts: FeedPost[] = []

  for (const post of rawPosts) {
    let imageUrl: string | null = null

    if (post.image_path) {
      const { data: signedUrlData } = await supabase.storage.from('post-images').createSignedUrl(post.image_path, 60 * 15)
      imageUrl = signedUrlData?.signedUrl ?? null
    }

    feedPosts.push({
      ...post,
      image_url: imageUrl,
      likes: post.likes ?? [],
      comments: commentsByPost.get(post.id) ?? [],
    })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f4f6fb] text-slate-900 transition-colors duration-300 dark:bg-[#07101f] dark:text-slate-100">
      <FeedHeader currentUserName={currentUserName} currentUserAvatarUrl={currentUserAvatarUrl} />

      <main className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden px-4 pt-[80px] sm:px-6 lg:pt-[80px]">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
          <LeftSidebar />

          <section className="min-h-0 lg:col-span-6 lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="space-y-4 mt-4">
              <CreatePostCard currentUserName={currentUserName} currentUserAvatarUrl={currentUserAvatarUrl} />

              {feedPosts.length === 0 ? (
                <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 text-sm text-slate-500 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-400">
                  No posts yet. Create the first post.
                </div>
              ) : null}

              {feedPosts.map((post) => (
                <FeedPostCard key={post.id} post={post} userId={user.id} />
              ))}
            </div>
          </section>

          <RightSidebar />
        </div>
      </main>
    </div>
  )
}
