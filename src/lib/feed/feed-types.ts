export type Profile = {
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
}

export type LikeWithProfile = {
  user_id: string
  profile: Profile | null
}

export type PostRecord = {
  id: string
  author_id: string
  content: string
  image_path: string | null
  visibility: 'public' | 'private'
  created_at: string
  author: Profile | null
  likes: LikeWithProfile[] | null
}

export type CommentRecord = {
  id: string
  post_id: string
  parent_id: string | null
  content: string
  created_at: string
  author_id: string
  author: Profile | null
  likes: LikeWithProfile[] | null
}

export type FeedPost = PostRecord & {
  image_url: string | null
  likes: LikeWithProfile[]
  comments: CommentRecord[]
}


