'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock, User, ChevronDown, Loader2, GraduationCap, Building2, CheckCircle2 } from 'lucide-react'
import { api, apiCall } from '@/lib/api-config'
import Link from 'next/link'
import Image from 'next/image'


const DEPARTMENTS = {
  'College of Criminal Justice Education': ['Bachelor of Science in Criminology'],
  'College of Engineering and Technology': [
    'Bachelor of Science in Computer Engineering (BSCpE)',
    'Bachelor of Science in Electronics Engineering (BSECE)',
    'Bachelor of Science in Information Technology (BSIT)',
    'Bachelor of Library and Information Science (BLIS)',
  ],
  'College of Hospitality & Tourism Management': [
    'Bachelor of Science in Hospitality Management (BSHM)',
    'Bachelor of Science in Tourism Management (BSTM)',
  ],
  'College of Humanities, Social Sciences and Communication': [
    'Bachelor of Arts in Political Science (AB PolSci)',
    'Bachelor of Arts in Economics (AB Econ)',
    'Bachelor of Arts in History (AB History)',
    'Bachelor of Arts in Philosophy (AB Philosophy)',
    'BA Communication — Journalism & Broadcasting',
    'BA Communication — New Media Studies',
    'BA Communication — Social Communications',
    'Bachelor of Arts in English Language Studies (BA ELS)',
    'Bachelor of Science in Psychology (BS Psych)',
    'Bachelor of Science in Social Work (BSSW)',
  ],
  'College of Maritime Education': ['Bachelor of Science in Marine Transportation (BSMT)'],
  'School of Business & Management': [
    'Bachelor of Science in Accountancy (BSA)',
    'Bachelor of Science in Business Administration major in Financial Management (BSBA-FM)',
    'Bachelor of Science in Business Administration major in Human Resource Management (BSBA-HRM)',
    'Bachelor of Science in Business Administration major in Marketing Management (BSBA-MM)',
    'Bachelor of Science in Customs Administration (BSCA)',
    'Bachelor of Science in Management Accounting (BSMA)',
    'Bachelor of Science in Real Estate Management (BSREM)',
  ],
  'School of Teacher Education': [
    'Bachelor of Early Childhood Education (BECEd)',
    'Bachelor of Elementary Education (BEEd)',
    'Bachelor of Physical Education (BPEd)',
    'Bachelor of Secondary Education major in English',
    'Bachelor of Secondary Education major in Filipino',
    'Bachelor of Secondary Education major in Mathematics',
    'Bachelor of Secondary Education major in Science',
    'Bachelor of Secondary Education major in Social Studies',
    'Bachelor of Secondary Education major in Values Education with Catetics',
    'Bachelor of Special Needs Education – Generalist',
  ],
}

export default function SignUp() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    program: '',
  })
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  const [error, setError] = useState('')

  const departmentList = Object.keys(DEPARTMENTS)
  const programs = formData.department ? DEPARTMENTS[formData.department as keyof typeof DEPARTMENTS] : []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.department || !formData.program) {
      setError('Please select both department and program')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        program: formData.program,
      }

      // Build the correct URL - api.participants() returns URL with trailing slash
      const participantsBaseUrl = api.participants()
      const registerUrl = participantsBaseUrl.endsWith('/')
        ? `${participantsBaseUrl}register/`
        : `${participantsBaseUrl}/register/`

      console.log('[Signup] ========================================')
      console.log('[Signup] Registering new participant')
      console.log('[Signup] Name:', formData.name)
      console.log('[Signup] Email:', formData.email)
      console.log('[Signup] Department:', formData.department)
      console.log('[Signup] Program:', formData.program)
      console.log('[Signup] Register URL:', registerUrl)
      console.log('[Signup] Payload:', { name: formData.name, email: formData.email, password: '***' })

      const res = await apiCall.post(registerUrl, payload)
      console.log('[Signup] Response status:', res.status, res.statusText)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errorMessage = data.detail || data.error || 'Unable to create account.'

        if (errorMessage.toLowerCase().includes('already registered')) {
          console.log('[Signup] User already exists, suggesting sign-in.')
        } else {
          console.error('[Signup] Registration failed:', data)
        }

        setError(errorMessage)
        setIsLoading(false)
        return
      }

      const responseData = await res.json().catch(() => ({}))
      console.log('[Signup] ✅ Registration successful:', responseData)

      // Don't auto-login, redirect to signin page
      console.log('[Signup] Redirecting to signin page')
      router.push('/auth/signin')
    } catch (err) {
      setError('Network error while creating account.')
    } finally {
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
        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">

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
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h2>
            <p className="text-muted-foreground">
              Enter your details to register as a participant
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="firstname.lastname@hcdc.edu.ph"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Department</Label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground z-20 pointer-events-none group-focus-within:text-primary transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  className="w-full flex items-center justify-between pl-10 pr-3 h-11 bg-background border border-input rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <span className={`truncate ${formData.department ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formData.department || 'Select a department...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDepartmentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {departmentList.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, department: dept, program: '' }))
                          setShowDepartmentDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors text-sm border-b border-border/50 last:border-0 ${formData.department === dept ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                          }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={`text-foreground font-medium ${!formData.department ? 'opacity-50' : ''}`}>
                Program
              </Label>
              <div className="relative group">
                <GraduationCap className={`absolute left-3 top-3.5 w-5 h-5 text-muted-foreground z-20 pointer-events-none group-focus-within:text-primary transition-colors ${!formData.department ? 'opacity-50' : ''}`} />
                <button
                  type="button"
                  disabled={!formData.department}
                  onClick={() => setShowProgramDropdown(!showProgramDropdown)}
                  className={`w-full flex items-center justify-between pl-10 pr-3 h-11 bg-background border border-input rounded-md transition-all duration-200 ${formData.department
                    ? 'text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary'
                    : 'text-muted-foreground cursor-not-allowed opacity-50 bg-muted/50'
                    }`}
                >
                  <span className={`truncate text-sm ${formData.program ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formData.program || (formData.department ? 'Select a program...' : 'Select department first')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showProgramDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProgramDropdown && formData.department && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {programs.map((program) => (
                      <button
                        key={program}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, program }))
                          setShowProgramDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors text-sm border-b border-border/50 last:border-0 ${formData.program === program ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                          }`}
                      >
                        {program}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.department || !formData.program}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/auth/signin')}
              className="w-full h-11 font-semibold border-input hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Sign in
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
