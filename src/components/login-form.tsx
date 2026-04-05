'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/feed')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className={cn(
        'relative min-h-screen overflow-hidden bg-[#f4f5ff] px-4 py-8 transition-colors duration-300 sm:px-8 lg:px-12 dark:bg-[#07101f]',
        className
      )}
      {...props}
    >
      <Image
        src="/auth/shape1.svg"
        alt=""
        width={208}
        height={208}
        className="pointer-events-none absolute left-0 top-0 hidden w-52 select-none lg:block dark:opacity-60"
      />
      <Image
        src="/auth/shape2.svg"
        alt=""
        width={224}
        height={224}
        className="pointer-events-none absolute right-0 top-0 hidden w-56 select-none lg:block dark:opacity-60"
      />
      <Image
        src="/auth/shape3.svg"
        alt=""
        width={192}
        height={192}
        className="pointer-events-none absolute bottom-0 left-1/3 hidden w-48 -translate-x-1/2 select-none lg:block dark:opacity-60"
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10">
        <div className="hidden flex-1 lg:block">
          <Image
            src="/auth/login.png"
            alt="Login illustration"
            width={720}
            height={620}
            className="mx-auto max-h-155 w-full max-w-3xl"
            priority
          />
        </div>

        <div className="w-full lg:max-w-md">
          <div className="rounded-[32px] bg-white px-6 py-8 transition-colors duration-300 sm:px-8 dark:bg-slate-950">
            <Image src="/auth/logo.svg" alt="Buddy Script" width={160} height={40} className="mb-6 h-10 w-auto" />

            <p className="mb-1 text-sm font-medium text-[#636783] dark:text-slate-400">Welcome back</p>
            <h1 className="mb-8 text-3xl font-semibold text-[#1b1d33] dark:text-slate-100">Login to your account</h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#31354f] dark:text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#31354f] dark:text-slate-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                <label htmlFor="remember-me" className="inline-flex items-center gap-2 text-[#616783] dark:text-slate-400">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="border-[#cfd4e6] dark:border-slate-600"
                  />
                  Remember me
                </label>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="mt-5 h-12 w-full rounded-xl bg-[#5b63ff] text-white hover:bg-[#4f57eb]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login now'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#636783] dark:text-slate-400">
              Don&apos;t have an account?{' '}
                <Link href="/auth/sign-up" className="font-semibold text-[#5b63ff] hover:underline dark:text-sky-300">
                Create New Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
