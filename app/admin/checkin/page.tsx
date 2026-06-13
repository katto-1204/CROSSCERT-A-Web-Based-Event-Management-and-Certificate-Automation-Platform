'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, QrCode, BarChart3, Camera, X, CheckCircle2, AlertCircle, Scan, TrendingUp, Users, Zap, Calendar, Clock, Copy, Share2, Volume2, VolumeX, Smartphone, Terminal, Settings, Search, Sparkles, Plus, Trash2, Play, Pause, ArrowRight } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

  // -- Modern Tech States --
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hapticsEnabled, setHapticsEnabled] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [eventFilter, setEventFilter] = useState<'all' | 'live' | 'completed' | 'upcoming'>('all')
  const [logs, setLogs] = useState<{ time: string; message: string; type: 'success' | 'error' | 'info' }[]>([
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: 'Terminal online. Select an event to start scanning.', type: 'info' }
  ])
  const [recentActivity, setRecentActivity] = useState<{
    name: string
    action: 'check-in' | 'check-out'
    time: string
    code: string
  }[]>([])

  const [showAlreadyModal, setShowAlreadyModal] = useState(false)
  const [alreadyModalData, setAlreadyModalData] = useState<SuccessPass | null>(null)

  const addLog = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs((prev) => [{ time, message, type }, ...prev].slice(0, 50))
  }, [])

  const playBeep = useCallback(() => {
    if (!soundEnabled) return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(900, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch (e) {
      console.warn('Failed to play beep:', e)
    }
  }, [soundEnabled])

  const playErrorBeep = useCallback(() => {
    if (!soundEnabled) return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch (e) {
      console.warn('Failed to play error beep:', e)
    }
  }, [soundEnabled])

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
    playErrorBeep()
    addLog(`Error: ${message}`, 'error')
    setScannedCode('')
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
    
    playBeep()
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(40)
    }
    addLog(`QR code detected: ${code}`, 'success')
  }, [isProcessingScan, showSuccess, showErrorModal, showNotStartedModal, selectedEvent, playBeep, hapticsEnabled, addLog])

  const processCheckIn = async () => {
    if (!selectedEvent || !scannedCode) return
    setIsProcessingScan(true)
    addLog(`Sending check-in request for: ${scannedCode}`, 'info')

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
    addLog(`Sending check-out request for: ${scannedCode}`, 'info')

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
    const name = String(data.participant_name ?? 'Guest')
    
    if (already) {
      const event = events.find((e) => e.id.toString() === selectedEvent)
      setAlreadyModalData({
        participantName: name,
        eventTitle: String(data.event_title ?? event?.title ?? 'Event'),
        passCode: code,
        location: event?.date ? `${event.date}` : undefined,
        checkedInAt: data.checked_in_at
          ? new Date(String(data.checked_in_at)).toLocaleString()
          : new Date().toLocaleString(),
        action,
        alreadyPresent: true,
      })
      setShowAlreadyModal(true)
      
      const actionLabel = action === 'check-in' ? 'Already Checked In' : 'Already Checked Out'
      addLog(`${actionLabel} detected for: ${name} (${code})`, 'error')
      playErrorBeep()
      if (hapticsEnabled && navigator.vibrate) {
        navigator.vibrate([60, 40, 60])
      }
      setScannedCode('')
    } else {
      showPassSuccess(data, action, code, false)
      
      const actionLabel = action === 'check-in' ? 'Checked In' : 'Checked Out'
      addLog(`${actionLabel} approved for: ${name} (${code})`, 'success')
      
      // Add to recent activity
      const newActivity = {
        name,
        action,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        code
      }
      setRecentActivity(prev => [newActivity, ...prev].slice(0, 5))
    }

    toast({
      title: already
        ? (action === 'check-in' ? 'Already checked in' : 'Already checked out')
        : `${action === 'check-in' ? 'Check-in' : 'Check-out'} successful`,
      description: `${data.participant_name ?? 'Guest'}${already ? ' was already on the list.' : ` has been ${action === 'check-in' ? 'checked in' : 'checked out'}.`}`,
    })
  }

  const handleApiError = (res: Response, data: Record<string, unknown>, action: 'check-in' | 'check-out', code: string) => {
    const errorMsg = String(data.error ?? data.message ?? `Unable to ${action} participant.`)
    addLog(`System rejected: ${errorMsg}`, 'error')
    if (res.status === 404 || errorMsg.toLowerCase().includes('not found')) {
      showError("Participant ticket not found.")
      return
    }
    showError(errorMsg)
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
              const canScan = !showSuccess && !showErrorModal && !showNotStartedModal && !showAlreadyModal

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
            }, 100) // Faster scanning interval 100ms
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
  }, [cameraActive, handleCodeScanned, isProcessingScan, showSuccess, showErrorModal, showNotStartedModal, showAlreadyModal])

  const handleManualScan = () => {
    // Redundant now, kept for safety or if needed
  }

  const filteredEvents = events.filter((event: EventRecord) => {
    const titleLower = (event.title || event.name || '').toLowerCase()
    const queryLower = searchQuery.toLowerCase()
    const matchesSearch = titleLower.includes(queryLower) || event.id.toString().includes(searchQuery)
                          
    const status = (event.status || '').toLowerCase()
    const matchesFilter = 
      eventFilter === 'all' ||
      (eventFilter === 'live' && status === 'live') ||
      (eventFilter === 'completed' && (status === 'completed' || status === 'concluded')) ||
      (eventFilter === 'upcoming' && status !== 'live' && status !== 'completed' && status !== 'concluded')
      
    return matchesSearch && matchesFilter
  })

  const attendanceRate = totalExpected > 0 ? Math.min(100, Math.round((checkedInCount / totalExpected) * 100)) : 0
  const selectedEventData = events.find((e) => e.id.toString() === selectedEvent)
  const isLiveEvent = selectedEventData?.status?.toLowerCase() === 'live'
  const wizardStep = !selectedEvent ? 1 : cameraActive ? 2 : scannedCode ? 3 : 2

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#09090b] text-foreground p-4 md:p-8 space-y-8 max-w-[1700px] mx-auto animate-in fade-in duration-300">
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-500/5 dark:bg-rose-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Terminal Dashboard
            </button>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-xs font-mono font-semibold text-rose-500 tracking-wider">SECURE-SCAN v2.4</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Attendance Terminal
            </h1>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ONLINE
            </div>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Real-time credential verification and attendance logging console.
          </p>
        </div>

        {/* Stepper Steps */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-neutral-900/60 rounded-lg border dark:border-neutral-800 self-start md:self-auto">
          {[
            { n: 1, label: 'Select Event' },
            { n: 2, label: 'Scan Ticket' },
            { n: 3, label: 'Register Access' },
          ].map((step) => (
            <div
              key={step.n}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                wizardStep >= step.n
                  ? 'bg-background text-foreground shadow-xs border dark:border-neutral-800'
                  : 'text-muted-foreground'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
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

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: EVENT SELECTION & OVERVIEW */}
        <div className="space-y-6">
          <Card className="shadow-xs dark:bg-neutral-950 dark:border-neutral-800">
            <div className="p-5 border-b dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Select Target Event
                </Label>
                {selectedEvent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent('')}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Select
                  </Button>
                )}
              </div>

              {/* Search & Tabs */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs dark:bg-neutral-900 dark:border-neutral-800"
                />
              </div>

              <div className="flex gap-1 bg-muted/50 dark:bg-neutral-900/50 p-0.5 rounded-lg border dark:border-neutral-800/80">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'live', label: 'Live' },
                  { id: 'completed', label: 'Concluded' },
                  { id: 'upcoming', label: 'Upcoming' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEventFilter(tab.id as any)}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      eventFilter === tab.id
                        ? 'bg-background text-foreground shadow-xs border dark:border-neutral-800'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event List scrollbox */}
            <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar space-y-1.5">
              {eventsError && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  {eventsError}
                </div>
              )}

              {eventsLoading ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted/60 dark:bg-neutral-900/60 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No events match the filters.
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const isSelected = selectedEvent === event.id.toString()
                  const status = event.status?.toLowerCase() || ''
                  const isLive = status === 'live'
                  const isCompleted = status === 'completed' || status === 'concluded'

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        if (isLive || isCompleted) {
                          setSelectedEvent(event.id.toString())
                          addLog(`Event selected: ${event.title}`, 'info')
                        } else {
                          setShowNotStartedModal(true)
                        }
                      }}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/5'
                          : 'border-border/60 hover:bg-muted/40 dark:border-neutral-800/60 dark:hover:bg-neutral-900/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 ${
                        isLive
                          ? 'bg-rose-500/10 text-rose-500'
                          : isCompleted
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {event.title?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate text-xs ${isSelected ? 'text-rose-500' : ''}`}>{event.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {event.date || 'No Date'}
                        </p>
                      </div>
                      <Badge variant={isLive ? 'default' : 'outline'} className={`text-[10px] scale-90 ${
                        isLive 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
                          : isCompleted 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {isLive ? 'LIVE' : isCompleted ? 'ENDED' : 'UPCOMING'}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Selected Event Details Panel */}
          {selectedEventData ? (
            <Card className="p-5 shadow-xs border border-rose-500/20 dark:bg-neutral-950 dark:border-neutral-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider mb-1">Active Target</Badge>
                  <h3 className="font-bold text-base text-foreground leading-tight">{selectedEventData.title}</h3>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${selectedEventData.status?.toLowerCase() === 'live' ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedEventData.date || 'TBD'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Timing</p>
                  <p className="font-medium truncate">{selectedEventData.start_time || '00:00'} - {selectedEventData.end_time || '23:59'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Checked-In Progress</span>
                  <span>{checkedInCount} / {totalExpected} guests</span>
                </div>
                <div className="h-2 bg-muted dark:bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center shadow-xs border border-dashed dark:bg-neutral-950 dark:border-neutral-800 text-muted-foreground text-xs leading-relaxed">
              No event targeted. Please select an event above to initialize target metrics.
            </Card>
          )}
        </div>
        {/* PANEL 2: THE SCANNER HUD & TERMINAL CONTROL */}
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-xs dark:bg-neutral-950 dark:border-neutral-800">
            {/* Viewport Header */}
            <div className="p-4 border-b dark:border-neutral-800 flex items-center justify-between bg-muted/20">
              <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-muted-foreground" />
                Live QR Scanner
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] font-medium tracking-wide ${
                  cameraActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {cameraActive ? 'CAPTURING' : 'STANDBY'}
              </Badge>
            </div>

            {/* Viewport Box */}
            {cameraActive ? (
              <div className="relative bg-neutral-950">
                <div
                  className={`relative w-full overflow-hidden transition-all duration-300 ${
                    scannedCode ? 'ring-4 ring-emerald-500/40' : 'ring-1 ring-border/20'
                  }`}
                  style={{ minHeight: '380px', maxHeight: '480px' }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-[1.02]"
                    style={{ minHeight: '380px', maxHeight: '480px' }}
                  />

                  {/* Scan Flash effect */}
                  {scanFlash && (
                    <div className="absolute inset-0 bg-emerald-400/25 scan-flash-overlay pointer-events-none z-20" />
                  )}

                  {/* Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* HUD Top bar badges */}
                  <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                    <div className="bg-background/80 backdrop-blur-md border border-border px-2.5 py-1 rounded-md text-[10px] font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {selectedEventData?.title ? selectedEventData.title : 'No targeted event'}
                    </div>
                  </div>

                  {/* Close camera button */}
                  <button
                    onClick={stopCamera}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-md bg-background/80 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Scanner Grid Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative">
                      {/* Scanning Target frame */}
                      <div
                        className={`relative rounded-lg border transition-all duration-300 ${
                          scannedCode
                            ? 'border-emerald-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.3)]'
                            : 'border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]'
                        }`}
                        style={{ width: 'min(50vw,220px)', height: 'min(50vw,220px)' }}
                      >
                        {/* Pulse Beam */}
                        {!scannedCode && (
                          <div className="absolute inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.6)] scanner-beam" />
                        )}

                        {/* Success icon overlay */}
                        {scannedCode && (
                          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/15 animate-in zoom-in duration-300">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Minimalist Corner brackets */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-[3px]" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-[3px]" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-[3px]" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-[3px]" />
                      </div>
                      
                      {/* Live scanning message below target box */}
                      <p className="mt-4 text-center text-[10px] font-mono tracking-wider px-3 py-1 rounded-full bg-background/90 text-foreground border border-border shadow-sm">
                        {scannedCode ? 'PASSCODE DECODED' : 'POSITION TICKET IN FRAME'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub Camera Control Bar */}
                <div className="p-3 bg-muted/40 border-t dark:border-neutral-850 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 rounded-md text-xs bg-background hover:bg-muted text-muted-foreground hover:text-foreground border"
                    onClick={() => {
                      setScannedCode('')
                      addLog('Scanner rescan triggered.', 'info')
                    }}
                    disabled={!scannedCode}
                  >
                    <Scan className="w-3.5 h-3.5 mr-1.5" /> Clear & Rescan
                  </Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center p-8 py-16 text-center bg-muted/20" style={{ minHeight: '380px' }}>
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center shadow-xs">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                
                <h3 className="text-base font-semibold tracking-tight mb-1">Camera Standby</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-6">
                  {selectedEvent ? 'Target event locked. Initialize the camera feed to begin scanning attendee QR tickets.' : 'Select a targeted event on the sidebar to unlock camera controls.'}
                </p>

                <Button
                  onClick={startCamera}
                  disabled={!selectedEvent}
                  className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[180px] rounded-md text-xs font-semibold shadow-xs disabled:opacity-40"
                >
                  <Camera className="w-4 h-4 mr-2" /> Enable Camera Feed
                </Button>
              </div>
            )}

            {/* Bottom Actions Form */}
            <div className="p-5 border-t dark:border-neutral-800 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Manual Pass Input</Label>
                <div className="relative">
                  <Input
                    placeholder={scannedCode ? 'Passcode Decoded' : cameraActive ? 'Awaiting QR decode...' : 'Or enter pass ID manually'}
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    className={`text-center font-mono text-sm tracking-widest h-11 dark:bg-neutral-900 dark:border-neutral-800 transition-all ${
                      scannedCode ? 'border-emerald-500/60 ring-2 ring-emerald-500/10' : ''
                    }`}
                  />
                  {lastScannedAt && scannedCode && (
                    <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 text-center mt-1">
                      READ AT {lastScannedAt.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons based on Event Status */}
              {selectedEvent && isLiveEvent && (
                <Button
                  onClick={processCheckIn}
                  className={`w-full h-11 font-bold text-xs rounded-lg transition-all ${
                    scannedCode
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                      : 'bg-muted dark:bg-neutral-900 text-muted-foreground cursor-not-allowed border dark:border-neutral-800'
                  }`}
                  disabled={!scannedCode || isProcessingScan}
                >
                  {isProcessingScan ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      LOGGING ACCESS
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> APPROVED CHECK-IN
                    </span>
                  )}
                </Button>
              )}

              {selectedEvent && ['completed', 'concluded', 'paused'].includes(selectedEventData?.status?.toLowerCase() || '') && (
                <Button
                  onClick={processCheckOut}
                  className={`w-full h-11 font-bold text-xs rounded-lg transition-all ${
                    scannedCode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-muted dark:bg-neutral-900 text-muted-foreground cursor-not-allowed border dark:border-neutral-800'
                  }`}
                  disabled={!scannedCode || isProcessingScan}
                >
                  {isProcessingScan ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      LOGGING CHECKOUT
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> APPROVED CHECK-OUT
                    </span>
                  )}
                </Button>
              )}

              {/* Terminal settings bar */}
              <div className="pt-3 border-t dark:border-neutral-800/80 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Settings className="w-3.5 h-3.5" /> SETTINGS
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSoundEnabled(!soundEnabled)
                      addLog(`Sound ${!soundEnabled ? 'enabled' : 'muted'}`, 'info')
                    }}
                    className={`flex items-center gap-1 hover:text-foreground transition-colors ${soundEnabled ? 'text-rose-500 font-semibold' : ''}`}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>Sound</span>
                  </button>
                  <button
                    onClick={() => {
                      setHapticsEnabled(!hapticsEnabled)
                      addLog(`Vibration ${!hapticsEnabled ? 'enabled' : 'disabled'}`, 'info')
                    }}
                    className={`flex items-center gap-1 hover:text-foreground transition-colors ${hapticsEnabled ? 'text-rose-500 font-semibold' : ''}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Haptics</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* PANEL 3: REAL-TIME PULSE LOGS & RECENT PASSES */}
        <div className="space-y-6">
          {/* Quick Metrics */}
          <Card className="p-5 shadow-xs dark:bg-neutral-950 dark:border-neutral-800 space-y-4">
            <h2 className="font-semibold text-sm tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              Real-time Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Checked In</p>
                <p className="text-3xl font-bold font-mono tracking-tight leading-none text-emerald-600 dark:text-emerald-400">{checkedInCount}</p>
              </div>
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/20 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-blue-500 tracking-wider uppercase">Checked Out</p>
                <p className="text-3xl font-bold font-mono tracking-tight leading-none text-blue-500">{checkedOutCount}</p>
              </div>
            </div>
          </Card>

          {/* Console Log Terminal Output */}
          <Card className="shadow-xs dark:bg-neutral-950 dark:border-neutral-800 overflow-hidden">
            <div className="p-3 border-b dark:border-neutral-800 bg-muted/20 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-wider flex items-center gap-1.5 text-muted-foreground">
                <Terminal className="w-3.5 h-3.5" /> TERMINAL_LOG
              </span>
              <button
                onClick={() => setLogs([{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: 'Terminal cleared.', type: 'info' }])}
                className="text-[9px] font-mono hover:text-rose-500 text-muted-foreground transition-colors"
              >
                CLEAR
              </button>
            </div>
            
            <div className="bg-[#09090b] text-neutral-300 font-mono text-[10px] p-4 h-[160px] overflow-y-auto scrollbar-thin space-y-1 border-t dark:border-neutral-900">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start leading-normal">
                  <span className="text-muted-foreground/60 select-none shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'error'
                        ? 'text-rose-400 font-semibold'
                        : 'text-neutral-400'
                  }>
                    {log.type === 'error' ? '✖ ' : log.type === 'success' ? '✔ ' : '> '}
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Verified Activity Feed */}
          <Card className="p-5 shadow-xs dark:bg-neutral-950 dark:border-neutral-800 space-y-4">
            <h2 className="font-semibold text-sm tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              Recent Verified Passes
            </h2>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No scan history in this session yet.
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2.5 last:border-b-0 last:pb-0 dark:border-neutral-900 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                        {activity.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate text-foreground">{activity.name}</p>
                        <p className="text-[9px] font-mono text-muted-foreground truncate">{activity.code}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={`text-[9px] scale-90 ${
                        activity.action === 'check-in' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {activity.action === 'check-in' ? 'IN' : 'OUT'}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Processing/Loading Modal */}
      {isProcessingScan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="rounded-xl p-6 bg-background dark:bg-neutral-950 w-full max-w-sm mx-4 shadow-xl border dark:border-neutral-800 text-center scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Verifying Ticket</h3>
            <p className="text-xs text-muted-foreground">Connecting to credentials secure server...</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <NotStartedModal />

      {/* Already Checked In / Checked Out Warning Modal */}
      {showAlreadyModal && alreadyModalData && (
        <div
          className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => { setShowAlreadyModal(false); setAlreadyModalData(null) }}
        >
          <div
            className="w-full max-w-sm animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-card border border-amber-500/30 dark:border-amber-500/20 shadow-xl overflow-hidden text-card-foreground">
              {/* Header */}
              <div className="p-5 border-b border-amber-500/20 dark:border-amber-500/10 bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <Badge className="text-[9px] tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 mb-1">
                      Duplicate Scan Detected
                    </Badge>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {alreadyModalData.action === 'check-in' ? 'Already Checked In' : 'Already Checked Out'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Guest Name</p>
                    <p className="font-bold text-sm truncate">{alreadyModalData.participantName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Status</p>
                    <p className="font-bold text-amber-500">
                      {alreadyModalData.action === 'check-in' ? 'Already Present' : 'Already Left'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Target Event</p>
                  <p className="font-medium text-foreground line-clamp-1">{alreadyModalData.eventTitle}</p>
                </div>

                <div className="space-y-1 font-mono">
                  <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Ticket Code</p>
                  <p className="font-semibold text-muted-foreground truncate">{alreadyModalData.passCode}</p>
                </div>

                {alreadyModalData.checkedInAt && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[9px] tracking-wider">
                      {alreadyModalData.action === 'check-in' ? 'Originally Checked In' : 'Originally Checked Out'}
                    </p>
                    <p className="font-medium">{alreadyModalData.checkedInAt}</p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
                  This participant has already been {alreadyModalData.action === 'check-in' ? 'checked in' : 'checked out'} for this event. No further action is needed.
                </div>
              </div>

              <div className="p-5 border-t dark:border-neutral-800 bg-muted/20">
                <Button
                  className="w-full h-10 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 font-semibold text-xs"
                  onClick={() => { setShowAlreadyModal(false); setAlreadyModalData(null) }}
                >
                  Dismiss &amp; Continue Scanning
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal — wallet-style pass card */}
      {showSuccess && successPass && (
        <div
          className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => { setShowSuccess(false); setSuccessPass(null) }}
        >
          <div
            className="w-full max-w-sm animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-card border dark:border-neutral-800 shadow-xl overflow-hidden text-card-foreground">
              {/* Header */}
              <div className="p-5 border-b dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <Badge className="text-[9px] tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 mb-1">
                    {successPass.action === 'check-in' ? 'Check-In Pass' : 'Check-Out Pass'}
                  </Badge>
                  <h3 className="text-lg font-bold tracking-tight">
                    {successPass.alreadyPresent ? 'Already Verified' : 'Access Granted ✓'}
                  </h3>
                </div>
                
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const text = `${successPass.participantName}\n${successPass.eventTitle}\n${successPass.passCode}`
                      if (navigator.share) {
                        try { await navigator.share({ title: 'Event Pass', text }) } catch { /* cancelled */ }
                      } else {
                        await navigator.clipboard.writeText(text)
                        toast({ title: 'Copied', description: 'Pass details copied to clipboard.' })
                      }
                    }}
                    className="w-8 h-8 rounded-md bg-muted dark:bg-neutral-900 border dark:border-neutral-850 hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(successPass.passCode)
                      toast({ title: 'Copied', description: 'Pass code copied.' })
                    }}
                    className="w-8 h-8 rounded-md bg-muted dark:bg-neutral-900 border dark:border-neutral-850 hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pass details */}
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Guest Name</p>
                    <p className="font-bold text-sm truncate">{successPass.participantName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Status</p>
                    <p className={`font-bold ${successPass.alreadyPresent ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {successPass.alreadyPresent ? 'Already Present' : 'Approved'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Target Event</p>
                  <p className="font-medium text-foreground line-clamp-1">{successPass.eventTitle}</p>
                </div>

                <div className="space-y-1 font-mono">
                  <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Secure Ticket Code</p>
                  <p className="font-semibold text-muted-foreground truncate">{successPass.passCode}</p>
                </div>

                {successPass.checkedInAt && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[9px] tracking-wider">Timestamp</p>
                    <p className="font-medium">{successPass.checkedInAt}</p>
                  </div>
                )}

                {/* QR Display */}
                <div className="flex flex-col items-center justify-center pt-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-white border dark:border-neutral-850 shadow-inner">
                    <QRCodeSVG value={successPass.passCode} size={96} level="M" includeMargin={false} />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t dark:border-neutral-800 bg-muted/20">
                <Button
                  className="w-full h-10 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 font-semibold text-xs"
                  onClick={() => { setShowSuccess(false); setSuccessPass(null) }}
                >
                  Return to Scan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="rounded-xl p-6 bg-card dark:bg-neutral-950 border dark:border-neutral-800 w-full max-w-sm mx-4 shadow-xl text-center scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 animate-shake">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Access Rejected</h3>
            <p className="text-xs text-muted-foreground mb-6 leading-normal">{errorModalMessage}</p>
            <Button
              className="w-full bg-destructive text-white hover:opacity-90 rounded-md text-xs font-semibold h-10"
              onClick={() => setShowErrorModal(false)}
            >
              Acknowledge & Dismiss
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
