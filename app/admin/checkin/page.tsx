'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, QrCode, BarChart3, Camera, X, CheckCircle2, AlertCircle, Scan, TrendingUp, Users, Zap, Calendar, Clock } from 'lucide-react'
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
      showError('Please select an event first')
      return
    }
    setScannedCode(code)
    // Optional: Add a small beep or visual feedback here that code was captured
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
        handleApiError(res, data, 'check-in')
        return
      }

      handleApiSuccess(data, 'check-in')
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
        handleApiError(res, data, 'check-out')
        return
      }

      handleApiSuccess(data, 'check-out')
    } catch (err) {
      showError('Network error during check-out.')
    } finally {
      setIsProcessingScan(false)
    }
  }

  // Helper to handle API Success
  const handleApiSuccess = (data: any, action: 'check-in' | 'check-out') => {
    setParticipantName(`${data.participant_name ?? 'Participant'}`)
    fetchEventStats()
    setShowSuccess(true)
    setLastAction(action)
    toast({
      title: `${action === 'check-in' ? 'Check-in' : 'Check-out'} Successful`,
      description: `${data.participant_name ?? 'Participant'} has been ${action === 'check-in' ? 'checked in' : 'checked out'}.`,
    })

    // Clear code after success
    setScannedCode('')
    setTimeout(() => {
      setShowSuccess(false)
    }, 2000)
  }

  // Helper to handle API Errors
  const handleApiError = (res: any, data: any, action: 'check-in' | 'check-out') => {
    if (res.status === 404 || data.message?.toLowerCase().includes('not found')) {
      showError("Participant ticket not found.")
      return
    }
    if (data.message?.includes('Already checked in') || data.message?.includes('Already checked out')) {
      toast({ title: "Notice", description: data.message, className: "bg-yellow-50 text-yellow-800 border-yellow-200" })
      setScannedCode('') // Clear code to prevent loop
      return
    }
    showError(data.error || data.message || `Unable to ${action} participant.`)
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

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Friendly Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-rose-950/30 border border-rose-100 dark:border-neutral-800 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-rose-200/40 via-transparent to-transparent dark:from-rose-900/20 rounded-full blur-3xl -mr-24 -mt-24" />
        <div className="relative">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mb-5 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Go back</span>
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-lg shadow-rose-400/30 shrink-0">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">Guest Check-In</h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-lg mt-1 max-w-xl">
                Welcome your attendees — just point the camera at their event pass.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Selector */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm">
            <Label className="text-neutral-900 dark:text-white font-semibold text-lg mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Select Event
            </Label>
            {eventsError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">{eventsError}</p>
            )}

            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {eventsLoading ? (
                <div className="text-center py-8 text-neutral-500">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">No events found.</div>
              ) : (
                events.map((event) => {
                  const isSelected = selectedEvent === event.id.toString()
                  const isLive = event.status?.toLowerCase() === 'live'
                  const isCompleted = event.status?.toLowerCase() === 'completed' || event.status?.toLowerCase() === 'concluded'

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        if (isLive || isCompleted) {
                          setSelectedEvent(event.id.toString())
                        } else {
                          setShowNotStartedModal(true)
                        }
                      }}
                      className={`
                        group relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between
                        ${isSelected
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 shadow-md'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-red-300 dark:hover:border-red-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                          ${isLive
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : isCompleted
                              ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }
                        `}>
                          {event.title?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <h3 className={`font-bold ${isSelected ? 'text-red-900 dark:text-red-100' : 'text-neutral-900 dark:text-white'}`}>
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`
                              text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                              ${isLive
                                ? 'bg-red-600 text-white animate-pulse'
                                : isCompleted
                                  ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                                  : 'bg-blue-600 text-white'
                              }
                            `}>
                              {isLive ? 'LIVE' : isCompleted ? 'ENDED' : 'UPCOMING'}
                            </span>
                            {isSelected && <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selected</span>}
                          </div>
                        </div>
                      </div>

                      {/* Interaction Hint */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {isLive || isCompleted ? (
                          <Button size="sm" variant={isSelected ? "default" : "outline"} className={isSelected ? 'bg-red-600 hover:bg-red-700' : ''}>
                            {isSelected ? 'Scanning' : 'Select'}
                          </Button>
                        ) : (
                          <span className="text-xs text-neutral-400 font-medium">Not Started</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Camera / pass scanner */}
          <Card className="p-6 border border-rose-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4 rounded-3xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Camera className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Scan their pass</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Hold the phone steady — it finds the code automatically</p>
              </div>
            </div>

            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-xl" style={{ minHeight: '340px', maxHeight: '480px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                      display: 'block',
                      width: '100%',
                      minHeight: '340px',
                      maxHeight: '480px',
                    }}
                  />

                  {/* Soft warm overlay — no grid or reticle */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                  {/* Simple rounded frame */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                    <div className="relative h-[min(58vw,260px)] w-[min(58vw,260px)] rounded-3xl border-[3px] border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>

                  {selectedEvent && (
                    <div className="absolute top-4 left-4 right-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-neutral-900/90 px-4 py-2 text-sm font-medium text-neutral-800 dark:text-white shadow-md backdrop-blur-sm max-w-full">
                        <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {events.find((e) => e.id.toString() === selectedEvent)?.title || 'Selected event'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-sm">
                    <div className="rounded-2xl bg-white/95 dark:bg-neutral-900/95 px-4 py-3 text-center text-sm text-neutral-700 dark:text-neutral-200 shadow-lg backdrop-blur-sm">
                      Ask guests to open their <span className="font-semibold text-rose-600 dark:text-rose-400">Wallet</span> or event ticket
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full rounded-xl border-rose-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-neutral-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close camera
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl"
                    onClick={() => setScannedCode('')}
                    disabled={!scannedCode}
                  >
                    Start over
                  </Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-rose-200 dark:border-neutral-700 bg-gradient-to-b from-rose-50/50 to-white dark:from-neutral-900 dark:to-neutral-950 px-6 py-14 text-center" style={{ minHeight: '340px' }}>
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/40 dark:to-amber-900/20">
                  <QrCode className="h-11 w-11 text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Ready when you are</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-8 max-w-xs leading-relaxed">
                  Pick an event above, then open the camera. Guests show the QR on their phone — you&apos;re all set.
                </p>
                <Button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white min-w-[220px] h-12 rounded-xl shadow-lg shadow-rose-500/25 text-base font-semibold"
                  disabled={!selectedEvent}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Open camera
                </Button>
                {!selectedEvent && (
                  <p className="mt-4 text-xs text-neutral-500">Select an event first</p>
                )}
              </div>
            )}

            {/* Check-in actions */}
            <div className="pt-4 border-t border-rose-100 dark:border-neutral-800 space-y-4">
              <Input
                placeholder="Pass code appears here after scanning…"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="bg-rose-50/50 dark:bg-neutral-900 text-center text-base rounded-xl border-rose-100 dark:border-neutral-800"
              />

              {selectedEvent && events.find(e => e.id.toString() === selectedEvent)?.status?.toLowerCase() === 'live' && (
                <Button
                  onClick={processCheckIn}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-lg py-6 rounded-2xl shadow-lg shadow-green-500/20"
                  disabled={!scannedCode}
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Welcome guest — check in
                </Button>
              )}

              {selectedEvent && (['completed', 'concluded', 'paused'].includes(events.find(e => e.id.toString() === selectedEvent)?.status?.toLowerCase() || '')) && (
                <Button
                  onClick={processCheckOut}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-lg py-6 rounded-2xl shadow-lg shadow-blue-500/20"
                  disabled={!scannedCode}
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Check out guest
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Stats Panel (Right Side) */}
        <div className="space-y-6">
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm h-full">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-500" />
              Today at a glance
            </h2>

            <div className="space-y-4">
              {/* Checked In */}
              <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Checked In</p>
                  </div>
                  <p className="text-4xl font-bold text-green-700 dark:text-green-500">{checkedInCount}</p>
                </div>
              </div>

              {/* Checked Out */}
              <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Checked Out</p>
                  </div>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-500">{checkedOutCount}</p>
                </div>
              </div>

              {/* Total Expected */}
              <div className="p-5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-neutral-500" />
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Expected</p>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalExpected}</p>
              </div>

              {/* Attendance Rate */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Attendance Rate</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-500">{attendanceRate}%</p>
                  {attendanceRate > 0 && (
                    <div className="flex-1">
                      <div className="h-2 bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
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

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="rounded-3xl p-8 bg-white dark:bg-neutral-900 w-full max-w-sm mx-4 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center scale-100 animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${lastAction === 'check-out' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
              }`}>
              <CheckCircle2 className={`w-10 h-10 ${lastAction === 'check-out' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                }`} />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {lastAction === 'check-out' ? 'Check-Out' : 'Check-In'} Complete
            </h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 font-medium mb-1">
              {participantName}
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Successfully processing...
            </p>
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
