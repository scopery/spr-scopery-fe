'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { FaApple } from 'react-icons/fa'
import {
  Button,
  Input,
  Typography,
  Stack,
  Link as DesignLink,
  Divider,
} from '@/shared/ui'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuthActions'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils'
import Image from 'next/image'
import { ApiError } from '@/types/api'

function ScoperyLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex', className)} aria-label="Scopery">
      <Image
        src="/scopery_logo.svg"
        alt="Scopery"
        width={42}
        height={42}
        style={{ width: 'auto', height: 'auto', maxWidth: 42, maxHeight: 42 }}
      />
    </Link>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, login, bootstrapStatus } = useAuth()
  const { loginWithGoogle } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const errorDesc = searchParams.get('error_description')
    const errorCode = searchParams.get('error_code')
    if (errorCode || searchParams.get('error')) {
      const msg =
        errorCode === 'bad_oauth_callback'
          ? 'Google sign-in failed (state missing). Click "Continue with Google" again.'
          : errorDesc
            ? decodeURIComponent(errorDesc)
            : 'Sign-in failed. Please try again.'
      toast.error(msg)
      router.replace(ROUTES.auth.login)
    }
  }, [searchParams, router])

  useEffect(() => {
    if (bootstrapStatus === 'loading' || !session) return
    if (bootstrapStatus === 'ready') {
      router.replace('/')
    } else if (bootstrapStatus === 'needs_onboarding') {
      router.replace(ROUTES.onboarding)
    }
  }, [session, bootstrapStatus, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      return
    }
    if (!password) {
      setErrors({ password: 'Password is required' })
      return
    }
    setLoading(true)
    try {
      await login({ email: email.trim(), password })
      toast.success('Signed in successfully')
      const returnTo = searchParams.get('returnTo')
      window.location.href = returnTo && returnTo.startsWith('/') ? returnTo : '/'
    } catch (err) {
      const message =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Login failed'
      setErrors({ form: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full min-h-screen lg:w-1/2 xl:w-1/2 flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10 xl:p-14">
        <div className="w-full max-w-[400px]">
          <ScoperyLogo className="mb-10" />

          <Typography as="h1" className="text-neutral-900 text-2xl xl:text-3xl font-calsans font-bold mb-2">
            Welcome back!
          </Typography>
          <Typography tone="muted" className="mb-8 text-sm leading-relaxed">
            Log in to continue crafting precise, traceable, and stakeholder ready requirements.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack direction="vertical" spacing="md">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="Enter your email"
                fullWidth
                autoComplete="email"
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-sm font-normal text-neutral-700 cursor-pointer">Password</label>
                  <DesignLink as={Link} href="/auth/forgot-password" className="text-sm font-normal text-primary">
                    Forgot Password?
                  </DesignLink>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  placeholder="Enter Password"
                  fullWidth
                  autoComplete="current-password"
                  prefix={<Lock size={18} className="text-neutral-400 shrink-0" />}
                  postfix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              {errors.form && (
                <Typography variant="small" tone="error" role="alert">
                  {errors.form}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!email.trim() || !password}
                className="text-white border-0 h-12 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(to right, #000000, #001F6D, #0787E2)' }}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <div className="relative flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-neutral-600 text-sm">OR</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <Stack direction="vertical" spacing="sm">
            <button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle()
                } catch (e) {
                  const msg = e instanceof ApiError ? e.problem.detail : e instanceof Error ? e.message : 'Google sign-in failed'
                  const isProviderDisabled = /provider|not enabled/i.test(msg)
                  toast.error(isProviderDisabled ? 'Google sign-in is not enabled yet. Please use email and password.' : msg)
                }
              }}
              className="w-full h-12 text-sm border border-neutral-300 bg-white flex items-center justify-center gap-3 text-black font-normal hover:bg-neutral-50 transition-colors"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => toast.info('Apple sign-in coming soon')}
              className="w-full h-12 text-sm border border-neutral-300 bg-white flex items-center justify-center gap-3 text-black font-normal hover:bg-neutral-50 transition-colors"
              aria-label="Continue with Apple"
            >
              <FaApple className="w-5 h-5 text-neutral-900" aria-hidden />
              Continue with Apple
            </button>
          </Stack>

          <Typography as="p" variant="small" tone="muted" className="mt-8 text-center">
            Don&apos;t have an Account?{' '}
            <DesignLink as={Link} href={ROUTES.auth.register} className="font-normal text-primary text-sm">
              Sign Up
            </DesignLink>
          </Typography>
        </div>
      </div>

      {/* Right: teal panel — heading, quote, testimonial, mission tags */}
      <aside className="hidden lg:flex lg:flex-1 relative min-h-[40vh] lg:min-h-screen overflow-hidden">
        <Image src="/auth_bg.jpg" alt="Scopery" width={1000} height={1000} className="absolute inset-0" />
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="cable-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
            </defs>
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={-20 + i * 25}
                y1={-10}
                x2={120 + i * 25}
                y2={110}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="24"
                filter="url(#cable-blur)"
              />
            ))}
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <Typography as="h2" className="text-white text-3xl xl:text-4xl font-calsans font-bold leading-tight mb-6">
              Revolutionize Document Creation with Smarter Automation.
            </Typography>
            <div className="text-white/90 text-5xl xl:text-6xl font-serif leading-none mb-4 select-none" aria-hidden>
              <Image src="/illustrations/quote.svg" alt="quote" width={50} height={50} />
            </div>
            <Typography as="p" className="text-white text-lg xl:text-xl leading-relaxed mb-8 font-questrial">
              From vague stakeholder ideas to fully traceable, signed-off specifications. Faster
              execution. Cleaner structure. Zero compromise on quality or precision.
            </Typography>
            <div className="flex items-center gap-4">
              <div className="border border-white/40 !bg-white/20 text-white text-sm text-center backdrop-blur-xs h-11 w-11 rounded-full" />
              <div>
                <Typography as="p" className="text-white font-medium font-calsans text-base">
                  Iris Nguyen
                </Typography>
                <Typography as="p" className="text-white/80 text-sm font-questrial">
                  Business Analyst at Archetype Group
                </Typography>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <Divider className="border-white/50 mb-4" />
            <Typography as="p" className="text-white text-xs uppercase tracking-widest mb-4">
              Mission
            </Typography>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:gap-3">
              {['Traceability', 'Consistency', 'Clarity', 'Speed', 'Structure', 'Precision', 'Alignment', 'Audit'].map((label) => (
                <span
                  key={label}
                  className="py-2.5 px-3 xl:py-3 xl:px-4 border border-white/40 bg-white/10 text-white text-sm text-center backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  )
}
