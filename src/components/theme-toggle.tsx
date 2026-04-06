'use client'

import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'h-10 w-full justify-between border border-slate-200/70 bg-white px-3 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800',
        className
      )}
    >
      <span className="text-sm font-medium">Theme</span>

      <span className="relative flex items-center  transition-colors ">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center  text-primary shadow-sm transition-transform  dark:text-sky-300',
            isDark ? 'translate-x-6' : 'translate-x-0'
          )}
        >
          {isDark ? <MoonStar className="h-3.5 w-3.5" /> : <SunMedium className="h-3.5 w-3.5" />}
        </span>
      </span>

    </Button>
  )
}

