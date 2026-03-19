'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Show modal automatically on first visit (mocking with a short delay for now)
    const hasSeenModal = localStorage.getItem('crosscert_welcome_modal_seen')
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('crosscert_welcome_modal_seen', 'true')
  }

  const handleProceedToLogin = () => {
    handleClose()
    router.push('/auth/signin')
  }

  const handleUserManual = () => {
    handleClose()
    window.open('/crossmanual.pdf', '_blank')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-950 shadow-2xl"
          >
            {/* Top Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-red-500/20 to-transparent dark:from-red-500/10 pointer-events-none" />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative p-6 sm:p-8 pt-12 flex flex-col items-center text-center">
              {/* App Icon */}
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                <Sparkles className="w-8 h-8" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-sm mb-4">
                Welcome to CROSSCERT
              </div>

              {/* Text Content */}
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                Get Started with CROSSCERT
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
                Welcome to CROSSCERT, start managing your events in seconds, or learn more about getting started.
              </p>

              {/* Actions */}
              <div className="flex flex-col w-full gap-3">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-12 font-semibold text-base border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  onClick={handleUserManual}
                >
                  User Manual
                </Button>
                <Button
                  className="w-full rounded-2xl h-12 font-bold text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                  onClick={handleProceedToLogin}
                >
                  Proceed to login
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
