'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock, Loader2, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { authApi, apiRequest } from '@/lib/api-config'
import Image from 'next/image'

type Step = 'email' | 'otp' | 'password'

export default function ForgotPassword() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('email')
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await apiRequest(authApi.forgotPassword(), {
                method: 'POST',
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to send OTP')
                setIsLoading(false)
                return
            }

            setSuccess('OTP has been sent to your email!')
            setStep('otp')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setIsLoading(true)

        try {
            const response = await apiRequest(authApi.verifyOtp(), {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Invalid OTP')
                setIsLoading(false)
                return
            }

            setResetToken(data.reset_token)
            setSuccess('OTP verified successfully!')
            setStep('password')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long')
            return
        }

        setIsLoading(true)

        try {
            const response = await apiRequest(authApi.resetPassword(), {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    reset_token: resetToken,
                    new_password: newPassword,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to reset password')
                setIsLoading(false)
                return
            }

            setSuccess('Password reset successfully! Redirecting to login...')
            setTimeout(() => {
                router.push('/auth/signin')
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const getStepTitle = () => {
        switch (step) {
            case 'email':
                return 'Forgot Password'
            case 'otp':
                return 'Verify OTP'
            case 'password':
                return 'Reset Password'
        }
    }

    const getStepDescription = () => {
        switch (step) {
            case 'email':
                return 'Enter your email address to receive a verification code'
            case 'otp':
                return 'Enter the 6-digit code sent to your email'
            case 'password':
                return 'Create a new password for your account'
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
                        Account Recovery
                    </h2>
                    <p className="text-lg text-red-100/90 leading-relaxed theme-transition">
                        Don&apos;t worry! We&apos;ll help you reset your password. Just enter your registered email and follow the steps.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className={`p-4 rounded-xl backdrop-blur border transition-all duration-300 ${step === 'email' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-white text-red-900' : 'bg-white/20'}`}>
                                    1
                                </div>
                                <span className="font-medium">Enter Email</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl backdrop-blur border transition-all duration-300 ${step === 'otp' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'otp' ? 'bg-white text-red-900' : 'bg-white/20'}`}>
                                    2
                                </div>
                                <span className="font-medium">Verify OTP</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl backdrop-blur border transition-all duration-300 ${step === 'password' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'password' ? 'bg-white text-red-900' : 'bg-white/20'}`}>
                                    3
                                </div>
                                <span className="font-medium">Set New Password</span>
                            </div>
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
                            <KeyRound className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">CROSSCERT</h1>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => step === 'email' ? router.push('/auth/signin') : setStep(step === 'otp' ? 'email' : 'otp')}
                            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            {step === 'email' ? 'Back to Sign In' : 'Back'}
                        </button>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{getStepTitle()}</h2>
                        <p className="text-muted-foreground">
                            {getStepDescription()}
                        </p>
                    </div>

                    {/* Step Indicators for Mobile */}
                    <div className="flex items-center justify-center gap-2 lg:hidden">
                        <div className={`h-2 w-8 rounded-full transition-colors ${step === 'email' ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 w-8 rounded-full transition-colors ${step === 'otp' ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 w-8 rounded-full transition-colors ${step === 'password' ? 'bg-primary' : 'bg-muted'}`} />
                    </div>

                    {/* Email Step */}
                    {step === 'email' && (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
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
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Sending OTP...</span>
                                    </div>
                                ) : (
                                    'Send OTP'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* OTP Step */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-foreground font-medium">Verification Code</Label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-center text-2xl tracking-[0.5em] font-mono"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Check your email <span className="font-medium text-foreground">{email}</span> for the code
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    'Verify OTP'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleSendOtp({ preventDefault: () => { } } as React.FormEvent)}
                                disabled={isLoading}
                                className="w-full text-muted-foreground hover:text-foreground"
                            >
                                Didn&apos;t receive the code? Resend
                            </Button>
                        </form>
                    )}

                    {/* Password Step */}
                    {step === 'password' && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-foreground font-medium">New Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 8 characters long
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        <span>Resetting Password...</span>
                                    </div>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="pt-6 text-center text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} CROSSCERT. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    )
}
