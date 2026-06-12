'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, MapPin, CheckCircle, AlertCircle, Ticket, QrCode, Star, Clock, Check, ChevronRight, Award } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect } from 'react'
import { api, apiCall, getAuthenticatedUserEmail } from '@/lib/api-config'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

type Registration = {
  id: number
  event: number
  email: string
  first_name: string
  last_name: string
  registered_at: string
  qr_code?: string
  qr_code_value?: string
  is_present: boolean
  is_checked_out: boolean
  has_evaluated: boolean
}

type EventWithRegistration = {
  id: number
  title: string
  name?: string
  date: string
  start_time?: string
  startTime?: string
  end_time?: string
  endTime?: string
  location?: string
  venue?: string
  status?: string
  coverImage?: string
  cover_image?: string
  registration: Registration
}

const StatusStep = ({
  active,
  completed,
  label,
  icon: Icon,
  isPending
}: {
  active: boolean;
  completed: boolean;
  label: string;
  icon: any;
  isPending?: boolean;
}) => (
  <div className={`flex flex-col items-center gap-1 ${isPending
    ? 'text-red-600 dark:text-red-400'
    : active
      ? 'text-red-600 dark:text-red-400'
      : completed
        ? 'text-green-600 dark:text-green-400'
        : 'text-neutral-300 dark:text-neutral-700'
    }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
      ${isPending
        ? 'border-red-600 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-500 scale-110 shadow-lg shadow-red-500/20'
        : active
          ? 'border-red-600 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-500 scale-110 shadow-lg shadow-red-500/20'
          : completed
            ? 'border-green-600 bg-green-50 text-green-600 dark:bg-green-900/20 dark:border-green-500'
            : 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
      }
    `}>
      {completed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </div>
)

const StatusLine = ({ completed }: { completed: boolean }) => (
  <div className={`h-0.5 w-8 md:w-12 transition-all duration-500 ${completed ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
)

export default function MyEvents() {
  const router = useRouter()
  const { toast } = useToast()
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithRegistration[]>([])
  const [pastEvents, setPastEvents] = useState<EventWithRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchMyEvents = async () => {
      const userEmail = await getAuthenticatedUserEmail()
      if (!userEmail) {
        setError('Please sign in to view your events.')
        setLoading(false)
        return
      }

      try {
        const baseUrl = api.registrations().endsWith('/')
          ? api.registrations().slice(0, -1)
          : api.registrations()
        const registrationsUrl = `${baseUrl}/?email=${encodeURIComponent(userEmail)}`

        const regsRes = await apiCall.get(registrationsUrl)

        if (!regsRes.ok) {
          throw new Error('Unable to load your registrations.')
        }

        const regsData = await regsRes.json()

        let registrations: Registration[] = Array.isArray(regsData)
          ? regsData
          : (regsData.results || regsData.data || [])

        registrations = registrations.filter(reg =>
          reg.email.toLowerCase() === userEmail.toLowerCase()
        )

        if (registrations.length === 0) {
          setLoading(false)
          return
        }

        const eventIds = [...new Set(registrations.map(r => r.event))]
        const eventsMap = new Map<number, EventWithRegistration>()

        for (const eventId of eventIds) {
          try {
            const eventUrl = api.eventById(eventId)
            const eventRes = await apiCall.get(eventUrl)

            if (eventRes.ok) {
              const eventData = await eventRes.json()
              const registration = registrations.find(r => r.event === eventId && r.email.toLowerCase() === userEmail.toLowerCase())

              if (registration) {
                eventsMap.set(eventId, {
                  ...eventData,
                  registration,
                })
              }
            }
          } catch (err) {
            console.error(`[My Events] Error fetching event ${eventId}:`, err)
          }
        }

        const allEvents = Array.from(eventsMap.values())
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Normalize to midnight to include today in upcoming

        const upcoming: EventWithRegistration[] = []
        const past: EventWithRegistration[] = []

        allEvents.forEach(event => {
          const hasEvaluated = event.registration.has_evaluated
          const isMarkedDone = completedEvents.has(String(event.id))

          // Only move to past/history when manually marked as done
          if (isMarkedDone) {
            past.push(event)
          } else {
            // Keep in upcoming even after evaluation until marked done
            upcoming.push(event)
          }
        })

        upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setUpcomingEvents(upcoming)
        setPastEvents(past)

      } catch (err: any) {
        console.error('[My Events] Error:', err)
        setError(err.message || 'Unable to load your events.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyEvents()
  }, [completedEvents]) // Add completedEvents to dependency array to re-fetch/re-sort when it changes

  useEffect(() => {
    // Load completed events from localStorage
    const stored = localStorage.getItem('completedEvents')
    if (stored) {
      setCompletedEvents(new Set(JSON.parse(stored)))
    }
  }, [])

  const handleMarkAsDone = (eventId: number, eventName: string) => {
    const newCompleted = new Set(completedEvents)
    newCompleted.add(String(eventId))
    setCompletedEvents(newCompleted)
    localStorage.setItem('completedEvents', JSON.stringify(Array.from(newCompleted)))

    toast({
      title: "Event Completed",
      description: `Marked ${eventName} as done. See it in the past events.`,
    })
  }

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
            <Ticket className="w-6 h-6 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">My Events</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">Track your registrations, attendance, and feedback</p>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-full max-w-[400px] mb-8 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-full border border-neutral-200 dark:border-neutral-800">
          <TabsTrigger
            value="upcoming"
            className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
          >
            Running & Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all"
          >
            History ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <Card className="p-8 border-red-200 bg-red-50 text-red-900 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{error}</p>
            </Card>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed text-center">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <Ticket className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No Upcoming Events</h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-8">
                You haven't registered for any upcoming events yet.
              </p>
              <Button
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 px-8"
                onClick={() => router.push('/participant/events')}
              >
                Browse Events
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date)
                const startTime = event.start_time || event.startTime || ''

                // Status Logic
                const isCheckedIn = event.registration.is_present
                const isCheckedOut = event.registration.is_checked_out
                const hasEvaluated = event.registration.has_evaluated

                // Calculate Current Status Label
                let statusLabel = 'Registered'
                let statusColor = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                if (hasEvaluated) {
                  statusLabel = 'Evaluated'
                  statusColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                } else if (isCheckedOut) {
                  statusLabel = 'Waiting for Evaluation'
                  statusColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                } else if (isCheckedIn) {
                  statusLabel = 'Checked In'
                  statusColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }

                return (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
                  >
                    {/* Left: Image & Date */}
                    <div className="w-full md:w-48 h-48 md:h-auto relative bg-neutral-100 dark:bg-neutral-800">
                      {(event.coverImage || event.cover_image) ? (
                        <img src={event.coverImage || event.cover_image || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-rose-500/20" />
                      )}
                      <div className="absolute top-4 left-4 md:top-auto md:bottom-4 md:left-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-3 py-2 rounded-lg text-center shadow-lg border border-neutral-200 dark:border-neutral-700 min-w-[60px]">
                        <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div className="text-xl font-extrabold text-neutral-900 dark:text-white">{eventDate.getDate()}</div>
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${statusColor}`}>
                              {statusLabel}
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white line-clamp-1 mb-1">
                              {event.title || event.name || 'Untitled Event'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span>{startTime}</span>
                              </div>
                              {(event.location || event.venue) && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-red-500" />
                                  <span className="line-clamp-1">{event.location || event.venue}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Stepper */}
                        <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                          <StatusStep active={false} completed={true} label="Reg" icon={Ticket} />
                          <StatusLine completed={true} />
                          <StatusStep active={false} completed={isCheckedIn} label="In" icon={QrCode} />
                          <StatusLine completed={isCheckedOut} />
                          <StatusStep active={false} completed={isCheckedOut} label="Out" icon={CheckCircle} />
                          <StatusLine completed={hasEvaluated} />
                          <StatusStep active={false} completed={hasEvaluated} label="Eval" icon={Star} isPending={isCheckedOut && !hasEvaluated} />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                          onClick={() => router.push(`/participant/event/${event.id}/qrcode`)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          View Ticket
                        </Button>

                        {isCheckedOut && !hasEvaluated && (
                          <Button
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => router.push(`/participant/event/${event.id}/evaluation`)}
                          >
                            Evaluate Now
                          </Button>
                        )}

                        {hasEvaluated && (
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkAsDone(event.id, event.title || event.name || 'Event')}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Done
                          </Button>
                        )}

                        {!isCheckedOut && !hasEvaluated && (
                          <Button
                            variant="outline"
                            className="flex-1 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            onClick={() => router.push(`/participant/event/${event.id}`)}
                          >
                            Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed text-center">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No Past Events</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pastEvents.map((event) => {
                const eventDate = new Date(event.date)
                const hasEvaluated = event.registration.has_evaluated
                const isCheckedOut = event.registration.is_checked_out
                const isCheckedIn = event.registration.is_present

                return (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
                  >
                    {/* Left: Image & Date */}
                    <div className="w-full md:w-48 h-48 md:h-auto relative bg-neutral-100 dark:bg-neutral-800">
                      {(event.coverImage || event.cover_image) ? (
                        <img src={event.coverImage || event.cover_image || ''} alt="" className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400" />
                      )}
                      <div className="absolute top-4 left-4 md:top-auto md:bottom-4 md:left-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-3 py-2 rounded-lg text-center shadow-lg border border-neutral-200 dark:border-neutral-700 min-w-[60px]">
                        <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div className="text-xl font-extrabold text-neutral-900 dark:text-white">{eventDate.getDate()}</div>
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Completed
                          </div>
                          <h3 className="text-xl font-bold text-neutral-900 dark:text-white line-clamp-1 mb-1">
                            {event.title || event.name || 'Untitled Event'}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{event.location || event.venue || 'No Location'}</p>
                        </div>

                        {/* Status Stepper - All Completed */}
                        <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                          <StatusStep active={false} completed={true} label="Reg" icon={Ticket} />
                          <StatusLine completed={true} />
                          <StatusStep active={false} completed={true} label="In" icon={QrCode} />
                          <StatusLine completed={true} />
                          <StatusStep active={false} completed={true} label="Out" icon={CheckCircle} />
                          <StatusLine completed={true} />
                          <StatusStep active={false} completed={true} label="Eval" icon={Star} />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/participant/certificates`)}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          View Certificate
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/participant/event/${event.id}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
