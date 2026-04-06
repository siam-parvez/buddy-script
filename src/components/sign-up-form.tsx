'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { signUpSchema } from '@/lib/validation/forms'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [isCredentialSubmitting, setIsCredentialSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCredentialSubmitting(true)
    setError(null)

    const parsed = signUpSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      repeatPassword,
      agreeToTerms,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid registration input')
      setIsCredentialSubmitting(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            first_name: parsed.data.firstName,
            last_name: parsed.data.lastName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      if (error) {
        setError(error.message)
        return
      }

      router.push('/')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsCredentialSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    setIsGoogleSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth?next=/`,
        },
      })

      if (error) {
        setError(error.message)
        setIsGoogleSubmitting(false)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsGoogleSubmitting(false)
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
        style={{ height: 'auto' }}
      />
      <Image
        src="/auth/shape2.svg"
        alt=""
        width={224}
        height={224}
        className="pointer-events-none absolute right-0 top-0 hidden w-56 select-none lg:block dark:opacity-60"
        style={{ height: 'auto' }}
      />
      <Image
        src="/auth/shape3.svg"
        alt=""
        width={192}
        height={192}
        className="pointer-events-none absolute bottom-0 left-1/3 hidden w-48 -translate-x-1/2 select-none lg:block dark:opacity-60"
        style={{ height: 'auto' }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10">
        <div className="hidden flex-1 lg:block">
          <Image
            src="/auth/registration.png"
            alt="Registration illustration"
            width={720}
            height={620}
            className="mx-auto max-h-155 w-full max-w-3xl dark:hidden"
            style={{ height: 'auto' }}
            priority
          />
          <Image
            src="/auth/registration1.png"
            alt="Registration illustration"
            width={720}
            height={620}
            className="mx-auto hidden max-h-155 w-full max-w-3xl dark:block"
            style={{ height: 'auto' }}
            priority
          />
        </div>

        <div className="w-full lg:max-w-md">
          <div className="rounded-[32px] bg-white px-6 py-8 transition-colors duration-300 sm:px-8 dark:bg-slate-950">
            <Image
              src="/auth/logo.svg"
              alt="Buddy Script"
              width={160}
              height={40}
              className="mb-6 h-10 w-auto"
              style={{ width: 'auto' }}
            />

            <p className="mb-1 text-sm font-medium text-[#636783] dark:text-slate-400">Get Started Now</p>
            <h1 className="mb-8 text-3xl font-semibold text-[#1b1d33] dark:text-slate-100">Registration</h1>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              className="mb-6 h-12 w-full border-[#dde1ef] bg-transparent text-[#31354f] hover:bg-[#f5f7ff] dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
              disabled={isCredentialSubmitting || isGoogleSubmitting}
            >
              <Image src="/auth/google.svg" alt="Google" width={16} height={16} className="mr-2 h-4 w-4" />
              {isGoogleSubmitting ? 'Connecting...' : 'Register with Google'}
            </Button>

            <div className="mb-6 text-center text-sm text-[#636783] dark:text-slate-400">
              <span>Or</span>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-sm font-medium text-[#31354f] dark:text-slate-200">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-sm font-medium text-[#31354f] dark:text-slate-200">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

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
                  className="h-11 border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
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
                  className="h-11 border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat-password" className="text-sm font-medium text-[#31354f] dark:text-slate-200">
                  Repeat Password
                </Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-11 border-[#dde1ef] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <label htmlFor="agree-terms" className="inline-flex items-center gap-2 pt-1 text-sm text-[#616783] dark:text-slate-400">
                <Checkbox
                  id="agree-terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="border-[#cfd4e6] dark:border-slate-600"
                />
                I agree to terms &amp; conditions
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="mt-5 h-12 w-full text-white "
                disabled={isCredentialSubmitting || isGoogleSubmitting}
              >
                {isCredentialSubmitting ? 'Creating account...' : 'Register now'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#636783] dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline dark:text-sky-300">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
