'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<'email' | 'google' | null>(null)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setActiveAction('email')
    setError(null)

    if (!agreeToTerms) {
      setError('Please agree to terms and conditions')
      setActiveAction(null)
      return
    }

    const normalizedFirstName = firstName.trim()
    const normalizedLastName = lastName.trim()

    if (!normalizedFirstName || !normalizedLastName) {
      setError('First and last name are required')
      setActiveAction(null)
      return
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setActiveAction(null)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: normalizedFirstName,
            last_name: normalizedLastName,
          },
          emailRedirectTo: `${window.location.origin}/feed`,
        },
      })
      if (error) {
        setError(error.message)
        return
      }
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setActiveAction(null)
    }
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    setActiveAction('google')
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/feed`,
        },
      })

      if (error) {
        setError(error.message)
        setActiveAction(null)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setActiveAction(null)
    }
  }

  return (
    <section
      className={cn(
        'relative min-h-screen overflow-hidden bg-[#f4f5ff] px-4 py-8 sm:px-8 lg:px-12',
        className
      )}
      {...props}
    >
      <Image
        src="/auth/shape1.svg"
        alt=""
        width={208}
        height={208}
        className="pointer-events-none absolute left-0 top-0 hidden w-52 select-none lg:block"
      />
      <Image
        src="/auth/shape2.svg"
        alt=""
        width={224}
        height={224}
        className="pointer-events-none absolute right-0 top-0 hidden w-56 select-none lg:block"
      />
      <Image
        src="/auth/shape3.svg"
        alt=""
        width={192}
        height={192}
        className="pointer-events-none absolute bottom-0 left-1/3 hidden w-48 -translate-x-1/2 select-none lg:block"
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10">
        <div className="hidden flex-1 lg:block">
          <Image
            src="/auth/registration.png"
            alt="Registration illustration"
            width={720}
            height={620}
            className="mx-auto max-h-[620px] w-full max-w-3xl dark:hidden"
            priority
          />
          <Image
            src="/auth/registration1.png"
            alt="Registration illustration"
            width={720}
            height={620}
            className="mx-auto hidden max-h-[620px] w-full max-w-3xl dark:block"
            priority
          />
        </div>

        <div className="w-full lg:max-w-md">
          <div className="rounded-[32px] bg-white px-6 py-8 shadow-[0_25px_60px_rgba(54,52,112,0.14)] sm:px-8">
            <Image src="/auth/logo.svg" alt="Buddy Script" width={160} height={40} className="mb-6 h-10 w-auto" />

            <p className="mb-1 text-sm font-medium text-[#636783]">Get Started Now</p>
            <h1 className="mb-8 text-3xl font-semibold text-[#1b1d33]">Registration</h1>

            <Button
              type="button"
              variant="outline"
              className="mb-8 h-12 w-full justify-center gap-2 rounded-xl border-[#e3e6f4] text-[#2a2f45] hover:bg-[#f8f9ff]"
              onClick={handleGoogleSignUp}
              disabled={activeAction !== null}
            >
              <Image src="/auth/google.svg" alt="" width={20} height={20} className="h-5 w-5" />
              <span>{activeAction === 'google' ? 'Redirecting...' : 'Register with Google'}</span>
            </Button>

            <div className="mb-8 flex items-center gap-3 text-sm text-[#8b90a8]">
              <span className="h-px flex-1 bg-[#e6e8f3]" />
              <span>Or</span>
              <span className="h-px flex-1 bg-[#e6e8f3]" />
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-sm font-medium text-[#31354f]">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 rounded-xl border-[#dde1ef]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-sm font-medium text-[#31354f]">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 rounded-xl border-[#dde1ef]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#31354f]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-[#dde1ef]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#31354f]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-[#dde1ef]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat-password" className="text-sm font-medium text-[#31354f]">
                  Repeat Password
                </Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-11 rounded-xl border-[#dde1ef]"
                />
              </div>

              <label className="inline-flex items-center gap-2 pt-1 text-sm text-[#616783]">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cfd4e6] text-primary"
                />
                I agree to terms &amp; conditions
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="mt-5 h-12 w-full rounded-xl bg-[#5b63ff] text-white hover:bg-[#4f57eb]"
                disabled={activeAction !== null}
              >
                {activeAction === 'email' ? 'Creating account...' : 'Register now'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#636783]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#5b63ff] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
