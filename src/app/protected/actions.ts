'use server'

import type { User } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/server'

type Visibility = 'public' | 'private'

function readMetaString(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function pickFirstNonEmpty(...values: string[]) {
  return values.find((value) => value.trim().length > 0)?.trim() ?? ''
}

function splitName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  const lastName = parts.pop() ?? ''
  return { firstName: parts.join(' '), lastName }
}

function normalizeNameParts(firstName: string, lastName: string) {
  const first = firstName.trim()
  let last = lastName.trim()

  if (!first && !last) {
    return { firstName: '', lastName: '' }
  }

  if (!first && last) {
    const split = splitName(last)
    return { firstName: split.firstName, lastName: split.lastName }
  }

  if (first && last) {
    const lowerFirst = first.toLowerCase()
    const lowerLast = last.toLowerCase()
    if (lowerLast === lowerFirst) {
      last = ''
    } else if (lowerLast.startsWith(`${lowerFirst} `)) {
      last = last.slice(first.length).trim()
    }
  }

  return { firstName: first, lastName: last }
}

function getProfileFieldsFromMetadata(user: User) {
  const fullName = pickFirstNonEmpty(readMetaString(user, 'name'), readMetaString(user, 'full_name'))
  const parsedFullName = splitName(fullName)

  const firstName = pickFirstNonEmpty(
    readMetaString(user, 'first_name'),
    readMetaString(user, 'given_name'),
    parsedFullName.firstName
  )
  const lastName = pickFirstNonEmpty(
    readMetaString(user, 'last_name'),
    readMetaString(user, 'family_name'),
    parsedFullName.lastName
  )
  const avatarUrl = pickFirstNonEmpty(readMetaString(user, 'avatar_url'), readMetaString(user, 'picture'))

  const normalizedName = normalizeNameParts(firstName, lastName)

  return { firstName: normalizedName.firstName, lastName: normalizedName.lastName, avatarUrl }
}

async function ensureProfileRow(supabase: Awaited<ReturnType<typeof createClient>>, user: User) {
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id,first_name,last_name,email,avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (profileLookupError) {
    throw new Error(profileLookupError.message)
  }

  const email = user.email?.trim()
  if (!email) {
    throw new Error('Authenticated user email is missing')
  }

  const profileFromMetadata = getProfileFieldsFromMetadata(user)

  if (existingProfile) {
    const normalizedExistingName = normalizeNameParts(existingProfile.first_name ?? '', existingProfile.last_name ?? '')
    const hasMalformedName =
      normalizedExistingName.firstName !== (existingProfile.first_name ?? '').trim() ||
      normalizedExistingName.lastName !== (existingProfile.last_name ?? '').trim()
    const shouldUpdateName = !existingProfile.first_name?.trim() && !existingProfile.last_name?.trim()
    const shouldUpdateAvatar = !existingProfile.avatar_url?.trim() && !!profileFromMetadata.avatarUrl
    const shouldUpdateEmail = existingProfile.email?.trim() !== email

    const nextFirstName = shouldUpdateName ? profileFromMetadata.firstName : normalizedExistingName.firstName
    const nextLastName = shouldUpdateName ? profileFromMetadata.lastName : normalizedExistingName.lastName

    if (!shouldUpdateName && !shouldUpdateAvatar && !shouldUpdateEmail && !hasMalformedName) {
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: nextFirstName,
        last_name: nextLastName,
        avatar_url: shouldUpdateAvatar ? profileFromMetadata.avatarUrl : existingProfile.avatar_url,
        email,
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return
  }

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      first_name: profileFromMetadata.firstName,
      last_name: profileFromMetadata.lastName,
      avatar_url: profileFromMetadata.avatarUrl,
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

export async function deletePost(formData: FormData) {
  const { supabase, user } = await requireUser()
  const postId = String(formData.get('postId') ?? '').trim()

  if (!postId) {
    throw new Error('Invalid post id')
  }

  const { data: post, error: postLookupError } = await supabase
    .from('posts')
    .select('id,author_id,image_path')
    .eq('id', postId)
    .maybeSingle()

  if (postLookupError) {
    throw new Error(postLookupError.message)
  }

  if (!post || post.author_id !== user.id) {
    throw new Error('You can only delete your own posts')
  }

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (post.image_path?.startsWith(`${user.id}/`)) {
    const { error: storageDeleteError } = await supabase.storage.from('post-images').remove([post.image_path])
    if (storageDeleteError) {
      // Keep deletion successful even if blob cleanup fails.
      console.error(`Failed to remove post image '${post.image_path}': ${storageDeleteError.message}`)
    }
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
