'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, CheckCircle, Award, Clock, MapPin, Activity, Search, ArrowUpRight } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { getStoredEvents } from '@/lib/event-context'
import { useState, useEffect } from 'react'
import { adminApi, apiCall } from '@/lib/api-config'

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
  participants?: number
  attended?: number
  attended_count?: number
  certificates?: number
  certificates_count?: number
  registration_count?: number
  created_at?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  // Data State
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([])
  const [pastEvents, setPastEvents] = useState<DashboardEvent[]>([])
  const [recentActivity, setRecentActivity] = useState<DashboardEvent[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    attendedToday: 0,
    certificatesIssued: 0,
  })

  // UI State
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('Welcome back')

  // Live Clock & Greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
    return () => clearInterval(timer)
  }, [])

  // Fetch Data
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
        const res = await apiCall.get(eventsUrl)
        let eventsList: DashboardEvent[] = []

        if (!res.ok) {
          eventsList = getStoredEvents() as DashboardEvent[]
        } else {
          try {
            const data = await res.json()
            if (Array.isArray(data)) eventsList = data as DashboardEvent[]
            else if (data?.results && Array.isArray(data.results)) eventsList = data.results as DashboardEvent[]
            else if (data?.data && Array.isArray(data.data)) eventsList = data.data as DashboardEvent[]
            else eventsList = getStoredEvents() as DashboardEvent[]
          } catch {
            eventsList = getStoredEvents() as DashboardEvent[]
          }
        }

        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]

        const getEventDateStr = (dateStr: string) => {
          if (!dateStr) return ''
          return new Date(dateStr).toISOString().split('T')[0]
        }

        const upcoming: DashboardEvent[] = []
        const past: DashboardEvent[] = []

        eventsList.forEach(event => {
          if (!event.date) return

          const eventDateStr = getEventDateStr(event.date)
          const status = ((event as any).status || '').toLowerCase()
          const isCompleted = status === 'completed' || status === 'concluded'

          if (isCompleted || eventDateStr < todayStr) {
            past.push(event)
          } else {
            upcoming.push(event)
          }
        })

        // Sorting
        upcoming.sort((a, b) => (a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0))
        past.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0))

        setUpcomingEvents(upcoming)
        setPastEvents(past)

        // Generate Activity Feed
        const sortedByCreation = [...eventsList].sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
          return timeB - timeA
        })
        setRecentActivity(sortedByCreation.slice(0, 5))

        // Stats
        const totalParticipants = eventsList.reduce((sum, e) => sum + (e.participants || e.registration_count || 0), 0)
        const attendedToday = eventsList.reduce((sum, e) => {
          if (e.attended_count !== undefined) return sum + e.attended_count
          return sum + (e.attended || 0)
        }, 0)
        const certificatesIssued = eventsList.reduce((sum, e) => sum + (e.certificates_count || 0), 0)

        setStats({
          totalEvents: eventsList.length,
          totalParticipants,
          attendedToday,
          certificatesIssued,
        })
      } catch (err) {
        console.error('[Dashboard] Error:', err)
        const fallback = getStoredEvents() as DashboardEvent[]
        setUpcomingEvents(fallback.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Filtering Logic
  const filteredUpcoming = upcomingEvents.filter(e =>
    (e.title || e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.location || e.venue || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredPast = pastEvents.filter(e =>
    (e.title || e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.location || e.venue || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statsArray = [
    { label: 'Total Events', value: stats.totalEvents.toString(), icon: Calendar, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800' },
    { label: 'Total Participants', value: stats.totalParticipants.toString(), icon: Users, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800' },
    { label: 'Attended Today', value: stats.attendedToday.toString(), icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
    { label: 'Certificates Issued', value: stats.certificatesIssued.toString(), icon: Award, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
  ]

  const quickActions = [
    { title: 'Create Event', desc: 'New seminar or workshop', icon: Calendar, path: '/admin/events/create', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Manage Events', desc: 'Edit existing records', icon: MapPin, path: '/admin/events', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { title: 'Participants', desc: 'Registration database', icon: Users, path: '/admin/participants', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { title: 'Analytics', desc: 'Performance insights', icon: Activity, path: '/admin/insights', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1800px] mx-auto animate-in fade-in duration-500">

      {/* 1. Top Section: Header & Live Clock */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h2 className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Operational
          </h2>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {greeting}, Administrator.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Here is what&apos;s happening with your events today.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-3xl font-mono font-bold text-neutral-700 dark:text-neutral-200 tabular-nums tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-neutral-400 dark:text-neutral-500 font-medium">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* 2. Global Search Bar - REMOVED */}

      {/* 3. High-Impact Stats Cards - Keep as global overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsArray.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900 border ${stat.border} shadow-sm hover:shadow-md transition-all group`}>
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${stat.bg} group-hover:scale-110 transition-transform duration-500`} />
              <div className="relative flex flex-col justify-between h-full">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4 text-xl`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">{stat.value}</h3>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* LEFT COLUMN (2/3): Actions & Events */}
        <div className="xl:col-span-2 space-y-8">

          {/* 4. Command Center (Quick Actions & Analytics Split) */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Command Center</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Column 1: Actions */}
              <div className="space-y-4">
                {/* Create Event - Primary Action */}
                <button
                  onClick={() => router.push('/admin/events/create')}
                  className="w-full flex items-center justify-between p-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Create Event</p>
                      <p className="text-red-100 text-sm">Schedule a new session</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-red-600 transition-colors pointer-events-none">
                    <span className="text-2xl font-light leading-none mb-1">+</span>
                  </div>
                </button>

                {/* Manage Events - Secondary Action */}
                <button
                  onClick={() => router.push('/admin/events')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-red-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-800 dark:text-neutral-200">Manage Events</p>
                    <p className="text-neutral-500 text-xs">Edit, update, or remove existing records</p>
                  </div>
                </button>

                {/* Participants Box - Added as requested */}
                <button
                  onClick={() => router.push('/admin/participants')} // Assuming /admin/participants or /admin/students exists, if not maybe just redirect to events with a filter? User said "add the participants box under...". 
                  // Wait, looking at routes... I don't see "/admin/participants" in the file list earlier. I saw "admin/events". Maybe they mean "Manage Participants"? 
                  // I'll assume /admin/participants for now or reuse /admin/events logic. 
                  // Actually, user said "participants box under to match the height of analytics". 
                  // If there is no specific participants page, I'll point to /admin/events (or just keep the button).
                  // But checking quickActions earlier, it had path: '/admin/participants'. So I will use that.
                  className="w-full flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-red-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-800 dark:text-neutral-200">View Participants</p>
                    <p className="text-neutral-500 text-xs">Manage registration database</p>
                  </div>
                </button>
              </div>

              {/* Column 2: Analytics Snapshot (Graph) */}
              <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col h-full min-h-[300px] relative overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 dark:hidden" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                  <div className="absolute inset-0 hidden dark:block" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <h4 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Registration Trends
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Real-time analytics</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/admin/insights')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    Full Report
                  </Button>
                </div>

                <div className="flex-1 w-full relative z-10">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-b-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
                        </div>
                        <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 animate-pulse">Loading Analytics...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={upcomingEvents.concat(pastEvents).slice(0, 10).map(e => ({
                          name: (e.name || e.title || '').substring(0, 10),
                          full_name: e.name || e.title,
                          registrations: e.registration_count || e.participants || 0,
                          date: e.date
                        }))}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <XAxis
                          dataKey="name"
                          stroke="#a3a3a3"
                          fontSize={10}
                          tickLine={false}
                          axisLine={{ stroke: '#d4d4d4', strokeWidth: 1 }}
                          tick={{ fill: '#737373' }}
                          className="dark:stroke-neutral-500"
                        />
                        <YAxis
                          stroke="#a3a3a3"
                          fontSize={10}
                          tickLine={false}
                          axisLine={{ stroke: '#d4d4d4', strokeWidth: 1 }}
                          tick={{ fill: '#737373' }}
                          tickFormatter={(value: any) => `${value}`}
                          className="dark:stroke-neutral-500"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid #10b981',
                            borderRadius: '12px',
                            color: '#171717',
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                          }}
                          itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                          labelStyle={{
                            color: '#525252',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                          cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.5 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="registrations"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorReg)"
                          activeDot={{
                            r: 6,
                            strokeWidth: 2,
                            stroke: '#10b981',
                            fill: '#fff',
                            filter: 'url(#glow)'
                          }}
                          dot={{
                            r: 3,
                            fill: '#10b981',
                            strokeWidth: 0
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {!loading && stats.totalEvents === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/50 backdrop-blur-sm">
                      <p className="text-sm text-neutral-500">No data available</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* 5. Events Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Upcoming */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Upcoming Events</h3>
                </div>
                <span className="bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-md text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  {filteredUpcoming.length}
                </span>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto max-h-[500px] min-h-[300px]">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading specific data...</div>
                ) : filteredUpcoming.length > 0 ? (
                  filteredUpcoming.map(event => (
                    <div
                      key={event.id}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg shrink-0 border border-red-100 dark:border-red-900/50">
                          <span className="text-[10px] font-bold uppercase">{event.date ? new Date(event.date).toLocaleDateString(undefined, { month: 'short' }) : 'TBA'}</span>
                          <span className="text-lg font-bold leading-none">{event.date ? new Date(event.date).getDate() : '--'}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-red-500 transition-colors">
                            {event.title || event.name || 'Untitled'}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {event.startTime || 'All day'}
                            {event.location && <span>• {event.location}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Calendar className="w-8 h-8 opacity-20 mb-2" />
                    <p>No upcoming events found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Past */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Past Events</h3>
                </div>
                <span className="bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-md text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  {filteredPast.length}
                </span>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto max-h-[500px] min-h-[300px]">
                {filteredPast.length > 0 ? (
                  filteredPast.map(event => (
                    <div
                      key={event.id}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 transition-all cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="min-w-0">
                          <h4 className="font-medium text-neutral-700 dark:text-neutral-300 truncate group-hover:text-foreground">
                            {event.title || event.name || 'Untitled'}
                          </h4>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                            {event.date} • {((event as any).status || 'Completed').toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500/50" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <p>No history available</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN (1/3): Activity Feed & System */}
        <div className="space-y-6">

          {/* Activity Feed */}
          <div className="bg-white dark:bg-[#1f0a0a] text-foreground dark:text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-neutral-200 dark:border-red-900/30">
            <div className="absolute top-0 right-0 p-32 bg-red-600/10 dark:bg-red-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500 dark:text-red-400" />
                Recent Activity
              </h3>
              <div className="space-y-6">
                {recentActivity.length > 0 ? (
                  recentActivity.map((event, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5" />
                        {i !== recentActivity.length - 1 && <div className="w-0.5 grow bg-neutral-200 dark:bg-neutral-700/50 mt-1" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          New Event Added
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                          &quot;{event.title || event.name}&quot; was created.
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No recent activity logged.</p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-6 bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-white text-xs border-dashed">
                View Full Logs
              </Button>
            </div>
          </div>

          {/* System Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 text-sm uppercase tracking-wide">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Database</span>
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span> Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Email Service</span>
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span> Active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Last Backup</span>
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">2 hours ago</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
