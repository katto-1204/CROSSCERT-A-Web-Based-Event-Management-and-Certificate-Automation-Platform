'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calendar, Users, BarChart3, Settings, LogOut, QrCode, Search, Menu, X, FileText, Star, Sparkles, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && (resolvedTheme === 'dark' || theme === 'dark')
    ? '/hcdc white.png'
    : '/hcdc red.png'

  const crosscertLogoSrc = mounted && (resolvedTheme === 'dark' || theme === 'dark')
    ? '/crosscert-typo-white.png'
    : '/crosscert-typo-black.png'

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', color: 'text-red-500' },
    { icon: Calendar, label: 'Events', href: '/admin/events', color: 'text-orange-500' },
    { icon: Users, label: 'Participants', href: '/admin/participants', color: 'text-blue-500' },
    { icon: QrCode, label: 'Attendance', href: '/admin/checkin', color: 'text-green-500' },
    { icon: Star, label: 'Evaluations', href: '/admin/evaluations', color: 'text-yellow-500' },
    { icon: FileText, label: 'Certificates', href: '/admin/certificates', color: 'text-purple-500' },
    { icon: BarChart3, label: 'Insights', href: '/admin/insights', color: 'text-pink-500' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', color: 'text-neutral-500' },
  ]

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    const { handleLogout: logout } = await import('@/lib/auth-utils')
    await logout()
    router.push('/')
  }

  // Handle search - filter menu items
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Header */}
      <div className="px-4 py-5 border-b border-border/60 dark:border-neutral-800/60">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer group flex-1"
            onClick={() => {
              router.push('/admin/dashboard')
              if (isMobile) setIsMobileOpen(false)
            }}
          >
            {mounted && (
              <Image
                src={logoSrc}
                alt="HCDC"
                width={120}
                height={30}
                className="w-full max-w-[100px] h-auto object-contain transition-transform group-hover:scale-[1.03]"
                priority
              />
            )}
            {!mounted && (
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">C</span>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/40 dark:bg-neutral-900/50 border-transparent focus:border-border dark:focus:border-neutral-700 rounded-md placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-2 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Navigation
        </p>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <button
              key={item.href}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                ${active
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-500/20'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/60 dark:hover:bg-neutral-800/60'
                }
                group relative
              `}
              onClick={() => {
                router.push(item.href)
                if (isMobile) setIsMobileOpen(false)
              }}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : item.color} transition-colors shrink-0`} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-white/60 shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-border/60 dark:border-neutral-800/60">
        {/* Admin badge */}
        <div className="px-3 pt-3 pb-1">
          <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-2">
          <button
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-red-500/80 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all group"
            onClick={() => {
              handleLogout()
              if (isMobile) setIsMobileOpen(false)
            }}
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* CROSSCERT Logo */}
        {mounted && (
          <div className="flex items-center justify-center pb-4 pt-1">
            <Image
              src={crosscertLogoSrc}
              alt="CROSSCERT"
              width={100}
              height={20}
              className="w-auto h-4 object-contain opacity-30 hover:opacity-60 transition-opacity"
              priority
            />
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 transition-all hover:scale-105"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 w-[260px] h-screen bg-background dark:bg-neutral-950 border-r border-border/50 dark:border-neutral-800/50 flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        md:hidden fixed left-0 top-0 w-[280px] h-screen bg-background dark:bg-neutral-950 border-r border-border/50 dark:border-neutral-800/50 flex flex-col z-40 transform transition-transform duration-250 ease-out shadow-2xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent isMobile />
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-[2px] z-30 animate-in fade-in duration-150"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
