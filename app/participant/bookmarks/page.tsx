'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Bookmark, X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoredEvents } from '@/lib/event-context'
import { Event } from '@/lib/event-context'
import { api, apiCall } from '@/lib/api-config'
import { fetchBookmarkIds, toggleBookmark as syncToggleBookmark, migrateLocalBookmarksToServer } from '@/lib/bookmarks'

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
  'CCJE': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white', gradient: 'from-red-500 to-red-600' },
  'CET': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white', gradient: 'from-orange-500 to-orange-600' },
  'CHATME': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white', gradient: 'from-gray-500 to-gray-600' },
  'HUSOCOM': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-white', gradient: 'from-fuchsia-500 to-fuchsia-600' },
  'COME': { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white', gradient: 'from-sky-500 to-sky-600' },
  'SBME': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-black', gradient: 'from-yellow-400 to-yellow-500' },
  'STE': { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-white', gradient: 'from-blue-600 to-blue-700' },
  'HCDC': { bg: 'bg-red-600', border: 'border-red-600', text: 'text-white', gradient: 'from-red-600 to-rose-600' },
}

const getDepartmentAbbr = (fullName: string): string | null => {
  if (!fullName) return null
  if (Object.values(DEPARTMENT_ABBR).includes(fullName as any)) {
    return fullName
  }
  return DEPARTMENT_ABBR[fullName as keyof typeof DEPARTMENT_ABBR] || null
}

const getCategoryFromEvent = (event: Event): string => {
  if (event.category === 'HCDC') return 'HCDC'
  const deptAbbr = getDepartmentAbbr(event.department || '')
  return deptAbbr || 'HCDC'
}

export default function BookmarksPage() {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsUrl = api.events().endsWith('/') ? api.events() : `${api.events()}/`
        const res = await apiCall.get(eventsUrl)

        let eventsList: Event[] = []

        if (!res.ok) {
          eventsList = getStoredEvents()
        } else {
          let data: unknown = []
          try {
            data = await res.json()
          } catch {
            eventsList = getStoredEvents()
          }

          if (Array.isArray(data)) {
            eventsList = data as Event[]
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            eventsList = data.results as Event[]
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            eventsList = data.data as Event[]
          } else {
            eventsList = getStoredEvents()
          }
        }

        setEvents(eventsList)

        await migrateLocalBookmarksToServer()
        const ids = await fetchBookmarkIds()
        setBookmarked(ids)
      } catch (err) {
        console.error('[Bookmarks] Error fetching events:', err)
        const storedEvents = getStoredEvents()
        setEvents(storedEvents)

        const ids = await fetchBookmarkIds()
        setBookmarked(ids)
      }
    }

    fetchEvents()
  }, [])

  const toggleBookmark = async (id: string | number) => {
    const sid = String(id)
    const wasBookmarked = bookmarked.has(sid)
    const optimistic = new Set(bookmarked)
    if (wasBookmarked) optimistic.delete(sid)
    else optimistic.add(sid)
    setBookmarked(optimistic)

    try {
      const nowBookmarked = await syncToggleBookmark(id)
      setBookmarked((prev) => {
        const next = new Set(prev)
        if (nowBookmarked) next.add(sid)
        else next.delete(sid)
        return next
      })
    } catch {
      setBookmarked(bookmarked)
    }
  }

  const bookmarkedEvents = events.filter((event) => {
    return bookmarked.has(String(event.id))
  })

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Bookmarked Events</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">Events you've saved for quick access</p>
        </div>
      </div>

      {/* Bookmarked Events Grid */}
      {bookmarkedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarkedEvents.map((event) => {
            const eventName = event.name || event.title || 'Untitled Event'
            const eventCategory = getCategoryFromEvent(event)
            const colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']

            return (
              <div
                key={event.id}
                className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col h-full cursor-pointer hover:-translate-y-1"
                onClick={() => router.push(`/participant/event/${event.id}`)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {(event.coverImage || event.cover_image) ? (
                    <img
                      src={event.coverImage || event.cover_image || ''}
                      alt={event.name || event.title || 'Event cover'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} opacity-20`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md bg-black/30 border border-white/20`}>
                      {eventCategory}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {eventName}
                    </h3>

                    <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                        <span>{event.date} • {event.startTime || event.start_time || 'TBA'}</span>
                      </div>
                      {(event.venue || event.location) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                          <span className="line-clamp-1">{event.venue || event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      className={`flex-1 bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white shadow-md border-0`}
                      size="sm"
                      onClick={() => router.push(`/participant/event/${event.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-neutral-200 dark:border-neutral-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 h-9 w-9"
                      onClick={() => toggleBookmark(event.id)}
                    >
                      <Bookmark className="w-4 h-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <Bookmark className="w-10 h-10 text-red-500/50 dark:text-red-400/50" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No Bookmarked Events Yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-8">
            Start exploring events and save the ones you're interested in by clicking the bookmark icon.
          </p>
          <Button
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 px-8 py-6 h-auto text-lg rounded-xl"
            onClick={() => router.push('/participant/events')}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Discover Events
          </Button>
        </div>
      )}
    </div>
  )
}
