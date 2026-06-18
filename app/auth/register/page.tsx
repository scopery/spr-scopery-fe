'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'
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

function passwordStrength(password: string): 'weak' | 'medium' | 'strong' | null {
  if (!password) return null
  if (password.length < 8) return 'weak'
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  if (score >= 3 && password.length >= 10) return 'strong'
  if (score >= 2 || password.length >= 8) return 'medium'
  return 'weak'
}

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

export default function RegisterPage() {
  const router = useRouter()
  const { session, register: doRegister, bootstrapStatus } = useAuth()
  const { loginWithGoogle } = useAuthActions()
  const [showEmailPasswordForm, setShowEmailPasswordForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (bootstrapStatus === 'loading' || !session) return
    if (bootstrapStatus === 'ready') {
      router.replace('/')
    } else if (bootstrapStatus === 'needs_onboarding') {
      router.replace(ROUTES.onboarding)
    }
  }, [session, bootstrapStatus, router])

  const strength = passwordStrength(password)
  const strengthHint =
    strength === 'weak' && password ? 'Use at least 8 characters' : strength === 'medium' ? 'Good' : strength === 'strong' ? 'Strong' : null

  const validate = () => {
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Invalid email'
    if (password.length < 8) next.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    const name = fullName.trim()
    if (name.length < 1 || name.length > 255) next.fullName = 'Full name must be 1–255 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || loading) return
    setLoading(true)
    setErrors({})
    try {
      await doRegister({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      })
      toast.success('Account created successfully')
      window.location.href = '/'
    } catch (err) {
      const message = err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Registration failed'
      setErrors({ form: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const invalid =
    !email.trim() ||
    password.length < 8 ||
    password !== confirmPassword ||
    fullName.trim().length < 1 ||
    fullName.trim().length > 255

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full min-h-screen lg:w-1/2 xl:w-1/2 flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10 xl:p-14">
        <div className="w-full max-w-[400px]">
          <ScoperyLogo className="mb-10" />

          <Typography as="h1" className="text-neutral-900 text-2xl xl:text-3xl font-calsans font-bold mb-2">
            Create account
          </Typography>
          <Typography tone="muted" className="mb-8 text-sm leading-relaxed">
            Get started and join teams crafting precise, traceable requirements.
          </Typography>

          {!showEmailPasswordForm ? (
            <>
              <Stack direction="vertical" spacing="sm">
                <Button
                  type="button"
                  fullWidth
                  onClick={() => setShowEmailPasswordForm(true)}
                  className="bg-gradient-to-r from-[#0a1121] to-primary text-white border-0 h-12 hover:opacity-95"
                  style={{ background: 'linear-gradient(to right, #000000, #001F6D, #0787E2)' }}
                >
                  Sign up with Email & Password
                </Button>
              </Stack>

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
                      toast.error(msg)
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
              </Stack>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowEmailPasswordForm(false)}
                className="text-sm text-neutral-600 hover:text-neutral-900 mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
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
                  <Input
                    label="Full name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                    placeholder="1–255 characters"
                    fullWidth
                    autoComplete="name"
                  />
                  <div>
                    <div className="mb-2">
                      <label className="text-sm font-normal text-neutral-700">Password</label>
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                      placeholder="At least 8 characters"
                      fullWidth
                      autoComplete="new-password"
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
                    {strengthHint && (
                      <Typography variant="small" tone="muted" className="mt-1">
                        {strengthHint}
                      </Typography>
                    )}
                    {strength && (
                      <div className="mt-1 flex gap-1">
                        <span
                          className={cn(
                            'h-1 flex-1 rounded',
                            strength === 'weak' && 'bg-error',
                            strength === 'medium' && 'bg-warning',
                            strength === 'strong' && 'bg-success'
                          )}
                        />
                        <span
                          className={cn(
                            'h-1 flex-1 rounded',
                            strength !== 'weak' && (strength === 'medium' ? 'bg-warning' : 'bg-success'),
                            strength === 'weak' && 'bg-neutral-200'
                          )}
                        />
                        <span className={cn('h-1 flex-1 rounded', strength === 'strong' ? 'bg-success' : 'bg-neutral-200')} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-normal text-neutral-700 mb-2 block">Confirm password</label>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                      placeholder="Confirm your password"
                      fullWidth
                      autoComplete="new-password"
                      prefix={<Lock size={18} className="text-neutral-400 shrink-0" />}
                      postfix={
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          className="text-neutral-400 hover:text-neutral-600"
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    disabled={invalid}
                    className="text-white border-0 h-12 transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #000000, #001F6D, #0787E2)' }}
                  >
                    Create account
                  </Button>
                </Stack>
              </form>
            </>
          )}

          <Typography as="p" variant="small" tone="muted" className="mt-8 text-center">
            Already have an account?{' '}
            <DesignLink as={Link} href={ROUTES.auth.login} className="font-normal text-primary text-sm">
              Sign In
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
