'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Search, ChevronDown, X, Sparkles, Filter } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi, apiCall } from '@/lib/api-config'

type AdminEvent = {
  id: number | string
  title?: string
  name?: string
  date?: string
  start_time?: string
  startTime?: string
  end_time?: string
  endTime?: string
  location?: string
  venue?: string
  cover_image?: string
  coverImage?: string
  category?: string
  department?: string
  speakers?: string
  description?: string
  status?: string
}

const DEPARTMENT_ABBR = {
  'College of Criminal Justice Education': 'CCJE',
  'College of Engineering and Technology': 'CET',
  'College of Hospitality & Tourism Management': 'CHATME',
  'College of Humanities, Social Sciences and Communication': 'HUSOCOM',
  'College of Maritime Education': 'COME',
  'School of Business & Management': 'SBME',
  'School of Teacher Education': 'STE',
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'STE': { bg: 'bg-blue-800/60', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-800 to-blue-900' },
  'CET': { bg: 'bg-orange-700/60', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-700 to-orange-800' },
  'SBME': { bg: 'bg-yellow-600/60', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-600 to-yellow-700' },
  'CHATME': { bg: 'bg-zinc-700/60', text: 'text-zinc-100', border: 'border-zinc-400', gradient: 'from-zinc-700 to-zinc-800' },
  'HUSOCOM': { bg: 'bg-[#6d174b]/70', text: 'text-fuchsia-100', border: 'border-[#a8326e]', gradient: 'from-[#6d174b] to-[#4d1035]' },
  'COME': { bg: 'bg-sky-800/60', text: 'text-sky-100', border: 'border-sky-400', gradient: 'from-sky-800 to-sky-900' },
  'CCJE': { bg: 'bg-red-800/60', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-800 to-red-900' },
  'HCDC': { bg: 'bg-gradient-to-r from-blue-700 to-red-600', text: 'text-white', border: 'border-blue-600', gradient: 'from-blue-700 to-red-600' },
}

const getDepartmentAbbr = (fullName: string): string | null => {
  if (!fullName) return null
  if (Object.values(DEPARTMENT_ABBR).includes(fullName as any)) {
    return fullName
  }
  return DEPARTMENT_ABBR[fullName as keyof typeof DEPARTMENT_ABBR] || null
}

const getCategoryFromEvent = (event: AdminEvent): string => {
  if (event.category === 'HCDC') return 'HCDC'
  const deptAbbr = getDepartmentAbbr(event.department || '')
  return deptAbbr || 'HCDC'
}

export default function AdminEvents() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedSemester, setSelectedSemester] = useState('ALL')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('ALL')
  const [isMonthsOpen, setIsMonthsOpen] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | string | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
        const res = await apiCall.get(eventsUrl)

        if (!res.ok) {
          const existing = localStorage.getItem('crosscert_local_events')
          if (existing) {
            const list = JSON.parse(existing) as AdminEvent[]
            setEvents(Array.isArray(list) ? list : [])
          } else {
            setEvents([])
          }
          return
        }

        let data: unknown = []
        try {
          data = await res.json()
        } catch {
          setEvents([])
          return
        }

        let eventsList: AdminEvent[] = []
        if (Array.isArray(data)) {
          eventsList = data as AdminEvent[]
        } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
          eventsList = data.results as AdminEvent[]
        } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          eventsList = data.data as AdminEvent[]
        }

        setEvents(eventsList)
      } catch (err) {
        console.error('Error fetching events:', err)
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          try {
            const list = JSON.parse(existing) as AdminEvent[]
            setEvents(Array.isArray(list) ? list : [])
          } catch {
            setEvents([])
          }
        } else {
          setEvents([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const getSemester = (dateStr: string): string => {
    if (!dateStr) return 'UNKNOWN'
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    if (month >= 1 && month <= 4) return '1st Semester'
    if (month >= 5 && month <= 8) return '2nd Semester'
    return 'Summer'
  }

  const getMonth = (dateStr: string): string => {
    if (!dateStr) return 'UNKNOWN'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  }

  const getSchoolYear = (dateStr: string): string => {
    if (!dateStr) return 'UNKNOWN'
    const d = new Date(dateStr)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  }

  const availableSchoolYears = ['ALL', '2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022']

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventName = (event.name || event.title || '').toString()
      const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (selectedCategory !== 'ALL') {
        const eventCategory = getCategoryFromEvent(event)
        if (selectedCategory === 'HCDC') {
          if (eventCategory !== 'HCDC') return false
        } else {
          if (eventCategory !== selectedCategory) return false
        }
      }

      if (selectedSemester !== 'ALL') {
        const eventSemester = getSemester(event.date || '')
        if (eventSemester !== selectedSemester) return false
      }

      if (selectedMonth !== 'ALL') {
        const eventMonth = getMonth(event.date || '')
        if (eventMonth !== selectedMonth) return false
      }

      if (selectedSchoolYear !== 'ALL') {
        const sy = getSchoolYear(event.date || '')
        if (!sy || sy !== selectedSchoolYear) return false
      }

      return true
    })
  }, [events, searchTerm, selectedCategory, selectedSemester, selectedMonth, selectedSchoolYear])

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const upcoming: AdminEvent[] = []
    const past: AdminEvent[] = []

    filteredEvents.forEach(event => {
      const isCompleted = event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded'

      if (isCompleted) {
        past.push(event)
      } else if (event.date) {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)

        if (eventDate >= now) {
          upcoming.push(event)
        } else {
          past.push(event)
        }
      } else {
        upcoming.push(event)
      }
    })

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [filteredEvents])

  const upcomingEventsByMonth = useMemo(() => {
    const grouped: Record<string, AdminEvent[]> = {}
    upcomingEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const sorted: Record<string, AdminEvent[]> = {}
    Object.keys(grouped).sort((a, b) => {
      const aIdx = monthOrder.indexOf(a)
      const bIdx = monthOrder.indexOf(b)
      if (aIdx === -1 && bIdx === -1) return 0
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    }).forEach(month => {
      sorted[month] = grouped[month].sort((a, b) => {
        const dateA = new Date(a.date || '').getTime()
        const dateB = new Date(b.date || '').getTime()
        return dateA - dateB
      })
    })

    return sorted
  }, [upcomingEvents])

  const pastEventsByMonth = useMemo(() => {
    const grouped: Record<string, AdminEvent[]> = {}
    pastEvents.forEach(event => {
      const month = getMonth(event.date || '')
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(event)
    })

    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const sorted: Record<string, AdminEvent[]> = {}
    Object.keys(grouped).sort((a, b) => {
      const aIdx = monthOrder.indexOf(a)
      const bIdx = monthOrder.indexOf(b)
      if (aIdx === -1 && bIdx === -1) return 0
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return bIdx - aIdx
    }).forEach(month => {
      sorted[month] = grouped[month].sort((a, b) => {
        const dateA = new Date(a.date || '').getTime()
        const dateB = new Date(b.date || '').getTime()
        return dateB - dateA
      })
    })

    return sorted
  }, [pastEvents])

  const clearFilters = () => {
    setSelectedCategory('ALL')
    setSelectedSemester('ALL')
    setSelectedMonth('ALL')
    setSelectedSchoolYear('ALL')
    setSearchTerm('')
  }

  const handleDelete = async (id: number | string) => {
    setShowDeleteConfirm(null)

    try {
      const eventUrl = adminApi.eventById(id)
      const response = await apiCall.delete(eventUrl)

      if (!response.ok) {
        alert(`Failed to delete event: ${response.status} ${response.statusText}`)
        return
      }

      const remaining = events.filter(e => String(e.id) !== String(id))
      setEvents(remaining)

      try {
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          const list = JSON.parse(existing) as AdminEvent[]
          const filtered = list.filter(e => String(e.id) !== String(id))
          localStorage.setItem('crosscert_local_events', JSON.stringify(filtered))
        }
      } catch (lsErr) {
        console.warn('Could not update localStorage:', lsErr)
      }
    } catch (err: any) {
      alert(`Failed to delete event: ${err.message || 'Unknown error'}`)
    }
  }

  const categories = ['ALL', 'HCDC', 'CCJE', 'CET', 'CHATME', 'HUSOCOM', 'COME', 'SBME', 'STE']
  const semesters = ['ALL', '1st Semester', '2nd Semester', 'Summer']
  const months = ['ALL', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

  const hasActiveFilters = selectedCategory !== 'ALL' || selectedSemester !== 'ALL' ||
    selectedMonth !== 'ALL' || selectedSchoolYear !== 'ALL' || searchTerm !== ''

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1700px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Manage Events</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">View, organize, and manage all your events.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white gap-2 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all hover:scale-105"
          size="lg"
          onClick={() => router.push('/admin/events/create')}
        >
          <Plus className="w-5 h-5" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Filters */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-6">
          <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-red-500" />
              Search
            </h3>
            <div className="relative">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:ring-red-500"
              />
            </div>
          </Card>

          <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-500" />
                Filters
              </h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 h-6 px-2">
                  Reset
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">School Year</label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              >
                {availableSchoolYears.map((sy) => (
                  <option key={sy} value={sy}>{sy === 'ALL' ? 'All Years' : sy}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Semester</label>
              <div className="space-y-1">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2
                      ${selectedSemester === sem ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedSemester === sem ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                    {sem === 'ALL' ? 'All Semesters' : sem}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Center Column - Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat
              const colors = CATEGORY_COLORS[cat] || null // Use defined colors if available

              // Dynamic classes base on selection and color existence
              let buttonClasses = "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border "

              if (isSelected) {
                if (colors) {
                  // Active with specific color
                  buttonClasses += `${colors.bg} ${colors.text} ${colors.border} shadow-lg scale-105 border`
                } else {
                  // Active default (ALL)
                  buttonClasses += "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-lg scale-105"
                }
              } else {
                if (colors) {
                  // Inactive but has color (hover effect)
                  buttonClasses += `bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:${colors.text.replace('text-', 'text-')} hover:${colors.border}`
                } else {
                  // Inactive default
                  buttonClasses += "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-500"
                }
              }

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={buttonClasses}
                >
                  {cat === 'HCDC' ? 'HCDC EVENTS' : cat}
                </button>
              )
            })}
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-full border border-neutral-200 dark:border-neutral-800 w-full max-w-[400px]">
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
                >
                  Upcoming ({upcomingEvents.length})
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="flex-1 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
                >
                  Past Events ({pastEvents.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-neutral-200 dark:border-neutral-800 border-t-red-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-rose-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-neutral-900 dark:text-white font-semibold text-lg animate-pulse">
                    Loading Events...
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Fetching your event data
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="upcoming" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {Object.keys(upcomingEventsByMonth).length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                      <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No upcoming events found</h3>
                      <Button onClick={clearFilters} variant="outline" className="mt-6">
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    Object.entries(upcomingEventsByMonth).map(([month, monthEvents]) => (
                      <div key={month} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">{month}</h2>
                          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {monthEvents.map((event) => {
                            const eventCategory = getCategoryFromEvent(event)
                            const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
                            const borderColor = colors ? colors.border : 'border-neutral-200 dark:border-neutral-800'

                            return (
                              <div
                                key={event.id}
                                className={`group relative bg-white dark:bg-neutral-900 rounded-2xl border ${borderColor} overflow-hidden hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col`}
                              >
                                <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => router.push(`/admin/events/${event.id}`)}>
                                  {(event.coverImage || event.cover_image) ? (
                                    <img
                                      src={event.coverImage || event.cover_image || ''}
                                      alt={event.name || event.title}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                  ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} opacity-20`} />
                                  )}
                                  <div className="absolute top-3 left-3 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md bg-black/30 border border-white/20`}>
                                      {eventCategory}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                  <div className="mb-4 flex-1">
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                      {event.name || event.title || 'Untitled Event'}
                                    </h3>
                                    <div className="space-y-2">
                                      {event.date && (
                                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                          <Calendar className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                                          <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                      )}
                                      {(event.venue || event.location) && (
                                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                          <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                                          <span className="line-clamp-1">{event.venue || event.location}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                                    <Button variant="ghost" size="sm" className="flex-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => router.push(`/admin/events/${event.id}`)}>
                                      <Eye className="w-4 h-4 mr-1" /> View
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400" onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                                      <Edit className="w-4 h-4 mr-1" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400" onClick={() => setShowDeleteConfirm(event.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="past" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {Object.keys(pastEventsByMonth).length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                      <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No past events found</h3>
                    </div>
                  ) : (
                    Object.entries(pastEventsByMonth).map(([month, monthEvents]) => (
                      <div key={month} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h2 className="text-xl font-bold text-neutral-500 dark:text-neutral-500 tracking-tight">{month}</h2>
                          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {monthEvents.map((event) => {
                            const eventCategory = getCategoryFromEvent(event)
                            const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']
                            const borderColor = colors ? colors.border : 'border-neutral-200 dark:border-neutral-800'

                            return (
                              <div
                                key={event.id}
                                className={`group relative bg-white dark:bg-neutral-900 rounded-2xl border ${borderColor} overflow-hidden hover:shadow-lg transition-all duration-300 opacity-75 hover:opacity-100 cursor-pointer`}
                              >
                                <div className="relative h-48 overflow-hidden">
                                  {(event.coverImage || event.cover_image) ? (
                                    <img
                                      src={event.coverImage || event.cover_image || ''}
                                      alt={event.name || event.title}
                                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800" />
                                  )}
                                  <div className="absolute top-2 right-2 bg-neutral-900/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md">
                                    Ended
                                  </div>
                                </div>

                                <div className="p-5">
                                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mb-2">
                                    {event.name || event.title || 'Untitled Event'}
                                  </h3>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {event.date && new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => router.push(`/admin/events/${event.id}`)}>
                                      <Eye className="w-4 h-4 mr-1" /> View
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                                      <Edit className="w-4 h-4 mr-1" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowDeleteConfirm(event.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* Right Column - Months */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6">
          <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="space-y-4">
              <button
                onClick={() => setIsMonthsOpen(!isMonthsOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide"
              >
                <span>Filter By Month</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isMonthsOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {isMonthsOpen && (
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedMonth('ALL')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2
                        ${selectedMonth === 'ALL' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                      `}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedMonth === 'ALL' ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                    All Months
                  </button>
                  {months.filter(m => m !== 'ALL').map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ml-1
                          ${selectedMonth === month ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'}
                        `}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 max-w-md mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Delete Event?</h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Are you sure you want to delete this event? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 py-6"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 py-6 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete Event
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
