'use client'

import { createContext, useContext, useMemo, useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, apiRequest, authApi, apiCall } from '@/lib/api-config'
import {
  COLLEGES,
  VENUES,
  SEMESTERS,
  SCHOOL_YEARS,
  PREMADE_CERTIFICATES,
  INITIAL_COORDINATES,
  CERTIFICATE_DIMENSION,
} from '@/lib/event-create-constants'
import {
  validateEventSchedule,
  getMinEventDate,
  compressImageToBase64,
  readFileAsDataUrl,
  validateCertificateTemplate,
  scaleCertificateCoordinates,
} from '@/lib/event-create-utils'
import {
  EVENT_THEMES,
  THEME_WHITE_ID,
  THEME_BLACK_ID,
  getEventThemeById,
} from '@/lib/event-themes'

const THEMES = EVENT_THEMES

export type CreateEventWizard = ReturnType<typeof useCreateEventWizardState>

const CreateEventWizardContext = createContext<CreateEventWizard | null>(null)

function useCreateEventWizardState() {
    const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [publishStatus, setPublishStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)

  // Initialize CSRF token on component mount
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        const response = await apiRequest(authApi.csrfToken(), {
          method: 'GET',
        })
        if (response.ok) {
          const data = await response.json()
          if (data.csrf_token) {
            localStorage.setItem('csrfToken', data.csrf_token)
          }
        }
      } catch (err) {
        console.error('Failed to initialize CSRF token:', err)
      }
    }

    initializeCsrf()
  }, [])

  // Event details
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Manila')
  const [speakers, setSpeakers] = useState('')
  const [venue, setVenue] = useState('')
  const [eventCategory, setEventCategory] = useState('HCDC')
  const [departmentCategory, setDepartmentCategory] = useState('')
  const [semester, setSemester] = useState('')
  const [schoolYear, setSchoolYear] = useState('')

  // Event options
  const [hasCapacityLimit, setHasCapacityLimit] = useState(false)
  const [capacity, setCapacity] = useState('100')
  const [requireApproval, setRequireApproval] = useState(false)
  const [isPaidEvent, setIsPaidEvent] = useState(false)
  const [ticketPrice, setTicketPrice] = useState('0')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState(1)
  const [cardStyle, setCardStyle] = useState<'standard' | 'poster'>('standard') // Helpful Feature: Card Layout
  const [usePattern, setUsePattern] = useState(false) // Surprise: Dot Pattern
  const [useFloat, setUseFloat] = useState(false) // Surprise: Float Animation
  const [useGlass, setUseGlass] = useState(false) // Surprise: Glassmorphism
  const [useNeon, setUseNeon] = useState(false) // Surprise: Neon Glow

  // Certificate data
  const [certificateTemplate, setCertificateTemplate] = useState('')
  const [selectedPremadeTemplate, setSelectedPremadeTemplate] = useState('')
  const [certificateError, setCertificateError] = useState('')
  const [certificateCoordinates, setCertificateCoordinates] = useState(INITIAL_COORDINATES)
  const [sampleName, setSampleName] = useState('Juan Dela Cruz')
  const [sampleEventTitle, setSampleEventTitle] = useState('Sample Event Title')
  const [sampleDate, setSampleDate] = useState('January 01, 2025')

  // Font customization — sizes are in certificate pixel units (1:1 with PDF output)
  const [nameFontSize, setNameFontSize] = useState(52)
  const [eventTitleFontSize, setEventTitleFontSize] = useState(34)
  const [dateFontSize, setDateFontSize] = useState(34)
  const [nameFontColor, setNameFontColor] = useState('#000000')
  const [eventTitleFontColor, setEventTitleFontColor] = useState('#000000')
  const [dateFontColor, setDateFontColor] = useState('#000000')

  // Drag & drop state for coordinate mapping
  const [draggingField, setDraggingField] = useState<keyof typeof INITIAL_COORDINATES | null>(null)
  const certificatePreviewRef = useRef<HTMLDivElement | null>(null)
  const reviewCertificateRef = useRef<HTMLDivElement | null>(null)
  const dialogCertificateRef = useRef<HTMLDivElement | null>(null)

  // Actual certificate image size (from uploaded template); used so
  // coordinates match the real PDF dimensions from the backend.
  const [certificateSize, setCertificateSize] = useState(CERTIFICATE_DIMENSION)
  const [previewWidth, setPreviewWidth] = useState(0)
  const [reviewPreviewWidth, setReviewPreviewWidth] = useState(0)
  const [dialogPreviewWidth, setDialogPreviewWidth] = useState(0)
  const previewScale = previewWidth > 0 ? previewWidth / certificateSize.width : 0
  const reviewPreviewScale = reviewPreviewWidth > 0 ? reviewPreviewWidth / certificateSize.width : 0
  const dialogPreviewScale = dialogPreviewWidth > 0 ? dialogPreviewWidth / certificateSize.width : 0
  const [isDownloadingSample, setIsDownloadingSample] = useState(false)
  const [sampleDownloadError, setSampleDownloadError] = useState('')

  useEffect(() => {
    if (!certificatePreviewRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPreviewWidth(entry.contentRect.width)
      }
    })

    observer.observe(certificatePreviewRef.current)
    return () => observer.disconnect()
  }, [currentStep, certificateSize.width])

  useEffect(() => {
    if (!reviewCertificateRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setReviewPreviewWidth(entry.contentRect.width)
      }
    })

    observer.observe(reviewCertificateRef.current)
    return () => observer.disconnect()
  }, [currentStep, certificateSize.width])

  useEffect(() => {
    if (!dialogCertificateRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDialogPreviewWidth(entry.contentRect.width)
      }
    })

    observer.observe(dialogCertificateRef.current)
    return () => observer.disconnect()
  }, [currentStep, certificateSize.width])

  const totalSteps = 6

  const scheduleError = validateEventSchedule(eventDate, startTime, endTime)
  const isStep1Valid = Boolean(
    eventName && eventDescription && eventDate && startTime && endTime && venue && !scheduleError
  )
  const isStep2Valid = (!hasCapacityLimit || (hasCapacityLimit && Number(capacity) > 0)) && (!isPaidEvent || (isPaidEvent && Number(ticketPrice) > 0))
  const isCertificateReady = Boolean(certificateTemplate)

  const activeTheme = useMemo(() => getEventThemeById(selectedTheme), [selectedTheme])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await compressImageToBase64(file)
    setCoverImage(base64)
  }

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    const isValid = await validateCertificateTemplate(dataUrl)
    if (!isValid) {
      setCertificateError('Template must be in landscape orientation (wider than tall)')
      return
    }
    setCertificateError('')
    setSelectedPremadeTemplate('') // Clear premade selection when uploading custom
    setCertificateTemplate(dataUrl)

    // Detect actual image dimensions so coordinate system matches backend
    const img = new Image()
    img.onload = () => {
      const nextSize = {
        width: img.width || CERTIFICATE_DIMENSION.width,
        height: img.height || CERTIFICATE_DIMENSION.height,
      }
      setCertificateSize(prev => {
        setCertificateCoordinates(coords => scaleCertificateCoordinates(coords, prev, nextSize))
        return nextSize
      })
    }
    img.src = dataUrl
  }

  const handlePremadeTemplateSelect = async (templatePath: string) => {
    setSelectedPremadeTemplate(templatePath)
    setCertificateError('')

    // Load the premade template image
    const response = await fetch(templatePath)
    const blob = await response.blob()
    const dataUrl = await readFileAsDataUrl(new File([blob], 'template.png', { type: 'image/png' }))
    setCertificateTemplate(dataUrl)

    // Detect actual image dimensions
    const img = new Image()
    img.onload = () => {
      const nextSize = {
        width: img.width || CERTIFICATE_DIMENSION.width,
        height: img.height || CERTIFICATE_DIMENSION.height,
      }
      setCertificateSize(prev => {
        setCertificateCoordinates(coords => scaleCertificateCoordinates(coords, prev, nextSize))
        return nextSize
      })
    }
    img.src = dataUrl
  }

  const handleCoordinateChange = (field: keyof typeof INITIAL_COORDINATES, axis: 'x' | 'y', value: number) => {
    setCertificateCoordinates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [axis]: value,
      },
    }))
  }

  // Handle drag start for overlay text
  const handleDragStart = (field: keyof typeof INITIAL_COORDINATES, e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingField(field)
  }

  // Global mouse move / up listeners for dragging
  useEffect(() => {
    if (!draggingField) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!certificatePreviewRef.current) return
      const rect = certificatePreviewRef.current.getBoundingClientRect()

      // Clamp pointer inside the preview bounds
      const clampedX = Math.min(Math.max(e.clientX, rect.left), rect.right)
      const clampedY = Math.min(Math.max(e.clientY, rect.top), rect.bottom)

      const relX = clampedX - rect.left
      const relYFromTop = clampedY - rect.top

      // Convert from DOM coordinates (origin top-left) to certificate coordinates (origin bottom-left)
      const x = (relX / rect.width) * certificateSize.width
      const yFromBottom =
        certificateSize.height - (relYFromTop / rect.height) * certificateSize.height

      setCertificateCoordinates(prev => ({
        ...prev,
        [draggingField]: {
          ...prev[draggingField],
          x: Math.round(x),
          y: Math.round(yFromBottom),
        },
      }))
    }

    const handleMouseUp = () => {
      setDraggingField(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingField, certificateSize.height, certificateSize.width])

  const handleDownloadCertificateSample = async () => {
    if (!certificateTemplate) {
      setSampleDownloadError('Upload a certificate template first.')
      return
    }

    setIsDownloadingSample(true)
    setSampleDownloadError('')

    try {
      const response = await apiCall.post(adminApi.certificatePreviewSample(), {
        certificate_template_image: certificateTemplate,
        certificate_coordinates: {
          name: certificateCoordinates.name,
          event_title: certificateCoordinates.eventTitle,
          date: certificateCoordinates.date,
        },
        certificate_sample_text: {
          name: sampleName,
          event_title: sampleEventTitle || eventName,
          date: sampleDate || eventDate,
        },
        certificate_font_styles: {
          name: { fontSize: nameFontSize, color: nameFontColor },
          event_title: { fontSize: eventTitleFontSize, color: eventTitleFontColor },
          date: { fontSize: dateFontSize, color: dateFontColor },
        },
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate certificate sample.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.detail || errorMessage
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.pdf_base64) {
        throw new Error('No certificate data returned from server.')
      }

      const base64Data = data.pdf_base64.includes(',')
        ? data.pdf_base64.split(',')[1]
        : data.pdf_base64
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'certificate-sample.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download certificate sample.'
      setSampleDownloadError(message)
    } finally {
      setIsDownloadingSample(false)
    }
  }

  const handleCreateEvent = async () => {
    const validationError = validateEventSchedule(eventDate, startTime, endTime)
    if (validationError) {
      setError(validationError)
      setShowErrorModal(true)
      return
    }

    // Post event to backend API
    setIsLoading(true)
    setShowPublishModal(true)
    setPublishStatus('loading')
    setError('')
    try {
      const payload = {
        title: eventName,
        description: eventDescription,
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: venue,
        capacity: hasCapacityLimit ? Number(capacity) : 1000000,
        status: 'scheduled',
        speakers: speakers ? speakers.split(',').map(s => s.trim()).filter(Boolean) : [],
        timezone,
        category: eventCategory === 'outside' ? 'outside' : eventCategory,
        department: departmentCategory,
        semester,
        school_year: schoolYear,
        theme: activeTheme.name,
        cover_image: coverImage,
        is_public: isPublic,
        require_approval: requireApproval,
        is_paid_event: isPaidEvent,
        ticket_price: isPaidEvent ? Number(ticketPrice || 0) : 0,
        certificate_template_image: certificateTemplate,
        certificate_coordinates: {
          name: certificateCoordinates.name,
          event_title: certificateCoordinates.eventTitle,
          date: certificateCoordinates.date,
        },
        certificate_sample_text: {
          name: sampleName,
          event_title: sampleEventTitle || eventName,
          date: sampleDate || eventDate,
        },
        certificate_font_styles: {
          name: { fontSize: nameFontSize, color: nameFontColor },
          event_title: { fontSize: eventTitleFontSize, color: eventTitleFontColor },
          date: { fontSize: dateFontSize, color: dateFontColor },
        },
      }

      // Post to backend API (ensure trailing slash for Django REST Framework)
      const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
      console.log('[Create Event] Posting to:', eventsUrl, payload)

      const response = await apiCall.post(eventsUrl, payload)

      console.log('[Create Event] Response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `Failed to create event: ${response.status} ${response.statusText}`
        try {
          const text = await response.text()
          try {
            const errorData = JSON.parse(text)
            console.error('[Create Event] Error response JSON:', errorData)
            errorMessage = errorData.error || errorData.detail || errorMessage

            // Handle specific validation errors
            if (Object.keys(errorData).length > 0 && !errorData.error && !errorData.detail) {
              const validationErrors = Object.entries(errorData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('; ')
              if (validationErrors) {
                errorMessage = `Validation errors: ${validationErrors}`
              }
            }
          } catch (e) {
            console.error('[Create Event] Error response Text:', text)
            if (text && text.length < 500) {
              errorMessage = `Server Error: ${text}`
            } else {
              errorMessage = `Server Error: ${response.status} ${response.statusText}`
            }
          }
        } catch {
          // If reading text fails
        }
        throw new Error(errorMessage)
      }

      const createdEvent = await response.json()
      console.log('[Create Event] Success! Created event:', createdEvent)
      setIsLoading(false)
      setPublishStatus('success')
      if (createdEvent.id) {
        setCreatedEventId(createdEvent.id)
      }
    } catch (err: any) {
      setError(err.message || 'Unable to create event right now.')
      setIsLoading(false)
      setShowPublishModal(false) // Close modal on error so user can correct it
    }
  }

  const handleSuccessNavigation = () => {
    if (createdEventId) {
      router.push(`/admin/events/${createdEventId}`)
    } else {
      router.push('/admin/events')
    }
    router.refresh()
  }

  return {
    router,
    currentStep, setCurrentStep, isLoading, error, setError, publishStatus, showPublishModal,
    setShowPublishModal, showErrorModal, setShowErrorModal, createdEventId, eventName, setEventName,
    eventDescription, setEventDescription, coverImage, setCoverImage, eventDate, setEventDate,
    startTime, setStartTime, endTime, setEndTime, timezone, setTimezone, speakers, setSpeakers,
    venue, setVenue, eventCategory, setEventCategory, departmentCategory, setDepartmentCategory,
    semester, setSemester, schoolYear, setSchoolYear, hasCapacityLimit, setHasCapacityLimit,
    capacity, setCapacity, requireApproval, setRequireApproval, isPaidEvent, setIsPaidEvent,
    ticketPrice, setTicketPrice, isPublic, setIsPublic, selectedTheme, setSelectedTheme,
    cardStyle, setCardStyle, usePattern, setUsePattern, useFloat, setUseFloat, useGlass, setUseGlass,
    useNeon, setUseNeon, certificateTemplate, setCertificateTemplate, selectedPremadeTemplate,
    setSelectedPremadeTemplate, certificateError, setCertificateError, certificateCoordinates,
    setCertificateCoordinates, sampleName, setSampleName, sampleEventTitle, setSampleEventTitle,
    sampleDate, setSampleDate, nameFontSize, setNameFontSize, eventTitleFontSize, setEventTitleFontSize,
    dateFontSize, setDateFontSize, nameFontColor, setNameFontColor, eventTitleFontColor,
    setEventTitleFontColor, dateFontColor, setDateFontColor, draggingField, setDraggingField,
    certificatePreviewRef, reviewCertificateRef, dialogCertificateRef, certificateSize, setCertificateSize,
    previewWidth, reviewPreviewWidth, dialogPreviewWidth, previewScale, reviewPreviewScale,
    dialogPreviewScale, isDownloadingSample, setIsDownloadingSample, sampleDownloadError,
    setSampleDownloadError, totalSteps, scheduleError, isStep1Valid, isStep2Valid, isCertificateReady,
    activeTheme, handleCoverUpload, handleCertificateUpload, handlePremadeTemplateSelect,
    handleCoordinateChange, handleDragStart, handleDownloadCertificateSample, handleCreateEvent,
    handleSuccessNavigation, getMinEventDate, THEMES, THEME_WHITE_ID, THEME_BLACK_ID,
    PREMADE_CERTIFICATES, COLLEGES, VENUES, SEMESTERS, SCHOOL_YEARS, CERTIFICATE_DIMENSION, INITIAL_COORDINATES,
  }
}

export function CreateEventWizardProvider({ children }: { children: ReactNode }) {
  const value = useCreateEventWizardState()
  return <CreateEventWizardContext.Provider value={value}>{children}</CreateEventWizardContext.Provider>
}

export function useCreateEventWizard(): CreateEventWizard {
  const ctx = useContext(CreateEventWizardContext)
  if (!ctx) throw new Error('useCreateEventWizard must be used within CreateEventWizardProvider')
  return ctx
}
