import type { LikeWithProfile, Profile } from './feed-types'

export function getFullName(profile: Profile | null, fallback: string) {
  const first = profile?.first_name?.trim() ?? ''
  let last = profile?.last_name?.trim() ?? ''

  if (first && last) {
    const lowerFirst = first.toLowerCase()
    const lowerLast = last.toLowerCase()
    if (lowerLast === lowerFirst) {
      last = ''
    } else if (lowerLast.startsWith(`${lowerFirst} `)) {
      last = last.slice(first.length).trim()
    }
  }

  const name = `${first} ${last}`.trim()
  return name || fallback
}

export function getNameFallback(profile: Profile | null, fallback: string) {
  const email = profile?.email?.trim() ?? ''
  if (!email.includes('@')) {
    return fallback
  }

  const [localPart] = email.split('@')
  return localPart || fallback
}


export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function likesSummary(likes: LikeWithProfile[]) {
  if (likes.length === 0) {
    return 'No likes yet'
  }

  return likes.map((like) => getFullName(like.profile, like.user_id.slice(0, 8))).join(', ')
}


