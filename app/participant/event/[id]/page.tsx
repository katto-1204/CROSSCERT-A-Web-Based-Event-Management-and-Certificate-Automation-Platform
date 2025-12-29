'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, ArrowLeft, Share2, Ticket, Users, FileText, CheckCircle2, AlertCircle, Info, Landmark, Bookmark, QrCode, GraduationCap, School, Download, X, Facebook, Instagram, Twitter, Mail, Heart, Star, Rocket } from 'lucide-react'
import { getEventById, getRegistrationStatus, Event, fetchUserDepartment } from '@/lib/event-context'
import { getAuthenticatedUserEmail, api, apiCall, authApi, apiRequest } from '@/lib/api-config'
import { QRCodeSVG } from 'qrcode.react'

// Define the precise color palette
// Define the precise color palette
// THEME_STYLES maps the event.theme field to color styles
const THEME_STYLES: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'Professional Blue': { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-600 to-blue-900' },
  'Modern Red': { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-600 to-red-900' },
  'Vibrant Orange': { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-600 to-orange-900' },
  'Elegant Gold': { bg: 'bg-yellow-500', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-500 to-yellow-800' },
  'Nature Green': { bg: 'bg-green-600', text: 'text-green-100', border: 'border-green-400', gradient: 'from-green-600 to-green-900' },
  'Sleek Dark': { bg: 'bg-zinc-800', text: 'text-zinc-100', border: 'border-zinc-600', gradient: 'from-zinc-800 to-black' },
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'STE': { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-600 to-blue-900' },
  'CET': { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-600 to-orange-900' },
  'SBME': { bg: 'bg-yellow-500', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-500 to-yellow-800' },
  'CHATME': { bg: 'bg-zinc-600', text: 'text-zinc-100', border: 'border-zinc-400', gradient: 'from-zinc-600 to-zinc-900' },
  'HUSOCOM': { bg: 'bg-[#831843]', text: 'text-pink-100', border: 'border-pink-500', gradient: 'from-[#831843] to-[#500724]' },
  'COME': { bg: 'bg-sky-600', text: 'text-sky-100', border: 'border-sky-400', gradient: 'from-sky-600 to-sky-900' },
  'CCJE': { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-600 to-red-900' },
  'HCDC': { bg: 'bg-gradient-to-r from-blue-700 to-red-600', text: 'text-white', border: 'border-blue-600', gradient: 'from-blue-900 via-blue-800 to-red-900' },
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

function activeButtonColor(status: string, colors: any) {
  if (status === 'none') return `${colors.bg} text-white hover:opacity-90`
  return 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'
}

export default function ParticipantEventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [buttonLabel, setButtonLabel] = useState<string>('Register Now')
  const [registrationStatus, setRegistrationStatus] = useState<string>('none')
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false)

  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()

  // Countdown Logic
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null)

  useEffect(() => {
    if (!event) return

    const calculateTimeLeft = () => {
      try {
        const eventDateStr = new Date(event.date).toLocaleDateString('en-US')
        let timeStr = event.startTime || event.start_time || '00:00'
        timeStr = timeStr.replace(/([AP]M)/i, ' $1').trim()

        const startDateTimeStr = `${eventDateStr} ${timeStr}`
        const targetDate = new Date(startDateTimeStr).getTime()
        const now = new Date().getTime()
        const difference = targetDate - now

        if (isNaN(targetDate)) return null

        if (difference > 0) {
          return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          }
        }
      } catch (e) { console.error(e) }
      return null
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    setTimeLeft(calculateTimeLeft()) // Initial call

    return () => clearInterval(timer)
  }, [event])

  useEffect(() => {
    const eventId = params.id as string

    async function fetchEvent() {
      setLoading(true)
      try {
        const eventUrl = api.eventById(eventId)
        const response = await apiCall.get(eventUrl)

        if (response.ok) {
          const apiEvent = await response.json()
          setEvent(apiEvent as Event)

          const userDept = await fetchUserDepartment()
          const eventCategory = getCategoryFromEvent(apiEvent)
          const canAccess = eventCategory === 'HCDC' || (!!userDept && getDepartmentAbbr(userDept) === eventCategory)
          setHasAccess(canAccess)

          const storedBookmarks = localStorage.getItem('bookmarkedEvents')
          if (storedBookmarks) {
            const bookmarks = new Set(JSON.parse(storedBookmarks))
            setIsBookmarked(bookmarks.has(eventId))
          }

          let derivedStatus = 'none'
          const userEmail = await getAuthenticatedUserEmail()
          if (userEmail) {
            const regsUrl = `${api.registrations()}?event=${eventId}&email=${encodeURIComponent(userEmail)}`
            const regsRes = await apiCall.get(regsUrl)
            if (regsRes.ok) {
              const regsData = await regsRes.json()
              const regs = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
              if (regs.length > 0) {
                const reg = regs[0]
                setRegistrationData(reg)
                if (reg.has_evaluated) derivedStatus = 'evaluated'
                else if (reg.is_checked_out) derivedStatus = 'checked-out'
                else if (reg.is_present) derivedStatus = 'checked-in'
                else derivedStatus = 'registered'
              }
            }
          }
          setRegistrationStatus(derivedStatus)
          updateButtonLabel(derivedStatus)
        } else {
          // Fallback to local
          const localEvent = getEventById(eventId)
          if (localEvent) {
            setEvent(localEvent)
            const status = getRegistrationStatus(eventId)
            setRegistrationStatus(status)
            updateButtonLabel(status)
            setHasAccess(true) // simplifying for local demo
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [params.id])

  const updateButtonLabel = (status: string) => {
    switch (status) {
      case 'registered': setButtonLabel('View Ticket'); break
      case 'checked-in': setButtonLabel('Checked In'); break
      case 'checked-out': setButtonLabel('Evaluate Event'); break
      case 'evaluated': setButtonLabel('View Certificate'); break
      default: setButtonLabel('Register Now'); break
    }
  }

  const handleRegister = async () => {
    if (!event) return

    const userEmail = await getAuthenticatedUserEmail()
    if (!userEmail) {
      alert('You must be signed in to register.')
      router.push('/auth/signin')
      return
    }

    if (!hasAccess) {
      setErrorMessage(`This event is exclusive only for ${event.department} students.`)
      return
    }

    // Attempt registration
    try {
      let firstName = 'Participant'
      let lastName = 'User'
      let affiliation = 'HCDC'

      // Try fetching profile
      try {
        const profileResponse = await apiRequest(authApi.me(), { method: 'GET' })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.authenticated && profileData.user) {
            const user = profileData.user
            firstName = user.first_name || 'Participant'
            lastName = user.last_name || 'User'
            affiliation = user.department || 'HCDC'
          }
        }
      } catch { }

      const payload = {
        event: parseInt(String(event.id), 10),
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        affiliation,
      }

      const res = await apiCall.post(api.registrations(), payload)
      if (res.ok) {
        const reg = await res.json()
        setRegistrationData(reg)
        setRegistrationStatus('registered')
        updateButtonLabel('registered')
        setShowSuccessModal(true)
      } else {
        const err = await res.json()
        const errorDetail = String(err?.detail || err?.non_field_errors?.[0] || 'Registration failed.')

        if (errorDetail.toLowerCase().includes('already registered')) {
          setRegistrationStatus('registered')
          updateButtonLabel('registered')
          setShowSuccessModal(true)
          console.log('[Registration] User already registered for this event.')
        } else {
          setErrorMessage(errorDetail)
        }
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('An error occurred.')
    }
  }

  const handleMainAction = () => {
    if (!event) return

    if (registrationStatus === 'none') {
      handleRegister()
    } else if (registrationStatus === 'registered' || registrationStatus === 'checked-in') {
      // Show Ticket Modal instead of navigating
      setShowTicketModal(true)
    } else if (registrationStatus === 'checked-out') {
      router.push(`/participant/event/${event.id}/evaluation`)
    } else if (registrationStatus === 'evaluated') {
      router.push('/participant/certificates')
    }
  }

  const toggleBookmark = () => {
    if (!event) return
    const eventId = String(event.id)
    const stored = new Set(JSON.parse(localStorage.getItem('bookmarkedEvents') || '[]'))
    if (stored.has(eventId)) {
      stored.delete(eventId)
      setIsBookmarked(false)
    } else {
      stored.add(eventId)
      setIsBookmarked(true)
    }
    localStorage.setItem('bookmarkedEvents', JSON.stringify(Array.from(stored)))
  }

  const handleDownloadQR = () => {
    const svgEl = document.getElementById('qr-main-svg')
    if (svgEl) {
      const serializer = new XMLSerializer()
      const svgStr = serializer.serializeToString(svgEl)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      // Convert SVG to data URI
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        canvas.width = 500
        canvas.height = 500
        if (ctx) {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, 500, 500)

          const pngUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = `EventTicket-${event?.id}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
      }
      img.src = url
    }
  }
  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 animate-in fade-in duration-700">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[65vh] md:h-[80vh] overflow-hidden bg-neutral-200/50 dark:bg-neutral-900/20">
        <div className="absolute inset-0 bg-neutral-300/40 dark:bg-neutral-900/40 animate-pulse" />
        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-24 px-6 md:px-12 max-w-[1700px] mx-auto">
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-3">
              <div className="h-8 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-full animate-pulse" />
              <div className="h-8 w-32 bg-neutral-300 dark:bg-neutral-800 rounded-full animate-pulse" />
            </div>
            {/* Title */}
            <div className="h-16 md:h-24 w-3/4 max-w-4xl bg-neutral-200/80 dark:bg-neutral-800/80 rounded-3xl animate-pulse backdrop-blur-md" />
            <div className="h-16 md:h-24 w-1/2 max-w-2xl bg-neutral-200/80 dark:bg-neutral-800/80 rounded-3xl animate-pulse backdrop-blur-md" />
            {/* Meta */}
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-48 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl animate-pulse" />
              <div className="h-12 w-48 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-[1700px] mx-auto px-6 md:px-12 -mt-16 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-2xl animate-pulse border border-neutral-200/50 dark:border-neutral-800/50" />
              ))}
            </div>
            <div className="h-96 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-[2.5rem] animate-pulse border border-neutral-200/50 dark:border-neutral-800/50" />
          </div>

          {/* Ticket Skeleton */}
          <div className="lg:col-span-4">
            <div className="h-[600px] bg-neutral-200/50 dark:bg-neutral-900/50 rounded-3xl animate-pulse border border-neutral-200/50 dark:border-neutral-800/50" />
          </div>
        </div>
      </div>
    </div>
  )
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">Event not found</div>

  const eventCategory = event ? getCategoryFromEvent(event) : 'HCDC'

  // Logic: HCDC events ALWAYS use the Red/Blue gradient.
  // Other events use the selected theme if available, otherwise fallback to department color or default.
  let colors = CATEGORY_COLORS[eventCategory] || CATEGORY_COLORS['HCDC']

  if (event && eventCategory !== 'HCDC' && event.theme && THEME_STYLES[event.theme]) {
    colors = THEME_STYLES[event.theme]
  } else if (event && eventCategory === 'HCDC' && event.theme && event.theme !== 'Professional Blue' && THEME_STYLES[event.theme]) {
    // Optional: If user wants specific theme even for HCDC (except the gradient rule says only HCDC gets gradient, 
    // but user said "THE GRADIENT RED AND BLUE IS ONLY FOR THE HCDC WIDE VENTS", 
    // which implies HCDC *must* look like that, OR that *only* HCDC can look like that. 
    // Usually "Only for HCDC" means "Don't use it elsewhere". 
    // "THEME SELECTED IN THE EVENT CREATION" implies customizability.
    // Let's assume: If event.theme is set, use it. If not, use Category default.
    // BUT, keep HCDC default specific.
    if (THEME_STYLES[event.theme]) {
      colors = THEME_STYLES[event.theme]
    }
  }

  // Override: If category is HCDC and theme is default or missing, ensure HCDC gradient.
  if (eventCategory === 'HCDC' && (!event?.theme || event.theme === 'Professional Blue')) {
    colors = CATEGORY_COLORS['HCDC']
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">

      {/* 1. IMMERSIVE HERO SECTION */}
      {/* Increased height to show more banner as requested */}
      <div className="relative w-full h-[65vh] md:h-[80vh] overflow-hidden">
        {/* Dynamic Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-90`} />
        {event.coverImage || event.cover_image && (
          <img
            src={event.coverImage || event.cover_image}
            alt={event.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          />
        )}

        {/* Texture Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-24 px-6 md:px-12 max-w-[1700px] mx-auto">

          <div className="absolute top-8 left-6 md:left-12">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-full px-6" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Explore
            </Button>
          </div>

          <div className="w-full flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="flex-1 space-y-6 animate-in slide-in-from-bottom-10 duration-700">

              <div className="flex items-center gap-3">
                <Badge className={`${colors.bg} text-white hover:${colors.bg} border-none px-4 py-1.5 text-sm uppercase tracking-widest font-bold shadow-lg shadow-black/20`}>
                  {eventCategory}
                </Badge>
                {(event.isPublic || (event as any).is_public) && (
                  <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10 backdrop-blur-md px-3 py-1.5 uppercase tracking-wide text-xs font-bold">
                    Open to Public
                  </Badge>
                )}
                {event.isPaidEvent && (
                  <Badge variant="outline" className="border-amber-400 text-amber-400 bg-amber-400/10 backdrop-blur-md px-3 py-1.5 uppercase tracking-wide text-xs font-bold">
                    Paid Event
                  </Badge>
                )}
              </div>

              {/* Massive Title */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl max-w-5xl">
                {event.name || event.title}
              </h1>

              {/* Meta Data Row */}
              <div className="flex flex-wrap items-center gap-4 text-white/90 font-medium text-lg pt-4">
                {/* Date */}
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Calendar className="w-5 h-5 text-white" />
                  <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Clock className="w-5 h-5 text-white" />
                  <span>{event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}</span>
                </div>

                {/* Venue */}
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <MapPin className="w-5 h-5 text-white" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            {/* Live Countdown Circle - Moved to Right Side */}
            {timeLeft && (
              <div className="hidden lg:flex items-center justify-center relative w-40 h-40 rounded-full border border-white/20 bg-black/20 backdrop-blur-xl animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{timeLeft.days}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-1">Days Left</div>
                  <div className="text-xs text-white/80 font-mono">{timeLeft.hours}h {timeLeft.minutes}m</div>
                </div>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="78" stroke="white" strokeWidth="1" fill="none" className="opacity-10" />
                  <circle cx="80" cy="80" r="78" stroke="white" strokeWidth="2" fill="none" strokeDasharray="490" strokeDashoffset="100" className="opacity-30" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BENTO LAYOUT CONTENT */}
      {/* Adjusted negative margin to -mt-16 to show more banner */}
      <div className="max-w-[1700px] mx-auto px-6 md:px-12 -mt-16 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* MAIN CONTENT (Left 8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Extended Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Semester */}
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Semester</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.semester || '1st Semester'}</p>
              </Card>
              {/* SY */}
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">School Year</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.school_year || '2025-2026'}</p>
              </Card>
              {/* Capacity */}
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Capacity</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.capacity || 'Unlimited'}</p>
              </Card>
              {/* Access Type */}
              <Card className="p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-none rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Access</p>
                <p className="font-bold text-neutral-900 dark:text-white">{event.isPaidEvent ? 'Paid Ticket' : 'Free Entry'}</p>
              </Card>
            </div>

            {/* About Card */}
            <Card className="p-8 md:p-10 border-none shadow-2xl bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${colors.bg} bg-opacity-10`}>
                  <Info className={`w-8 h-8 ${colors.text.replace('100', '600')}`} />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500">
                  Event Description
                </h2>
              </div>
              <div className="prose dark:prose-invert prose-lg max-w-none text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            </Card>

            {/* Middle Row Bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Speakers Tile */}
              <Card className="group p-6 border-none shadow-xl bg-neutral-100 dark:bg-neutral-900 rounded-[2rem] overflow-hidden relative hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 rounded-bl-full" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-neutral-500" /> Key Speakers
                </h3>
                {event.speakers ? (
                  <div className="flex flex-col gap-3">
                    {(Array.isArray(event.speakers) ? event.speakers : String(event.speakers).split(',')).map((s: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                          {s.trim().charAt(0)}
                        </div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{s.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-neutral-500 italic">No speakers announced.</div>}
              </Card>

              <div className="flex flex-col gap-6">

                {/* Certificate Preview Tile */}
                <Card className="p-6 border-none shadow-xl bg-neutral-900 text-white rounded-[2rem] flex flex-col justify-center relative overflow-hidden">
                  <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full ${colors.bg} blur-3xl opacity-30`} />
                  <h4 className="text-sm uppercase tracking-widest text-neutral-400 font-bold mb-2">Completion</h4>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Verified Certificate</p>
                      <p className="text-xs text-neutral-400">Earnable upon completion</p>
                    </div>
                  </div>
                </Card>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: DIGITAL TICKET (Sticky) */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">

              <div className="relative group perspective-1000">
                {/* Holographic Border Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient} opacity-75 blur-lg group-hover:opacity-100 transition duration-500`} />

                {/* The Ticket Card */}
                <div className="relative bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl">

                  {/* Ticket Header */}
                  <div className={`h-32 ${colors.bg} relative overflow-hidden p-6 text-white flex flex-col justify-between`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="flex justify-between items-start z-10">
                      <QrCode className="w-8 h-8 opacity-80" />
                      <div className="flex items-center gap-2">
                        {/* LIVE BADGE */}
                        {event.status?.toLowerCase() === 'live' ? (
                          <Badge className="bg-red-600/90 hover:bg-red-600 text-white border-none px-4 py-1.5 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                            <Rocket className="w-3 h-3 mr-2 animate-bounce" />
                            EVENT STARTED
                          </Badge>
                        ) : (event.status?.toLowerCase() === 'concluded' || event.status?.toLowerCase() === 'completed') ? (
                          <Badge className="bg-neutral-800 text-white border-none px-4 py-1.5 uppercase font-bold tracking-wider">
                            <CheckCircle2 className="w-3 h-3 mr-2" />
                            EVENT CONCLUDED
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/90 text-white border-none px-4 py-1.5">
                            <Clock className="w-3 h-3 mr-2" />
                            NOT STARTED
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="z-10">
                      <p className="text-xs uppercase opacity-80 font-bold tracking-wider">Access Pass</p>
                      <h3 className="text-xl font-bold truncate">{event.department}</h3>
                    </div>
                  </div>

                  {/* Cutout Effect */}
                  <div className="relative h-6 bg-white dark:bg-neutral-900">
                    <div className="absolute -left-3 top-0 bottom-0 w-6 h-6 bg-neutral-50 dark:bg-neutral-950 rounded-full" />
                    <div className="absolute -right-3 top-0 bottom-0 w-6 h-6 bg-neutral-50 dark:bg-neutral-950 rounded-full" />
                    <div className="absolute left-4 right-4 top-[11px] border-t-2 border-dashed border-neutral-200 dark:border-neutral-800" />
                  </div>

                  {/* Ticket Body */}
                  <div className="p-8 pt-2 space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-neutral-500 font-medium mb-2">Status</p>
                      {registrationStatus === 'none' ? (
                        <span className="inline-block px-4 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold text-sm">NOT REGISTERED</span>
                      ) : registrationStatus === 'checked-out' ? (
                        <span className="inline-block px-6 py-2 rounded-full bg-blue-600 text-white font-bold tracking-wide shadow-lg uppercase">CHECKED OUT</span>
                      ) : (
                        <span className={`inline-block px-6 py-2 rounded-full ${colors.bg} text-white font-bold tracking-wide shadow-lg uppercase`}>
                          {registrationStatus.replace('-', ' ')}
                        </span>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                      </div>
                    )}

                    <Button
                      onClick={handleMainAction}
                      disabled={registrationStatus === 'none' && (event.status?.toLowerCase() === 'concluded' || event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'paused')}
                      className={`w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 ${registrationStatus === 'none' && (event.status?.toLowerCase() === 'concluded' || event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'paused')
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none hover:scale-100' // Disabled style
                        : activeButtonColor(registrationStatus, colors)
                        }`}
                    >
                      {registrationStatus === 'none' && (event.status?.toLowerCase() === 'concluded' || event.status?.toLowerCase() === 'completed')
                        ? 'Event Ended'
                        : registrationStatus === 'none' && event.status?.toLowerCase() === 'paused'
                          ? 'Registration Paused'
                          : buttonLabel}
                    </Button>

                    {registrationStatus === 'none' && event.status?.toLowerCase() === 'paused' && (
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-sm flex items-center gap-2 text-center justify-center font-medium">
                        Registration is temporarily paused.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {['checked-in', 'checked-out', 'evaluated'].includes(registrationStatus) && (
                        <Button
                          variant="outline"
                          className="col-span-2 h-12 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
                          onClick={() => setShowTicketModal(true)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          View Ticket
                        </Button>
                      )}
                      <Button variant="outline" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800" onClick={toggleBookmark}>
                        <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current text-red-500 text-red-500' : 'text-neutral-500'}`} />
                        <span className="text-neutral-600 dark:text-neutral-300">{isBookmarked ? 'Saved' : 'Save'}</span>
                      </Button>
                      <Button variant="outline" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <Share2 className="w-4 h-4 mr-2 text-neutral-500" />
                        <span className="text-neutral-600 dark:text-neutral-300">Share</span>
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> Secure blockchain verification
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* TICKET DETAILS MODAL */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Modal Card */}
          <Card className="w-full max-w-4xl mx-6 bg-white dark:bg-neutral-900 border-none rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">

            {/* Left Side: Ticket Visual */}
            <div className={`w-full md:w-1/3 ${colors.bg} p-8 text-white flex flex-col items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-soft-light" />
              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 relative group">
                <QRCodeSVG
                  id="qr-main-svg"
                  value={registrationData?.qr_code_value || `REG-${event.id}-${registrationData?.email}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="font-mono text-center text-white/80 opacity-50 text-xs mb-2">TICKET ID</p>
              <p className="font-mono text-center text-xl font-bold tracking-widest mb-6">{registrationData?.qr_code_value || 'PENDING'}</p>

              <div className="text-center space-y-1">
                <p className="font-bold text-lg leading-tight">{event.name}</p>

              </div>
            </div>

            {/* Right Side: Details */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <Badge variant="outline" className="mb-3 border-neutral-200 dark:border-neutral-700 text-neutral-500">Official Entry Pass</Badge>
                  <h2 className="text-3xl font-black text-neutral-900 dark:text-white leading-none mb-2">{event.name}</h2>
                  <p className="text-neutral-500">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <Button variant="ghost" className="rounded-full h-10 w-10 p-0" onClick={() => setShowTicketModal(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1">Attendee</p>
                    <p className="font-semibold text-lg">{registrationData?.first_name} {registrationData?.last_name}</p>
                    <p className="text-xs text-neutral-500">{registrationData?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1">Affiliation</p>
                    <p className="font-semibold text-lg">{registrationData?.affiliation || 'HCDC'}</p>
                  </div>
                </div>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1">Venue</p>
                    <p className="font-medium">{event.venue || event.location}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-1">Time</p>
                    <p className="font-medium">{event.startTime || event.start_time} - {event.endTime || event.end_time || '-'}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button onClick={handleDownloadQR} className="flex-1 h-12 rounded-xl bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-black">
                    <Download className="w-4 h-4 mr-2" /> Save Ticket Image
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="max-w-md w-full p-8 text-center m-4 bg-white dark:bg-neutral-900 border-none shadow-2xl rounded-3xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${colors.bg}`} />
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-3xl font-black mb-2 text-neutral-900 dark:text-white tracking-tight">You're In!</h3>
            <p className="text-neutral-500 mb-8 text-lg">Registration successful. Your digital pass is ready.</p>
            <Button onClick={() => { setShowSuccessModal(false); setShowTicketModal(true); }} className="w-full h-12 text-lg rounded-xl font-bold bg-neutral-900 text-white hover:bg-neutral-800">
              View Ticket
            </Button>
          </Card>
        </div>
      )}

    </div>
  )
}
