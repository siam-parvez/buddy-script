'use client'

import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { AvatarChip } from './avatar-chip'

type FeedHeaderProps = {
  currentUserName: string
  currentUserAvatarUrl?: string | null
}

export function FeedHeader({ currentUserName, currentUserAvatarUrl }: FeedHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-30 shrink-0 border-b black/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/auth/logo.svg" alt="Buddy Script" width={140} height={36} className="h-9 w-auto" />
        </div>

        <div ref={menuRef} className="relative ml-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen((open) => !open)}
            className="h-auto rounded-full border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <AvatarChip name={currentUserName} avatarUrl={currentUserAvatarUrl} />
              <span className="max-w-36 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUserName}</span>
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
          </Button>

          {isOpen ? (
            <Card className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 p-2 dark:bg-slate-950">
              <ThemeToggle className="mb-2 w-full justify-between" />
              <div className="mb-2 h-px bg-slate-200 dark:bg-slate-800" />
              <LogoutButton variant="ghost" size="sm" className="w-full justify-start" />
            </Card>
          ) : null}
        </div>
      </div>
    </header>
  )
}



