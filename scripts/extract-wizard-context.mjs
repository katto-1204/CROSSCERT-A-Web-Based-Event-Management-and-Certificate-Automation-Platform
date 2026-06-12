import fs from 'fs'

const lines = fs.readFileSync('app/admin/events/create/page.tsx', 'utf8').split(/\r?\n/)

const startIdx = lines.findIndex((l) => l.includes('export default function CreateEventPage'))
const endIdx = lines.findIndex((l) => l.trim().startsWith('const renderStepIndicator'))

if (startIdx < 0 || endIdx < 0) {
  console.error('Could not find wizard boundaries', startIdx, endIdx)
  process.exit(1)
}

// body: from line after `const router = useRouter()` through handleSuccessNavigation closing brace
const routerLine = lines.findIndex((l, i) => i > startIdx && l.includes('const router = useRouter()'))
const handleSuccessEnd = lines.findIndex((l, i) => i > routerLine && l.trim() === '}' && lines[i - 1]?.includes('router.refresh()'))

const hookBody = lines.slice(routerLine, handleSuccessEnd + 1).join('\n')

const contextFile = `'use client'

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
${hookBody.replace('const router = useRouter()', '  const router = useRouter()')}

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
`

fs.writeFileSync('app/admin/events/create/create-event-wizard-context.tsx', contextFile)
console.log('Wizard context created')
