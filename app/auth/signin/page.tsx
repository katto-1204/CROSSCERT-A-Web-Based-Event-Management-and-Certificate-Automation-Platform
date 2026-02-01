'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { authApi, apiRequest } from '@/lib/api-config'
import Link from 'next/link'
import Image from 'next/image'

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Initialize CSRF token on component mount
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        await apiRequest(authApi.csrfToken(), {
          method: 'GET',
        })
      } catch (err) {
        console.error('Failed to initialize CSRF token:', err)
      }
    }

    initializeCsrf()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Send login request to Django backend
      const response = await apiRequest(authApi.login(), {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.detail === 'No active account found with the given credentials') {
          setError('User doesn\'t exist. Create an account first.')
          setIsLoading(false)
          return
        }
        setError(data.error || data.detail || 'Login failed')
        setIsLoading(false)
        return
      }

      // Clear inputs immediately after success
      setEmail('')
      setPassword('')

      // Store minimal user info in localStorage (only for session management)
      localStorage.setItem('userEmail', data.user.email)
      localStorage.setItem('userId', data.user.id.toString())
      localStorage.setItem('isStaff', data.user.is_staff.toString())

      // Determine role based on is_staff flag
      const userRole = data.user.is_staff ? 'admin' : 'participant'
      localStorage.setItem('userRole', userRole)

      // Note: User profile data (name, department, program) is now fetched from API
      // when needed, not stored in localStorage

      // Redirect based on role
      if (userRole === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/participant/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Branding / Visual */}
      <div className="hidden lg:flex w-1/2 bg-[#8B0000] relative overflow-hidden items-center justify-center p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600 via-[#8B0000] to-[rgb(50,0,0)] opacity-90"></div>

        {/* HCDC Logo Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <Image
            src="/hcdc white.png"
            alt="HCDC Logo"
            width={800}
            height={800}
            className="object-contain scale-125"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-8">
            <Image
              src="/crosscert-typo-white.png"
              alt="CROSSCERT"
              width={300}
              height={80}
              className="object-contain h-20 w-auto"
              priority
            />
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Seamless Event Management & Certification
          </h2>
          <p className="text-lg text-red-100/90 leading-relaxed theme-transition">
            The premier platform for HCDC academic events. Manage participants, verify certificates, and streamline your workflow with enterprise-grade security.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
              <h3 className="font-bold text-xl mb-1">Secure</h3>
              <p className="text-sm text-red-100/70">Enterprise-grade security for your data.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
              <h3 className="font-bold text-xl mb-1">Fast</h3>
              <p className="text-sm text-red-100/70">Real-time validation and processing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background dark:bg-slate-950 transition-colors duration-300">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">

          {/* Mobile Header (only visible on small screens) */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">CROSSCERT</h1>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back
            </button>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="firstname.lastname@hcdc.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  New to CROSSCERT?
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/auth/signup')}
              className="w-full h-11 font-semibold border-input hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Create an account
            </Button>
          </form>

          <div className="pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CROSSCERT. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}