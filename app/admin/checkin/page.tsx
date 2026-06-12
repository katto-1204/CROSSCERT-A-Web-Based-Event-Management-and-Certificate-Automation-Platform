'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, QrCode, BarChart3, Camera, X, CheckCircle2, AlertCircle, Scan, TrendingUp, Users, Zap, Calendar, Clock, Copy, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiCall } from '@/lib/api-config'
import { toast } from '@/hooks/use-toast'
import jsQR from 'jsqr'

type EventRecord = {
  id: number
  title?: string
  name?: string
  status?: string
  date?: string
  start_time?: string
  end_time?: string
}

type SuccessPass = {
  participantName: string
  eventTitle: string
  passCode: string
  location?: string
  checkedInAt?: string
  action: 'check-in' | 'check-out'
  alreadyPresent?: boolean
}

export default function AdminCheckIn() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [events, setEvents] = useState<EventRecord[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [checkedOutCount, setCheckedOutCount] = useState(0)
  const [totalExpected, setTotalExpected] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastAction, setLastAction] = useState<'check-in' | 'check-out' | null>(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showNotStartedModal, setShowNotStartedModal] = useState(false)
  const [scanFlash, setScanFlash] = useState(false)
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null)
  const [successPass, setSuccessPass] = useState<SuccessPass | null>(null)

  // -- Modal for Event Not Started --
  const NotStartedModal = () => (
    showNotStartedModal ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-300 text-center border border-neutral-200 dark:border-neutral-800">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Event Not Started Yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            You cannot check in participants for this event because it has not started yet.
          </p>
          <Button
            onClick={() => setShowNotStartedModal(false)}
            className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl py-6"
          >
            Okay, got it
          </Button>
        </div>
      </div>
    ) : null
  )

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true)
      setEventsError('')
      try {
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          try {
            const list = JSON.parse(existing) as EventRecord[]
            const validEvents = (Array.isArray(list) ? list : [])
              .filter((evt) => evt && evt.id)
              .map((evt) => ({
                id: evt.id,
                title: evt.title || evt.name || `Event #${evt.id}`,
                status: evt.status,
                date: evt.date,
                start_time: evt.start_time,
                end_time: evt.end_time,
              }))
            setEvents(validEvents)
            setEventsLoading(false)
            return
          } catch (parseErr) {
            // Continue to API fetch
          }
        }

        const res = await apiCall.get(api.events())
        if (!res.ok) {
          if (res.status === 403) {
            setEventsError('Access denied. Please ensure you are logged in as an admin.')
          } else {
            setEventsError('Unable to load events. Please try again.')
          }
          setEvents([])
          return
        }
        const data = await res.json()

        const events: EventRecord[] = Array.isArray(data)
          ? data
          : (data.results || data.data || [])

        const validEvents = events
          .filter((evt) => evt && evt.id)
          .map((evt) => ({
            id: evt.id,
            title: evt.title || evt.name || `Event #${evt.id}`,
            status: evt.status,
            date: evt.date,
            start_time: evt.start_time,
            end_time: evt.end_time,
          }))

        setEvents(validEvents)
        if (validEvents.length === 0 && events.length > 0) {
          setEventsError('Events loaded but none are valid.')
        }
      } catch (err: any) {
        setEventsError(err.message || 'Unable to load events. Please check your connection.')
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const fetchEventStats = useCallback(async () => {
    if (!selectedEvent) {
      setCheckedInCount(0)
      setCheckedOutCount(0)
      setTotalExpected(0)
      return
    }

    try {
      const regsUrl = `${api.registrations()}?event=${selectedEvent}`
      const regsRes = await apiCall.get(regsUrl)

      if (regsRes.ok) {
        let regsData
        try {
          regsData = await regsRes.json()
        } catch (e) {
          console.error('Failed to parse registrations JSON', e)
          return
        }

        const registrations = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
        setTotalExpected(registrations.length)

        const checkedIn = registrations.filter((reg: any) => reg.is_present === true).length
        setCheckedInCount(checkedIn)

        // Fetch check-ins to count check-outs
        try {
          const checkInsUrl = `${api.checkIns()}?registration__event=${selectedEvent}`
          const checkInsRes = await apiCall.get(checkInsUrl)
          if (checkInsRes.ok) {
            const checkInsData = await checkInsRes.json()
            const checkIns = Array.isArray(checkInsData) ? checkInsData : (checkInsData.results || checkInsData.data || [])
            const checkedOut = checkIns.filter((ci: any) => ci.check_out_at !== null && ci.check_out_at !== undefined).length
            setCheckedOutCount(checkedOut)
          }
        } catch (err) {
          console.error('Failed to fetch check-out stats:', err)
        }
      } else {
        console.warn('Failed to fetch stats:', regsRes.status)
      }
    } catch (err) {
      console.error('Failed to fetch event stats:', err)
    }
  }, [selectedEvent])

  useEffect(() => {
    fetchEventStats()
  }, [selectedEvent, fetchEventStats])

  const showError = (message: string) => {
    setShowSuccess(false)
    setErrorModalMessage(message)
    setShowErrorModal(true)
  }

  // New Handler: Just capture the code, don't submit yet
  const handleCodeScanned = useCallback((code: string) => {
    if (isProcessingScan || showSuccess || showErrorModal || showNotStartedModal) return
    if (!selectedEvent) {
      showError('Please select an event first.')
      return
    }
    setScannedCode(code)
    setScanFlash(true)
    setLastScannedAt(new Date())
    window.setTimeout(() => setScanFlash(false), 550)
    if (navigator.vibrate) navigator.vibrate(40)
  }, [isProcessingScan, showSuccess, showErrorModal, showNotStartedModal, selectedEvent])

  const processCheckIn = async () => {
    if (!selectedEvent || !scannedCode) return
    setIsProcessingScan(true)

    // Validate Event ID match
    const qrParts = scannedCode.trim().split('-')
    if (qrParts.length >= 3 && qrParts[0] === 'REG') {
      const qrEventId = qrParts[1]
      if (qrEventId !== selectedEvent) {
        showError(`This ticket belongs to a different event (ID: ${qrEventId}).`)
        setIsProcessingScan(false)
        return
      }
    }

    try {
      const res = await apiCall.post(`${api.checkIns()}check-in-by-code/`, {
        code: scannedCode.trim(),
      })
      const data = await res.json()

      if (!res.ok) {
        handleApiError(res, data, 'check-in', scannedCode.trim())
        return
      }

      handleApiSuccess(data, 'check-in', scannedCode.trim())
    } catch (err) {
      showError('Network error during check-in.')
    } finally {
      setIsProcessingScan(false)
    }
  }

  const processCheckOut = async () => {
    if (!selectedEvent || !scannedCode) return
    setIsProcessingScan(true)

    try {
      const res = await apiCall.post(`${api.checkIns()}check-out-by-code/`, {
        code: scannedCode.trim(),
      })
      const data = await res.json()

      if (!res.ok) {
        handleApiError(res, data, 'check-out', scannedCode.trim())
        return
      }

      handleApiSuccess(data, 'check-out', scannedCode.trim())
    } catch (err) {
      showError('Network error during check-out.')
    } finally {
      setIsProcessingScan(false)
    }
  }

  // Helper to handle API Success
  const showPassSuccess = (data: Record<string, unknown>, action: 'check-in' | 'check-out', code: string, alreadyPresent = false) => {
    const name = String(data.participant_name ?? 'Guest')
    const event = events.find((e) => e.id.toString() === selectedEvent)
    setParticipantName(name)
    setSuccessPass({
      participantName: name,
      eventTitle: String(data.event_title ?? event?.title ?? 'Event'),
      passCode: code,
      location: event?.date ? `${event.date}` : undefined,
      checkedInAt: data.checked_in_at
        ? new Date(String(data.checked_in_at)).toLocaleString()
        : new Date().toLocaleString(),
      action,
      alreadyPresent,
    })
    fetchEventStats()
    setShowSuccess(true)
    setLastAction(action)
    setScannedCode('')
    setTimeout(() => {
      setShowSuccess(false)
      setSuccessPass(null)
    }, 6000)
  }

  const handleApiSuccess = (data: Record<string, unknown>, action: 'check-in' | 'check-out', code: string) => {
    const already = Boolean(data.already_checked_in || data.already_checked_out)
    showPassSuccess(data, action, code, already)
    toast({
      title: already
        ? (action === 'check-in' ? 'Already checked in' : 'Already checked out')
        : `${action === 'check-in' ? 'Check-in' : 'Check-out'} successful`,
      description: `${data.participant_name ?? 'Guest'}${already ? ' was already on the list.' : ` has been ${action === 'check-in' ? 'checked in' : 'checked out'}.`}`,
    })
  }

  const handleApiError = (res: Response, data: Record<string, unknown>, action: 'check-in' | 'check-out', code: string) => {
    if (res.status === 404 || String(data.message ?? '').toLowerCase().includes('not found')) {
      showError("Participant ticket not found.")
      return
    }
    showError(String(data.error ?? data.message ?? `Unable to ${action} participant.`))
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('Your browser does not support camera access.')
      return
    }

    try {
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch (backCameraError) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      }

      if (stream) {
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err: any) {
      showError('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setIsProcessingScan(false)
  }

  // Camera handling effect
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current
      const stream = streamRef.current

      video.srcObject = stream

      video.onloadedmetadata = () => {
        if (video) {
          video.play().catch(() => { })
        }
      }

      if (canvasRef.current && video) {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (context) {
          const updateCanvasSize = () => {
            if (video.videoWidth && video.videoHeight) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
            }
          }

          video.addEventListener('loadedmetadata', updateCanvasSize)
          video.addEventListener('resize', updateCanvasSize)
          updateCanvasSize()

          const startScanning = setTimeout(() => {
            scanIntervalRef.current = setInterval(() => {
              const isReady = video.readyState === video.HAVE_ENOUGH_DATA

              // Fallback dimensions if canvas size is 0
              if (canvas.width === 0 || canvas.height === 0) {
                if (video.videoWidth) {
                  canvas.width = video.videoWidth
                  canvas.height = video.videoHeight
                }
              }

              const hasValidSize = canvas.width > 0 && canvas.height > 0
              const notProcessing = !isProcessingScan

              // Only scan if no modals are open
              const canScan = !showSuccess && !showErrorModal && !showNotStartedModal

              if (isReady && hasValidSize && notProcessing && canScan) {
                try {
                  context.drawImage(video, 0, 0, canvas.width, canvas.height)
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                  // Attempt both normal and inverted (for dark mode) QR codes
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth',
                  })

                  if (code && code.data && code.data.trim() !== '') {
                    // CHANGED: Instead of handleAutoScan, we just capture the code
                    handleCodeScanned(code.data)
                  }
                } catch (e) {
                  // ignore frame read errors
                }
              }
            }, 150) // Faster scanning interval 150ms
          }, 500) // Shorter startup delay

          return () => {
            clearTimeout(startScanning)
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
            video.removeEventListener('loadedmetadata', updateCanvasSize)
            video.removeEventListener('resize', updateCanvasSize)
          }
        }
      }
    } else {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    }
  }, [cameraActive, handleCodeScanned, isProcessingScan, showSuccess, showErrorModal, showNotStartedModal])

  const handleManualScan = () => {
    // Redundant now, kept for safety or if needed
  }

  const attendanceRate = totalExpected > 0 ? Math.min(100, Math.round((checkedInCount / totalExpected) * 100)) : 0
  const selectedEventData = events.find((e) => e.id.toString() === selectedEvent)
  const isLiveEvent = selectedEventData?.status?.toLowerCase() === 'live'
  const wizardStep = !selectedEvent ? 1 : cameraActive ? 2 : scannedCode ? 3 : 2

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/90 via-white to-neutral-50 dark:from-[#0a0a0b] dark:via-[#0a0a0b] dark:to-neutral-950 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-300/25 dark:bg-rose-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-300/20 dark:bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Back</span>
        </button>

        {/* Step pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { n: 1, label: 'Pick event' },
            { n: 2, label: 'Scan pass' },
            { n: 3, label: 'Check in' },
          ].map((step) => (
            <div
              key={step.n}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                wizardStep >= step.n
                  ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                  : 'bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-white/5 dark:text-neutral-500 dark:border-white/10'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                wizardStep >= step.n
                  ? 'bg-rose-500 text-white'
                  : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
              }`}>
                {wizardStep > step.n ? '✓' : step.n}
              </span>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center md:text-left space-y-1">
        <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-[family-name:var(--font-display)]">
          Guest Check-In
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base max-w-lg">
          Point at the guest&apos;s pass — we&apos;ll catch the code instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner Section */}
        <div className="lg:col-span-2 space-y-5">
          {/* Event Selector — compact chips for live events */}
          <Card className="p-5 border border-neutral-200 bg-white/90 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg dark:shadow-2xl rounded-3xl">
            <Label className="text-neutral-900 dark:text-white font-semibold text-base mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Which event?
            </Label>
            {eventsError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">{eventsError}</p>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
              {events.filter(e => ['live', 'completed', 'concluded'].includes(e.status?.toLowerCase() || '')).map((event) => {
                const isSelected = selectedEvent === event.id.toString()
                const isLive = event.status?.toLowerCase() === 'live'
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEvent(event.id.toString())}
                    className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 border ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 scale-105'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-rose-300 hover:text-rose-700 dark:bg-white/5 dark:text-neutral-300 dark:border-white/10 dark:hover:border-rose-500/40 dark:hover:text-white'
                    }`}
                  >
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 mr-2 animate-pulse" />}
                    {event.title}
                  </button>
                )
              })}
            </div>

            <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {eventsLoading ? (
                <div className="text-center py-6 text-neutral-500">Loading events…</div>
              ) : events.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">No events found.</div>
              ) : (
                events.map((event) => {
                  const isSelected = selectedEvent === event.id.toString()
                  const isLive = event.status?.toLowerCase() === 'live'
                  const isCompleted = event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded'

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        if (isLive || isCompleted) setSelectedEvent(event.id.toString())
                        else setShowNotStartedModal(true)
                      }}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-rose-300 bg-rose-50 dark:border-rose-500/60 dark:bg-rose-500/10'
                          : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 dark:border-white/8 dark:bg-white/3 dark:hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isLive
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300'
                          : isCompleted
                            ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {event.title?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate text-sm ${isSelected ? 'text-rose-900 dark:text-white' : 'text-neutral-800 dark:text-neutral-300'}`}>{event.title}</p>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">
                          {isLive ? '● Live now' : isCompleted ? 'Ended' : 'Upcoming'}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />}
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Scanner — hero viewport */}
          <Card className="overflow-hidden border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg dark:shadow-2xl rounded-3xl p-0">
            {cameraActive ? (
              <div className="relative">
                <div className="relative w-full overflow-hidden bg-black" style={{ minHeight: '380px', maxHeight: '520px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-105"
                    style={{ minHeight: '380px', maxHeight: '520px' }}
                  />

                  {scanFlash && (
                    <div className="absolute inset-0 bg-emerald-400/40 scan-flash-overlay pointer-events-none z-20" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                  {/* Animated scan viewport */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-10">
                    <div className="relative scanner-pulse-frame">
                      {/* Rotating gradient ring */}
                      <div className="absolute -inset-3 rounded-[2rem] opacity-60 scanner-ring bg-[conic-gradient(from_0deg,transparent,rgba(251,113,133,0.8),transparent,rgba(167,139,250,0.6),transparent)]" />
                      <div className="relative h-[min(55vw,270px)] w-[min(55vw,270px)] rounded-[1.75rem] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] overflow-hidden">
                        {/* Scan beam */}
                        <div className="absolute inset-x-4 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_20px_rgba(251,113,133,0.9)] scanner-beam" />
                        {/* Corner accents */}
                        <span className="absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-rose-400 rounded-tl-lg scanner-corner-glow" />
                        <span className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-rose-400 rounded-tr-lg scanner-corner-glow" />
                        <span className="absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-rose-400 rounded-bl-lg scanner-corner-glow" />
                        <span className="absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-rose-400 rounded-br-lg scanner-corner-glow" />
                      </div>
                    </div>
                  </div>

                  {/* Top chips */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white border border-white/10 max-w-[70%]">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                      <span className="truncate">{selectedEventData?.title || 'Event'}</span>
                    </div>
                    {scannedCode && (
                      <div className="shrink-0 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[11px] font-bold text-white animate-in zoom-in duration-200">
                        Code found!
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-sm z-10">
                    <div className="rounded-2xl bg-black/60 backdrop-blur-xl px-4 py-3 text-center text-sm text-white/90 border border-white/10">
                      {scannedCode ? (
                        <span className="text-emerald-300 font-semibold">Ready — tap check in below</span>
                      ) : (
                        <>Hold steady over the guest&apos;s <span className="text-rose-300 font-semibold">Wallet</span> pass</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3 bg-neutral-100 dark:bg-black/40 border-t border-neutral-200 dark:border-white/10">
                  <Button onClick={stopCamera} variant="outline" className="rounded-xl border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                    <X className="w-4 h-4 mr-2" /> Close
                  </Button>
                  <Button variant="secondary" className="rounded-xl" onClick={() => setScannedCode('')} disabled={!scannedCode}>
                    Rescan
                  </Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center bg-gradient-to-b from-rose-50/50 to-white dark:from-transparent dark:to-transparent" style={{ minHeight: '380px' }}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,113,133,0.15),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(251,113,133,0.12),transparent_70%)]" />
                <div className="relative mb-8 float-soft">
                  <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-rose-500/30 dark:shadow-rose-500/40">
                    <QrCode className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute -inset-4 rounded-[2.5rem] border border-rose-300/50 dark:border-rose-500/30 scanner-pulse-frame" />
                </div>
                <h3 className="relative text-2xl font-bold text-neutral-900 dark:text-white mb-2">Ready to scan</h3>
                <p className="relative text-neutral-600 dark:text-neutral-400 text-sm mb-8 max-w-xs leading-relaxed">
                  {selectedEvent ? 'Open the camera and point at the guest pass.' : 'Choose an event above first.'}
                </p>
                <Button
                  onClick={startCamera}
                  disabled={!selectedEvent}
                  className="relative bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 hover:opacity-90 text-white min-w-[240px] h-14 rounded-2xl text-base font-bold shadow-xl shadow-rose-600/40 disabled:opacity-40"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Open camera
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="p-5 space-y-4 border-t border-neutral-200 bg-neutral-50/80 dark:border-white/10 dark:bg-white/3">
              <div className="relative">
                <Input
                  placeholder={scannedCode ? 'Pass captured ✓' : 'Waiting for scan…'}
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className={`bg-white dark:bg-black/30 text-center text-base rounded-2xl border-neutral-200 text-neutral-900 placeholder:text-neutral-400 h-14 dark:border-white/10 dark:text-white dark:placeholder:text-neutral-500 ${
                    scannedCode ? 'border-emerald-400 ring-1 ring-emerald-400/30 dark:border-emerald-500/50 dark:ring-emerald-500/30' : ''
                  }`}
                />
                {lastScannedAt && scannedCode && (
                  <p className="text-[10px] text-neutral-500 text-center mt-1.5">
                    Scanned at {lastScannedAt.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {selectedEvent && isLiveEvent && (
                <Button
                  onClick={processCheckIn}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold text-lg py-7 rounded-2xl shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  disabled={!scannedCode}
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Welcome guest — check in
                </Button>
              )}

              {selectedEvent && (['completed', 'concluded', 'paused'].includes(selectedEventData?.status?.toLowerCase() || '')) && (
                <Button
                  onClick={processCheckOut}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-bold text-lg py-7 rounded-2xl shadow-lg shadow-sky-500/25"
                  disabled={!scannedCode}
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Check out guest
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Stats Panel */}
        <div className="space-y-5">
          <Card className="p-6 border border-neutral-200 bg-white/90 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-lg dark:shadow-2xl rounded-3xl h-full">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-5 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              Live pulse
            </h2>

            <div className="space-y-3">
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 dark:from-emerald-500/20 dark:to-green-600/10 dark:border-emerald-500/20">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Checked in</p>
                <p className="text-5xl font-extrabold text-emerald-800 dark:text-white tabular-nums">{checkedInCount}</p>
              </div>

              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 dark:from-sky-500/20 dark:to-blue-600/10 dark:border-sky-500/20">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1">Checked out</p>
                <p className="text-4xl font-extrabold text-sky-800 dark:text-white tabular-nums">{checkedOutCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex justify-between items-center dark:bg-white/5 dark:border-white/10">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Expected</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalExpected}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Attendance</p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-300">{attendanceRate}%</p>
                </div>
              </div>

              <div className="h-2 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-violet-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Processing/Loading Modal */}
      {isProcessingScan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="rounded-3xl p-8 bg-white dark:bg-neutral-900 w-full max-w-sm mx-4 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center scale-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 border-4 border-neutral-300 dark:border-neutral-700 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Processing...</h3>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Please wait while we verify the ticket.</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <NotStartedModal />

      {/* Success Modal — wallet-style pass card */}
      {showSuccess && successPass && (
        <div
          className="fixed inset-0 bg-blue-900/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => { setShowSuccess(false); setSuccessPass(null) }}
        >
          <div
            className="w-full max-w-md animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-[2rem] bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
              {/* Card header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    {successPass.action === 'check-in' ? 'Event Pass' : 'Check-Out Pass'}
                  </p>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                    {successPass.alreadyPresent ? 'Already verified' : 'Verified ✓'}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const text = `${successPass.participantName}\n${successPass.eventTitle}\n${successPass.passCode}`
                      if (navigator.share) {
                        try { await navigator.share({ title: 'Event Pass', text }) } catch { /* cancelled */ }
                      } else {
                        await navigator.clipboard.writeText(text)
                        toast({ title: 'Copied', description: 'Pass details copied.' })
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 transition-colors"
                    aria-label="Share pass"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(successPass.passCode)
                      toast({ title: 'Copied', description: 'Pass code copied.' })
                    }}
                    className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 transition-colors"
                    aria-label="Copy pass code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card body — details + QR */}
              <div className="flex gap-4 px-6 py-4">
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Guest name</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white truncate">{successPass.participantName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Event</p>
                    <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2">{successPass.eventTitle}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Pass ID</p>
                    <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white break-all">{successPass.passCode}</p>
                  </div>
                  {successPass.checkedInAt && (
                    <div>
                      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                        {successPass.action === 'check-in' ? 'Checked in' : 'Checked out'}
                      </p>
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{successPass.checkedInAt}</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-inner">
                    <QRCodeSVG value={successPass.passCode} size={108} level="M" includeMargin={false} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    successPass.action === 'check-in'
                      ? successPass.alreadyPresent
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                  }`}>
                    {successPass.alreadyPresent ? 'Duplicate scan' : successPass.action === 'check-in' ? 'Checked in' : 'Checked out'}
                  </span>
                </div>
              </div>

              <div className="px-6 pb-6">
                <Button
                  className="w-full rounded-2xl py-6 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold"
                  onClick={() => { setShowSuccess(false); setSuccessPass(null) }}
                >
                  Done — scan next guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="rounded-3xl p-8 bg-white dark:bg-neutral-900 w-full max-w-sm mx-4 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center scale-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6 animate-shake">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Error</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">{errorModalMessage}</p>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6"
              onClick={() => setShowErrorModal(false)}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 8%; opacity: 0.35; }
          50% { top: 88%; opacity: 1; }
        }
        .animate-scan {
          animation: scan 2.4s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
