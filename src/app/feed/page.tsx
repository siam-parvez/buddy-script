import Image from 'next/image'
import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/server'
import {
  createComment,
  createPost,
  toggleCommentLike,
  togglePostLike,
} from '@/app/protected/actions'

type Profile = {
  first_name: string | null
  last_name: string | null
  email: string | null
}

type LikeWithProfile = {
  user_id: string
  profile: Profile | null
}

type PostRecord = {
  id: string
  author_id: string
  content: string
  image_path: string | null
  visibility: 'public' | 'private'
  created_at: string
  author: Profile | null
  likes: LikeWithProfile[] | null
}

type CommentRecord = {
  id: string
  post_id: string
  parent_id: string | null
  content: string
  created_at: string
  author_id: string
  author: Profile | null
  likes: LikeWithProfile[] | null
}

type FeedPost = PostRecord & {
  image_url: string | null
  likes: LikeWithProfile[]
  comments: CommentRecord[]
}

function getFullName(profile: Profile | null, fallback: string) {
  const first = profile?.first_name?.trim() ?? ''
  const last = profile?.last_name?.trim() ?? ''
  const name = `${first} ${last}`.trim()

  if (name) {
    return name
  }

  return profile?.email ?? fallback
}

function likesSummary(likes: LikeWithProfile[]) {
  if (likes.length === 0) {
    return 'No likes yet'
  }

  return likes.map((like) => getFullName(like.profile, like.user_id.slice(0, 8))).join(', ')
}

function renderReplies(comments: CommentRecord[], userId: string, parentId: string) {
  const replies = comments
    .filter((comment) => comment.parent_id === parentId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return replies.map((reply) => {
    const replyLikes = reply.likes ?? []
    const userLikedReply = replyLikes.some((like) => like.user_id === userId)

    return (
      <div key={reply.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">{getFullName(reply.author, 'Unknown user')}</p>
        <p className="mt-1 text-sm text-slate-700">{reply.content}</p>
        <p className="mt-1 text-xs text-slate-500">{new Date(reply.created_at).toLocaleString()}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <form action={toggleCommentLike}>
            <input type="hidden" name="commentId" value={reply.id} />
            <button
              type="submit"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-white"
            >
              {userLikedReply ? 'Unlike' : 'Like'} ({replyLikes.length})
            </button>
          </form>
          <p className="text-xs text-slate-500">Liked by: {likesSummary(replyLikes)}</p>
        </div>
      </div>
    )
  })
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
      author:profiles!posts_author_id_fkey(first_name,last_name,email),
      likes:post_likes(user_id,profile:profiles!post_likes_user_id_fkey(first_name,last_name,email))
    `
    )
    .order('created_at', { ascending: false })

  if (postsError) {
    const tableMissing = postsError.message.includes("Could not find the table 'public.posts'")

    if (tableMissing) {
      return (
        <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Database setup required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Supabase is connected, but feed tables are missing. Run `supabase/schema.sql` in your
              Supabase SQL editor, then refresh this page.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Original error: {postsError.message}</p>
          </div>
        </div>
      )
    }

    throw new Error(postsError.message)
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
          author:profiles!comments_author_id_fkey(first_name,last_name,email),
          likes:comment_likes(user_id,profile:profiles!comment_likes_user_id_fkey(first_name,last_name,email))
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
      const { data: signedUrlData } = await supabase.storage
        .from('post-images')
        .createSignedUrl(post.image_path, 60 * 15)
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
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/auth/logo.svg" alt="Buddy Script" width={140} height={36} className="h-9 w-auto" />
            <span className="hidden rounded-full bg-[#e8edff] px-3 py-1 text-xs font-medium text-[#3d4ed7] sm:inline">
              Feed
            </span>
          </div>
          <div className="hidden max-w-sm flex-1 md:block">
            <input
              type="search"
              placeholder="Search"
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#5b63ff]"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-slate-600 sm:block">{user.email}</p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Explore</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="rounded-lg bg-[#f4f6ff] px-3 py-2 text-[#3d4ed7]">Home feed</li>
                  <li className="rounded-lg px-3 py-2">Insights</li>
                  <li className="rounded-lg px-3 py-2">Find friends</li>
                  <li className="rounded-lg px-3 py-2">Bookmarks</li>
                </ul>
              </section>
            </div>
          </aside>

          <section className="lg:col-span-6">
            <div className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-base font-semibold">Create post</h2>
                <form action={createPost} className="space-y-3">
                  <textarea
                    name="content"
                    rows={4}
                    placeholder="Write something ..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#5b63ff]"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    />
                    <select
                      id="visibility"
                      name="visibility"
                      defaultValue="public"
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[#5b63ff] px-5 py-2 text-sm font-medium text-white hover:bg-[#4b53e6]"
                  >
                    Post
                  </button>
                </form>
              </article>

              {feedPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                  No posts yet. Create the first post.
                </div>
              ) : null}

              {feedPosts.map((post) => {
                const topLevelComments = post.comments
                  .filter((comment) => comment.parent_id === null)
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                const userLikedPost = post.likes.some((like) => like.user_id === user.id)

                return (
                  <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{getFullName(post.author, 'Unknown user')}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleString()} · {post.visibility}
                        </p>
                      </div>
                    </div>

                    {post.content ? <p className="mb-3 whitespace-pre-wrap text-sm text-slate-800">{post.content}</p> : null}
                    {post.image_url ? (
                      // Signed Supabase URLs are generated per request, so a plain img keeps this simple.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="mb-3 max-h-96 w-full rounded-xl border border-slate-200 object-contain"
                      />
                    ) : null}

                    <div className="mb-3 flex flex-wrap items-center gap-2 border-y border-slate-100 py-3">
                      <form action={togglePostLike}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                        >
                          {userLikedPost ? 'Unlike' : 'Like'} ({post.likes.length})
                        </button>
                      </form>
                      <p className="text-xs text-slate-500">Liked by: {likesSummary(post.likes)}</p>
                    </div>

                    <form action={createComment} className="mb-4 space-y-2 rounded-xl bg-slate-50 p-3">
                      <input type="hidden" name="postId" value={post.id} />
                      <textarea
                        name="content"
                        rows={2}
                        placeholder="Write a comment..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        required
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-white"
                      >
                        Comment
                      </button>
                    </form>

                    <div className="space-y-3">
                      {topLevelComments.map((comment) => {
                        const commentLikes = comment.likes ?? []
                        const userLikedComment = commentLikes.some((like) => like.user_id === user.id)

                        return (
                          <div key={comment.id} className="rounded-xl border border-slate-200 p-3">
                            <p className="text-sm font-semibold text-slate-800">{getFullName(comment.author, 'Unknown user')}</p>
                            <p className="mt-1 text-sm text-slate-700">{comment.content}</p>
                            <p className="mt-1 text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <form action={toggleCommentLike}>
                                <input type="hidden" name="commentId" value={comment.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                                >
                                  {userLikedComment ? 'Unlike' : 'Like'} ({commentLikes.length})
                                </button>
                              </form>
                              <p className="text-xs text-slate-500">Liked by: {likesSummary(commentLikes)}</p>
                            </div>

                            <form action={createComment} className="mt-3 space-y-2 rounded-lg bg-slate-50 p-2">
                              <input type="hidden" name="postId" value={post.id} />
                              <input type="hidden" name="parentId" value={comment.id} />
                              <textarea
                                name="content"
                                rows={2}
                                placeholder="Write a reply..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                required
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-white"
                              >
                                Reply
                              </button>
                            </form>

                            <div className="mt-3 ml-3 space-y-2">{renderReplies(post.comments, user.id, comment.id)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <aside className="hidden lg:col-span-3 lg:block">
            <div className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">You Might Like</h3>
                <p className="text-sm text-slate-500">Suggested people and widgets from the original feed layout.</p>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Your Friends</h3>
                <p className="text-sm text-slate-500">Friend list panel follows the right sidebar structure.</p>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

