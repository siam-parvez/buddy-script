'use server'

import type { User } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/server'

type Visibility = 'public' | 'private'

function readMetaString(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

async function ensureProfileRow(supabase: Awaited<ReturnType<typeof createClient>>, user: User) {
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileLookupError) {
    throw new Error(profileLookupError.message)
  }

  if (existingProfile) {
    return
  }

  const email = user.email?.trim()
  if (!email) {
    throw new Error('Authenticated user email is missing')
  }

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      first_name: readMetaString(user, 'first_name'),
      last_name: readMetaString(user, 'last_name'),
      email,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    throw new Error(upsertError.message)
  }
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  await ensureProfileRow(supabase, user)

  return { supabase, user }
}

function sanitizeVisibility(value: FormDataEntryValue | null): Visibility {
  if (value === 'private') {
    return 'private'
  }

  return 'public'
}

export async function createPost(formData: FormData) {
  const { supabase, user } = await requireUser()

  const content = String(formData.get('content') ?? '').trim()
  const visibility = sanitizeVisibility(formData.get('visibility'))
  const imageValue = formData.get('image')

  let imagePath: string | null = null

  if (imageValue instanceof File && imageValue.size > 0) {
    if (!imageValue.type.startsWith('image/')) {
      throw new Error('Only image uploads are supported')
    }

    if (imageValue.size > 5 * 1024 * 1024) {
      throw new Error('Image must be smaller than 5MB')
    }

    const extension = imageValue.name.split('.').pop()?.toLowerCase() ?? 'bin'
    imagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(imagePath, imageValue, {
        contentType: imageValue.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }
  }

  if (!content && !imagePath) {
    throw new Error('Write something or attach an image')
  }

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    content,
    image_path: imagePath,
    visibility,
  })

  if (error) {
    if (imagePath) {
      await supabase.storage.from('post-images').remove([imagePath])
    }
    throw new Error(error.message)
  }

  revalidatePath('/feed')
}

export async function togglePostLike(formData: FormData) {
  const { supabase, user } = await requireUser()
  const postId = String(formData.get('postId') ?? '')

  if (!postId) {
    throw new Error('Invalid post id')
  }

  const { data: existingLike, error: fetchError } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (existingLike) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: user.id,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath('/feed')
}

export async function createComment(formData: FormData) {
  const { supabase, user } = await requireUser()

  const postId = String(formData.get('postId') ?? '')
  const parentId = String(formData.get('parentId') ?? '')
  const content = String(formData.get('content') ?? '').trim()

  if (!postId || !content) {
    throw new Error('Comment content is required')
  }

  if (parentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from('comments')
      .select('id, post_id')
      .eq('id', parentId)
      .maybeSingle()

    if (parentError) {
      throw new Error(parentError.message)
    }

    if (!parentComment || parentComment.post_id !== postId) {
      throw new Error('Invalid reply target')
    }
  }

  const payload: {
    post_id: string
    author_id: string
    content: string
    parent_id?: string
  } = {
    post_id: postId,
    author_id: user.id,
    content,
  }

  if (parentId) {
    payload.parent_id = parentId
  }

  const { error } = await supabase.from('comments').insert(payload)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/feed')
}

export async function toggleCommentLike(formData: FormData) {
  const { supabase, user } = await requireUser()
  const commentId = String(formData.get('commentId') ?? '')

  if (!commentId) {
    throw new Error('Invalid comment id')
  }

  const { data: existingLike, error: fetchError } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (existingLike) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    const { error } = await supabase.from('comment_likes').insert({
      comment_id: commentId,
      user_id: user.id,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath('/feed')
}
