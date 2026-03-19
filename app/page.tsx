'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Navigation } from '@/components/navigation'
import { LandingHero } from '@/components/landing-hero'
import { WelcomeModal } from '@/components/welcome-modal'

export default function Home() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const departments = ['STE', 'CET', 'SBME', 'CHATME', 'HUSOCOM', 'COME', 'CCJE']
  const departmentGlass: Record<string, string> = {
    STE: 'bg-blue-800/60 text-blue-100 border-blue-400',
    CET: 'bg-orange-700/60 text-orange-100 border-orange-400',
    SBME: 'bg-yellow-600/60 text-yellow-50 border-yellow-400',
    CHATME: 'bg-zinc-700/60 text-zinc-100 border-zinc-400',
    HUSOCOM: 'bg-[#6d174b]/70 text-fuchsia-100 border-[#a8326e]',
    COME: 'bg-sky-800/60 text-sky-100 border-sky-400',
    CCJE: 'bg-red-800/60 text-red-100 border-red-400',
  }

  useEffect(() => {
    setMounted(true)
    const t = setTimeout(() => setShowSplash(false), 2500) // Increased duration for animation
    return () => clearTimeout(t)
  }, [])

  const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'
  // Use Red for consistency as requested
  const brandColor = 'text-primary'
  const brandBg = 'bg-primary'

  return (
    <div className="min-h-screen relative selection:bg-red-500/30">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background pointer-events-auto"
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                {mounted && (
                  <Image
                    src={logoSrc}
                    alt="CROSSCERT"
                    width={320}
                    height={96}
                    priority
                    className="w-64 md:w-96 h-auto object-contain"
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Background Layer */}
      <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
        <div className="absolute inset-0 dark:bg-black" />
        {/* Richer Red Radial Glows */}
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-from)_0%,_transparent_60%)] dark:from-red-600/20" />
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from)_0%,_transparent_40%)] dark:from-red-900/10" />
        <div className="absolute inset-0 dark:bg-[linear-gradient(to_bottom,_transparent_0%,_#450a0a_100%)] opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-0">
        <WelcomeModal />
        <Navigation />
        <LandingHero />

        {/* Marquee */}
        <div className="py-2 sm:py-3 -mt-8 sm:-mt-30 overflow-hidden flex items-center justify-center marquee-mask">
          <div className="marquee whitespace-nowrap select-none">
            {departments.map((d) => (
              <span
                key={`vis-${d}`}
                className={`mx-4 sm:mx-6 md:mx-8 text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide uppercase rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 border backdrop-blur-md shadow-sm ${departmentGlass[d] || 'bg-background/60 text-foreground/80 border-border'}`}
                style={{ backgroundClip: 'padding-box', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
              >
                {d}
              </span>
            ))}
            {/* full duplicate for seamless loop, hidden from assistive tech */}
            {departments.map((d) => (
              <span
                key={`dup-${d}`}
                className={`mx-4 sm:mx-6 md:mx-8 text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide uppercase rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 border backdrop-blur-md shadow-sm ${departmentGlass[d] || 'bg-background/60 text-foreground/80 border-border'}`}
                style={{ backgroundClip: 'padding-box', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
                aria-hidden
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
