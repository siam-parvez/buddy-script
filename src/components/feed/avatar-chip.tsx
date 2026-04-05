import { User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/feed/feed-utils'

export function AvatarChip({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md'
}) {
  const resolvedAvatarUrl = avatarUrl?.trim() ?? ''
  const initials = getInitials(name) || 'U'
  const dimensions = size === 'xs' ? 'h-6 w-6' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'

  return (
    <Avatar className={`${dimensions} flex-none ring-2 ring-white dark:ring-slate-950`} title={initials}>
      {resolvedAvatarUrl ? <AvatarImage src={resolvedAvatarUrl} alt={name} /> : null}
      <AvatarFallback>
        <User className={size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      </AvatarFallback>
    </Avatar>
  )
}



