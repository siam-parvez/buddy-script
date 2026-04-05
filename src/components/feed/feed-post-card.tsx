'use client'

import { Globe, Heart, LockKeyhole, MessageSquareReply, Send, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import { createComment, deletePost, toggleCommentLike, togglePostLike } from '@/app/protected/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { CommentRecord, FeedPost } from '@/lib/feed/feed-types'
import { getFullName, getNameFallback, likesSummary } from '@/lib/feed/feed-utils'

import { AvatarChip } from './avatar-chip'

type FeedPostCardProps = {
  post: FeedPost
  userId: string
}

type LikeTarget =
  | { type: 'post'; id: string }
  | { type: 'comment'; id: string }

function LikeActionButton({
  target,
  initiallyLiked,
  initialCount,
}: {
  target: LikeTarget
  initiallyLiked: boolean
  initialCount: number
}) {
  const [liked, setLiked] = useState(initiallyLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  const toggleLike = () => {
    const nextLiked = !liked
    const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1)
    setLiked(nextLiked)
    setCount(nextCount)

    startTransition(async () => {
      try {
        const formData = new FormData()
        if (target.type === 'post') {
          formData.set('postId', target.id)
          await togglePostLike(formData)
        } else {
          formData.set('commentId', target.id)
          await toggleCommentLike(formData)
        }
      } catch {
        // Revert optimistic state if mutation fails.
        setLiked((previous) => !previous)
        setCount((previous) => (nextLiked ? Math.max(0, previous - 1) : previous + 1))
      }
    })
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      disabled={isPending}
      onClick={toggleLike}
      className="gap-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Heart className="h-3.5 w-3.5" />
      {liked ? 'Unlike' : 'Like'} ({count})
    </Button>
  )
}

function ReplyList({
  comments,
  userId,
  parentId,
}: {
  comments: CommentRecord[]
  userId: string
  parentId: string
}) {
  const replies = comments
    .filter((comment) => comment.parent_id === parentId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return replies.map((reply) => {
    const replyLikes = reply.likes ?? []
    const userLikedReply = replyLikes.some((like) => like.user_id === userId)
    const replyName = getFullName(reply.author, getNameFallback(reply.author, 'Unknown user'))

    return (
      <div
        key={reply.id}
        className="rounded-[22px] border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/60"
      >
        <div className="flex items-start gap-3">
          <AvatarChip name={replyName} avatarUrl={reply.author?.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{replyName}</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{reply.content}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(reply.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <LikeActionButton
            target={{ type: 'comment', id: reply.id }}
            initiallyLiked={userLikedReply}
            initialCount={replyLikes.length}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Liked by: {likesSummary(replyLikes)}</p>
        </div>
      </div>
    )
  })
}

function LikeAvatarStack({
  likes,
  maxVisible = 5,
}: {
  likes: FeedPost['likes']
  maxVisible?: number
}) {
  if (likes.length === 0) {
    return null
  }

  const visibleLikes = likes.slice(0, maxVisible)
  const hiddenCount = likes.length - visibleLikes.length

  return (
    <div className="flex items-center">
      {visibleLikes.map((like, index) => {
        const name = getFullName(like.profile, like.user_id.slice(0, 8))

        return (
          <span key={`${like.user_id}-${index}`} className={index === 0 ? '' : '-ml-2'}>
            <AvatarChip name={name} avatarUrl={like.profile?.avatar_url} size="xs" />
          </span>
        )
      })}

      {hiddenCount > 0 ? (
        <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">+{hiddenCount}</span>
      ) : null}
    </div>
  )
}

export function FeedPostCard({ post, userId }: FeedPostCardProps) {
  const topLevelComments = post.comments
    .filter((comment) => comment.parent_id === null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const userLikedPost = post.likes.some((like) => like.user_id === userId)
  const isOwner = post.author_id === userId
  const postAuthorName = getFullName(post.author, getNameFallback(post.author, 'Unknown user'))

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarChip name={postAuthorName} avatarUrl={post.author?.avatar_url} />
          <div>
            <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{postAuthorName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" className="gap-2 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {post.visibility === 'public' ? <Globe className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
            {post.visibility === 'public' ? 'Public' : 'Private'}
          </Badge>

          {isOwner ? (
            <form action={deletePost}>
              <input type="hidden" name="postId" value={post.id} />
              <Button
                type="submit"
                variant="destructive"
                size="xs"
                className="gap-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {post.content ? <p className="mb-3 whitespace-pre-wrap text-[15px] leading-6 text-slate-800 dark:text-slate-200">{post.content}</p> : null}
      {post.image_url ? (
        // Signed Supabase URLs are generated per request, so a plain img keeps this simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt="Post image"
          className="mb-4 max-h-128 w-full rounded-[18px] border border-slate-200 object-cover dark:border-slate-800"
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 border-y border-slate-100 py-3 dark:border-slate-800">
        <LikeActionButton target={{ type: 'post', id: post.id }} initiallyLiked={userLikedPost} initialCount={post.likes.length} />
        <LikeAvatarStack likes={post.likes} />
        <p className="text-xs text-slate-500 dark:text-slate-400">Liked by: {likesSummary(post.likes)}</p>
      </div>

      <form action={createComment} className="mb-4 space-y-2 rounded-[18px] bg-slate-50 p-3 dark:bg-slate-900/70">
        <input type="hidden" name="postId" value={post.id} />
        <Textarea
          name="content"
          rows={2}
          placeholder="Write a comment..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1877f2] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          required
        />
        <Button
          type="submit"
          variant="secondary"
          size="xs"
          className="gap-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <MessageSquareReply className="h-3.5 w-3.5" />
          Comment
        </Button>
      </form>

      <div className="space-y-3">
        {topLevelComments.map((comment) => {
          const commentLikes = comment.likes ?? []
          const userLikedComment = commentLikes.some((like) => like.user_id === userId)
          const commentAuthorName = getFullName(comment.author, getNameFallback(comment.author, 'Unknown user'))

          return (
            <div
              key={comment.id}
              className="rounded-[18px] border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="flex items-start gap-3">
                <AvatarChip name={commentAuthorName} avatarUrl={comment.author?.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{commentAuthorName}</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{comment.content}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <LikeActionButton
                  target={{ type: 'comment', id: comment.id }}
                  initiallyLiked={userLikedComment}
                  initialCount={commentLikes.length}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Liked by: {likesSummary(commentLikes)}</p>
              </div>

              <form action={createComment} className="mt-3 space-y-2 rounded-[18px] bg-slate-50 p-2 dark:bg-slate-900/70">
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="parentId" value={comment.id} />
                <Textarea
                  name="content"
                  rows={2}
                  placeholder="Write a reply..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1877f2] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="xs"
                  className="gap-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  Reply
                </Button>
              </form>

              <div className="mt-3 ml-3 space-y-2">
                <ReplyList comments={post.comments} userId={userId} parentId={comment.id} />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}



