'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Users, Clock, ArrowRight, ArrowLeft, Calendar, RefreshCw, Sparkles } from 'lucide-react'
import { api, apiCall } from '@/lib/api-config'
import Image from 'next/image'
import { useTheme } from 'next-themes'

const categories = [
  { id: 'all', label: 'All Events', icon: Sparkles },
  { id: 'HCDC', label: 'HCDC Events', icon: Calendar },
  { id: 'department', label: 'Department Events', icon: Users },
  { id: 'outside', label: 'Outside Events', icon: MapPin },
]

type EventRecord = {
  id: number
  title: string
  name?: string
  date: string
  start_time: string
  end_time: string
  location: string
  venue?: string
  category: string
  theme?: string
  cover_image?: string
  coverImage?: string
  registration_count?: number
  organizer_name?: string
  isPublic?: boolean
}

export default function DiscoverPage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026')

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    setError('')
    try {
      const apiUrl = api.events()
      console.log('[Discover] Fetching events from:', apiUrl)
      const res = await apiCall.get(apiUrl)
      console.log('[Discover] Response status:', res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'No error details')
        console.error('[Discover] API error:', errorText)
        setError(`Unable to load events from the server. Status: ${res.status} ${res.statusText}. ${errorText}`)
        setEvents([])
        return
      }
      let data: unknown = []
      try {
        data = await res.json()
        console.log('[Discover] Received data:', data)
      } catch (parseError) {
        console.error('[Discover] JSON parse error:', parseError)
        setError('Events API did not return valid JSON. Check backend URL / NEXT_PUBLIC_API_URL.')
        setEvents([])
        return
      }
      // Filter to only show public events
      // Handle both snake_case (is_public) from API and camelCase (isPublic)
      const publicEvents = Array.isArray(data)
        ? (data as any[]).filter(event => {
          const isPublic = event.isPublic !== undefined ? event.isPublic : event.is_public
          return isPublic !== false
        })
        : []
      console.log('[Discover] Public events count:', publicEvents.length)
      setEvents(publicEvents)
    } catch (err: any) {
      console.error('[Discover] Fetch error:', err)
      setError(`Network error: ${err.message || 'Unable to load events.'}. Check if backend is running.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
    const eventTitle = event.title || event.name || ''
    const matchesSearch = eventTitle.toLowerCase().includes(searchQuery.toLowerCase())
    let matchesYear = true
    if (schoolYear) {
      const [start, end] = schoolYear.split('-').map(Number)
      const d = new Date(event.date)
      const y = d.getFullYear()
      matchesYear = y === start || y === end
    }
    return matchesCategory && matchesSearch && matchesYear
  })

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950">
      <Navigation />

      {/* Hero Section */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-2 text-balance">Discover Events</h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 text-balance">Find and join public seminars, trainings, and workshops</p>
            </div>
            {mounted && (
              <div className="flex-shrink-0 hidden md:block">
                <Image
                  src={resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'}
                  alt="CROSSCERT"
                  width={220}
                  height={60}
                  className="h-12 sm:h-14 w-auto object-contain"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              />
            </div>
            <select
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              aria-label="School Year"
            >
              {['2023-2024', '2024-2025', '2025-2026', '2026-2027'].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Categories */}
            <div className="lg:col-span-3">
              <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm sticky top-24">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  Event Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${isSelected
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-semibold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-red-500' : 'text-neutral-400'}`} />
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Logo */}
                {mounted && (
                  <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                    <Image
                      src={resolvedTheme === 'dark' ? '/hcdc white.png' : '/hcdc red.png'}
                      alt="HCDC"
                      width={120}
                      height={120}
                      className="h-16 w-auto object-contain opacity-60"
                      priority
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Events Grid */}
            <div className="lg:col-span-9">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {loading ? 'Loading events…' : `${filteredEvents.length} public event${filteredEvents.length !== 1 ? 's' : ''} found`}
                </p>
                {!loading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchEvents}
                    className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                )}
              </div>

              {error && (
                <Card className="p-6 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Unable to Load Events</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <Button
                      onClick={fetchEvents}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </Card>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="overflow-hidden animate-pulse">
                      <div className="h-40 bg-neutral-200 dark:bg-neutral-800" />
                      <div className="p-4 space-y-3">
                        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-neutral-200 dark:border-neutral-800">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No events found</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory('all')
                      setSearchQuery('')
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredEvents.map(event => {
                    const eventTitle = event.title || event.name || 'Untitled Event'
                    const eventLocation = event.location || event.venue || 'TBA'
                    const eventImage = event.cover_image || event.coverImage

                    return (
                      <Card
                        key={event.id}
                        className="overflow-hidden hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 cursor-pointer group border border-neutral-200 dark:border-neutral-800"
                        onClick={() => router.push(`/participant/event/${event.id}`)}
                      >
                        {/* Event Image */}
                        <div className="relative h-48 bg-gradient-to-br from-red-500/10 to-rose-500/10 overflow-hidden">
                          {eventImage ? (
                            <img
                              src={eventImage}
                              alt={eventTitle}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Calendar className="w-16 h-16 text-neutral-300 dark:text-neutral-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />
                          <Badge className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 backdrop-blur-sm">
                            {event.category === 'HCDC'
                              ? 'HCDC'
                              : event.category === 'department'
                                ? 'Department'
                                : event.category === 'outside'
                                  ? 'Outside'
                                  : event.category}
                          </Badge>
                        </div>

                        {/* Event Details */}
                        <div className="p-5 space-y-3">
                          <h3 className="font-bold text-lg text-neutral-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {eventTitle}
                          </h3>

                          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-500 shrink-0" />
                              <span>
                                {event.date && new Date(event.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                                {event.start_time && ` • ${event.start_time}`}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                              <span className="line-clamp-1">{eventLocation}</span>
                            </div>
                            {event.registration_count !== undefined && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-red-500 shrink-0" />
                                <span>{event.registration_count} registered</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <span className="text-xs text-neutral-500 dark:text-neutral-500 line-clamp-1">
                              {event.organizer_name || 'HCDC'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="group/btn text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/participant/event/${event.id}`)
                              }}
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
