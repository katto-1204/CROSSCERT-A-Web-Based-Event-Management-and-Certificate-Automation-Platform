import fs from 'fs'
import path from 'path'

const pagePath = 'app/admin/events/create/page.tsx'
const lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/)

const stepMarkers = lines
  .map((line, idx) => ({ line, idx: idx + 1 }))
  .filter(({ line }) => /currentStep === \d+ &&/.test(line))

if (stepMarkers.length !== 6) {
  console.error('Expected 6 steps, found', stepMarkers.length)
  process.exit(1)
}

const modalLine = lines.findIndex((l) => l.includes('Publishing Status Modal') || l.includes('<PublishModals'))
const endLine = modalLine > 0 ? modalLine : lines.length

const steps = stepMarkers.map((marker, i) => {
  const start = marker.idx
  const end = i < stepMarkers.length - 1 ? stepMarkers[i + 1].idx - 1 : endLine - 1
  const names = [
    'Step1EventDetails',
    'Step2Options',
    'Step3Theme',
    'Step4Certificate',
    'Step5Mapping',
    'Step6Review',
  ]
  return { export: names[i], file: names[i].replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''), start, end }
})

const wizardKeys = [
  'currentStep', 'setCurrentStep', 'isLoading', 'error', 'setError', 'publishStatus', 'showPublishModal',
  'setShowPublishModal', 'showErrorModal', 'setShowErrorModal', 'createdEventId', 'eventName', 'setEventName',
  'eventDescription', 'setEventDescription', 'coverImage', 'setCoverImage', 'eventDate', 'setEventDate',
  'startTime', 'setStartTime', 'endTime', 'setEndTime', 'timezone', 'setTimezone', 'speakers', 'setSpeakers',
  'venue', 'setVenue', 'eventCategory', 'setEventCategory', 'departmentCategory', 'setDepartmentCategory',
  'semester', 'setSemester', 'schoolYear', 'setSchoolYear', 'hasCapacityLimit', 'setHasCapacityLimit',
  'capacity', 'setCapacity', 'requireApproval', 'setRequireApproval', 'isPaidEvent', 'setIsPaidEvent',
  'ticketPrice', 'setTicketPrice', 'isPublic', 'setIsPublic', 'selectedTheme', 'setSelectedTheme',
  'cardStyle', 'setCardStyle', 'usePattern', 'setUsePattern', 'useFloat', 'setUseFloat', 'useGlass', 'setUseGlass',
  'useNeon', 'setUseNeon', 'certificateTemplate', 'setCertificateTemplate', 'selectedPremadeTemplate',
  'setSelectedPremadeTemplate', 'certificateError', 'setCertificateError', 'certificateCoordinates',
  'setCertificateCoordinates', 'sampleName', 'setSampleName', 'sampleEventTitle', 'setSampleEventTitle',
  'sampleDate', 'setSampleDate', 'nameFontSize', 'setNameFontSize', 'eventTitleFontSize', 'setEventTitleFontSize',
  'dateFontSize', 'setDateFontSize', 'nameFontColor', 'setNameFontColor', 'eventTitleFontColor',
  'setEventTitleFontColor', 'dateFontColor', 'setDateFontColor', 'draggingField', 'setDraggingField',
  'certificatePreviewRef', 'reviewCertificateRef', 'dialogCertificateRef', 'certificateSize', 'setCertificateSize',
  'previewWidth', 'reviewPreviewWidth', 'dialogPreviewWidth', 'previewScale', 'reviewPreviewScale',
  'dialogPreviewScale', 'isDownloadingSample', 'setIsDownloadingSample', 'sampleDownloadError',
  'setSampleDownloadError', 'totalSteps', 'scheduleError', 'isStep1Valid', 'isStep2Valid', 'isCertificateReady',
  'activeTheme', 'router', 'handleCoverUpload', 'handleCertificateUpload', 'handlePremadeTemplateSelect',
  'handleCoordinateChange', 'handleDragStart', 'handleDownloadCertificateSample', 'handleCreateEvent',
  'handleSuccessNavigation', 'getMinEventDate', 'THEMES', 'THEME_WHITE_ID', 'THEME_BLACK_ID', 'PREMADE_CERTIFICATES',
  'COLLEGES', 'VENUES', 'SEMESTERS', 'SCHOOL_YEARS', 'CERTIFICATE_DIMENSION', 'INITIAL_COORDINATES',
]

function prefixWizardIdentifiers(source) {
  let result = source
  const sorted = [...wizardKeys].sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    const re = new RegExp(`(?<![.\\w])${key}\\b`, 'g')
    result = result.replace(re, `w.${key}`)
  }
  // fix double prefixes and constants
  result = result.replace(/w\.(COLLEGES|VENUES|SEMESTERS|SCHOOL_YEARS|PREMADE_CERTIFICATES|THEMES|THEME_WHITE_ID|THEME_BLACK_ID|CERTIFICATE_DIMENSION|INITIAL_COORDINATES|getMinEventDate)/g, '$1')
  result = result.replace(/w\.w\./g, 'w.')
  return result
}

const dir = 'app/admin/events/create/steps'
fs.mkdirSync(dir, { recursive: true })

const commonImports = `'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Upload, MapPin, CalendarIcon, Clock, Users, Ruler, Eye, Palette, Edit, Globe, Lock, Ticket, CheckCircle, UserCheck, Building2, Tag, BookOpen, GraduationCap, FileText, Maximize2, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CertificateTextOverlay } from '../components/certificate-text-overlay'
import { useCreateEventWizard } from '../create-event-wizard-context'
`

for (const step of steps) {
  let body = lines.slice(step.start, step.end).join('\n')
  body = body.replace(/^\s*\{currentStep === \d+ && \(\n?/, '')
  body = body.replace(/\n?\s*\)\}\s*$/, '')
  body = prefixWizardIdentifiers(body)

  const out = `${commonImports}
export function ${step.export}() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
${body}
  )
}
`
  fs.writeFileSync(path.join(dir, `${step.file}.tsx`), out)
}

console.log('Created', steps.length, 'step files')
