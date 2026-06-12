'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Award, Clock, Zap, TrendingUp, Users, Sparkles, MapPin, ArrowRight, Star, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoredEvents } from '@/lib/event-context'
import { api, apiCall, getAuthenticatedUserEmail } from '@/lib/api-config'

type DashboardEvent = {
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
  is_public?: boolean
  isPublic?: boolean
  category?: string
  department?: string
  status?: string
}

export default function ParticipantDashboard() {
  const router = useRouter()
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([])
  const [pastEvents, setPastEvents] = useState<DashboardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState({
    eventsJoined: 0,
    pendingEvaluations: 0,
    certificatesEarned: 0,
  })
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [pendingEvaluationEvents, setPendingEvaluationEvents] = useState<any[]>([])

  useEffect(() => {
    const storedFirstName = localStorage.getItem('userFirstName')
    const storedLastName = localStorage.getItem('userLastName')
    if (storedFirstName && storedLastName) {
      setUserName(`${storedFirstName} ${storedLastName}`)
    } else if (storedFirstName) {
      setUserName(storedFirstName)
    }

    const fetchEvents = async () => {
      try {
        const eventsUrl = api.events().endsWith('/') ? api.events() : `${api.events()}/`
        const res = await apiCall.get(eventsUrl)

        let eventsList: DashboardEvent[] = []

        if (!res.ok) {
          eventsList = getStoredEvents() as DashboardEvent[]
        } else {
          let data: unknown = []
          try {
            data = await res.json()
          } catch {
            eventsList = getStoredEvents() as DashboardEvent[]
          }

          if (Array.isArray(data)) {
            eventsList = data as DashboardEvent[]
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            eventsList = data.results as DashboardEvent[]
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            eventsList = data.data as DashboardEvent[]
          } else {
            eventsList = getStoredEvents() as DashboardEvent[]
          }
        }

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const publicEvents = eventsList.filter(event => event.isPublic !== false)

        const upcoming = publicEvents.filter(event => {
          // Check status first - if completed/concluded, it's past
          const status = (event.status || '').toLowerCase()
          if (status === 'completed' || status === 'concluded') {
            return false // Not upcoming
          }

          if (!event.date) return true
          const eventDate = new Date(event.date)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate >= now
        }).sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0
          const dateB = b.date ? new Date(b.date).getTime() : 0
          return dateA - dateB
        }).slice(0, 3)

        const past = publicEvents.filter(event => {
          // Check status first - if completed/concluded, it's past
          const status = (event.status || '').toLowerCase()
          if (status === 'completed' || status === 'concluded') {
            return true // Definitely past
          }

          if (!event.date) return false
          const eventDate = new Date(event.date)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate < now
        }).sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0
          const dateB = b.date ? new Date(b.date).getTime() : 0
          return dateB - dateA
        }).slice(0, 3)

        setUpcomingEvents(upcoming)
        setPastEvents(past)

        const userEmail = await getAuthenticatedUserEmail()
        if (userEmail) {
          try {
            const baseUrl = api.registrations().endsWith('/') ? api.registrations().slice(0, -1) : api.registrations()
            const regsUrl = `${baseUrl}/?email=${encodeURIComponent(userEmail)}`
            const regsRes = await apiCall.get(regsUrl)

            if (regsRes.ok) {
              const regsData = await regsRes.json()
              const registrations = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
              const eventsJoined = registrations.length
              const pendingEvaluations = registrations.filter((reg: any) => reg.is_present && !reg.has_evaluated).length

              const certsUrl = api.certificates().endsWith('/') ? api.certificates() : `${api.certificates()}/`
              const certsRes = await apiCall.get(`${certsUrl}?email=${encodeURIComponent(userEmail)}`)

              let certificatesEarned = 0
              if (certsRes.ok) {
                const certsData = await certsRes.json()
                const certificates = Array.isArray(certsData) ? certsData : (certsData.results || certsData.data || [])
                certificatesEarned = certificates.length
              }

              setStats({ eventsJoined, pendingEvaluations, certificatesEarned })
            }
          } catch (err) {
            console.error('Error fetching stats:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        const storedEvents = getStoredEvents()
        setUpcomingEvents(storedEvents.slice(0, 3) as DashboardEvent[])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    const checkPendingEvaluations = async () => {
      const userEmail = await getAuthenticatedUserEmail()
      if (!userEmail) return

      // Check if modal was dismissed today
      const dismissedDate = localStorage.getItem('evaluationModalDismissed')
      const today = new Date().toDateString()
      if (dismissedDate === today) return

      try {
        const baseUrl = api.registrations().endsWith('/') ? api.registrations().slice(0, -1) : api.registrations()
        const regsUrl = `${baseUrl}/?email=${encodeURIComponent(userEmail)}`
        const regsRes = await apiCall.get(regsUrl)

        if (regsRes.ok) {
          const regsData = await regsRes.json()
          const registrations = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])

          // Find events that need evaluation (checked out but not evaluated)
          const needsEvaluation = registrations.filter((reg: any) =>
            reg.is_checked_out && !reg.has_evaluated
          )

          if (needsEvaluation.length > 0) {
            // Fetch event details
            const eventsWithReg = await Promise.all(
              needsEvaluation.map(async (reg: any) => {
                try {
                  const eventUrl = api.eventById(reg.event)
                  const eventRes = await apiCall.get(eventUrl)
                  if (eventRes.ok) {
                    const eventData = await eventRes.json()
                    return { ...eventData, registration: reg }
                  }
                } catch {
                  return null
                }
                return null
              })
            )

            const validEvents = eventsWithReg.filter(e => e !== null)
            if (validEvents.length > 0) {
              setPendingEvaluationEvents(validEvents)
              setShowEvaluationModal(true)
            }
          }
        }
      } catch (err) {
        console.error('Error checking pending evaluations:', err)
      }
    }

    checkPendingEvaluations()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const statsData = [
    { label: 'Upcoming Events', value: upcomingEvents.length.toString(), icon: Clock, color: 'from-red-500 to-rose-500', iconColor: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Events Joined', value: stats.eventsJoined.toString(), icon: Calendar, color: 'from-orange-500 to-amber-500', iconColor: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: 'Pending Evaluations', value: stats.pendingEvaluations.toString(), icon: Zap, color: 'from-yellow-500 to-orange-500', iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30' },
    { label: 'Certificates Earned', value: stats.certificatesEarned.toString(), icon: Award, color: 'from-green-500 to-emerald-500', iconColor: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-red-500 dark:text-red-400" />
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {getGreeting()}{userName ? `, ${userName}` : ''}!
          </h1>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400">Here's your activity summary and upcoming events</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          const isPendingEvaluations = stat.label === 'Pending Evaluations'
          const CardWrapper = isPendingEvaluations ? 'button' : 'div'

          return (
            <CardWrapper
              key={stat.label}
              onClick={isPendingEvaluations ? () => router.push('/participant/my-events') : undefined}
              className={`${isPendingEvaluations ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} transition-all duration-300 w-full text-left`}
            >
              <Card className="relative overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-all duration-300 group h-full">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{stat.label}</p>
                    <p className="text-4xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </CardWrapper>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-red-500 dark:text-red-400" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-auto py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all group" onClick={() => router.push('/participant/events')}>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Browse Events</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4 border-2 border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group" onClick={() => router.push('/participant/my-events')}>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-red-500 group-hover:scale-110 transition-all" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-red-600 dark:group-hover:text-red-400">My Events</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4 border-2 border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group" onClick={() => router.push('/participant/certificates')}>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-red-500 group-hover:scale-110 transition-all" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-red-600 dark:group-hover:text-red-400">My Certificates</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* Events Grid - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events - Left */}
        <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500 dark:text-red-400" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Upcoming Events</h2>
            </div>
            {upcomingEvents.length > 0 && (
              <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => router.push('/participant/events')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="group flex gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:shadow-lg hover:border-red-500 dark:hover:border-red-500 transition-all cursor-pointer" onClick={() => router.push(`/participant/event/${event.id}`)}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {(event.coverImage || event.cover_image) ? (
                      <img src={event.coverImage || event.cover_image || ''} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-rose-500/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors mb-1">
                      {event.name || event.title || 'Untitled Event'}
                    </h3>
                    <div className="space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {event.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-red-500" />
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      {(event.venue || event.location) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span className="truncate">{event.venue || event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No upcoming events</p>
            </div>
          )}
        </Card>

        {/* Past Events - Right */}
        <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Past Events</h2>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pastEvents.length > 0 ? (
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <div key={event.id} className="group flex gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100 hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push(`/participant/event/${event.id}`)}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {(event.coverImage || event.cover_image) ? (
                      <img src={event.coverImage || event.cover_image || ''} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full bg-neutral-300 dark:bg-neutral-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors mb-1">
                      {event.name || event.title || 'Untitled Event'}
                    </h3>
                    <div className="space-y-0.5 text-xs text-neutral-500 dark:text-neutral-500">
                      {event.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      {(event.venue || event.location) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.venue || event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No past events</p>
            </div>
          )}
        </Card>
      </div>

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-2xl w-full m-4 p-6 border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Pending Evaluations</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Your feedback helps us improve!</p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('evaluationModalDismissed', new Date().toDateString())
                  setShowEvaluationModal(false)
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              You have <strong className="text-orange-600">{pendingEvaluationEvents.length}</strong> event(s) waiting for your feedback!
            </p>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
              {pendingEvaluationEvents.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 transition-all">
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900 dark:text-white">{event.title || event.name}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      router.push(`/participant/event/${event.id}/evaluation`)
                      setShowEvaluationModal(false)
                    }}
                  >
                    Evaluate Now
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  localStorage.setItem('evaluationModalDismissed', new Date().toDateString())
                  setShowEvaluationModal(false)
                }}
              >
                Remind Me Later
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                onClick={() => {
                  router.push('/participant/my-events')
                  setShowEvaluationModal(false)
                }}
              >
                View My Events
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
