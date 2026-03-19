'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, X, Calendar, Code, Info, ShieldCheck, Home } from 'lucide-react'

export function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'

  const menuItems: any[] = []

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex justify-center px-4">
      <nav className="relative w-full max-w-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-full py-2 px-3 sm:px-6 shadow-2xl shadow-black/5 flex items-center justify-between gap-4 transition-all duration-300 h-14">
        {/* Logo Section */}
        <div className="flex items-center">
          <button
            className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            onClick={() => {
              router.push('/')
              setIsOpen(false)
            }}
            aria-label="CROSSCERT home"
          >
            {mounted && (
              <Image
                src={logoSrc}
                alt="CROSSCERT"
                width={160}
                height={40}
                priority
                className="w-28 sm:w-36 h-auto object-contain"
              />
            )}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              className="rounded-full h-9 px-4 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => router.push(item.path)}
            >
              {item.name}
            </Button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex rounded-full h-9 px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            onClick={() => window.open('/crossmanual.pdf', '_blank')}
          >
            User Manual
          </Button>

          <ThemeToggle />

          <div className="hidden sm:block">
            <Button
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-full h-9 px-5 shadow-lg shadow-primary/20"
              onClick={() => router.push('/auth/signin')}
            >
              SIGN IN
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="absolute top-20 left-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 z-[60] md:hidden"
            >
              <div className="flex flex-col gap-2">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Navigation</div>
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                    onClick={() => {
                      router.push(item.path)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  </button>
                ))}

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Account & Help</div>

                <button
                  className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group mb-2"
                  onClick={() => {
                    setIsOpen(false)
                    window.open('/crossmanual.pdf', '_blank')
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:text-primary transition-colors shadow-sm">
                    <Info className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">User Manual</span>
                </button>

                <button
                  className="flex items-center gap-4 w-full p-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                  onClick={() => {
                    router.push('/auth/signin')
                    setIsOpen(false)
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">Sign In</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
