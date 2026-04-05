'use client'

import { MoonStar, SunMedium } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-2.5 py-2 text-left backdrop-blur transition hover:scale-[1.01] hover:border-[#d8ddff] dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-slate-700',
        className
      )}
    >
      <span className="relative flex h-9 w-16 items-center rounded-full bg-[#e8ecff] p-1 transition-colors dark:bg-slate-700">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#5b63ff] transition-transform dark:bg-slate-950 dark:text-sky-300',
            isDark ? 'translate-x-7' : 'translate-x-0'
          )}
        >
          {isDark ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
        </span>
      </span>
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300 sm:block">
        {mounted ? (isDark ? 'Dark' : 'Light') : 'Theme'}
      </span>
    </button>
  )
}

