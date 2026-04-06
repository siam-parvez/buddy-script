import * as React from 'react'

import { cn } from '@/lib/utils'

function Avatar({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar"
      className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

function AvatarImage({ className, alt, ...props }: React.ComponentProps<'img'>) {
  // Avatar images can come from arbitrary remote URLs, so this primitive intentionally uses a native img element.
  // eslint-disable-next-line @next/next/no-img-element
  return <img data-slot="avatar-image" alt={alt ?? ''} className={cn('h-full w-full object-cover', className)} {...props} />
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground', className)}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }

