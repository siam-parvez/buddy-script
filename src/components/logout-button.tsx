'use client'

import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'

type LogoutButtonProps = {
  className?: string
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
}

export function LogoutButton({ className, variant = 'default', size = 'default' }: LogoutButtonProps) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button onClick={logout} className={className} variant={variant} size={size}>
      Logout
    </Button>
  )
}
