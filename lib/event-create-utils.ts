import type { CertificateCoordinates } from '@/lib/event-create-constants'

export const MIN_EVENT_ADVANCE_HOURS = 48

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getMinEventDate(): string {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 2)
  return formatLocalDate(minDate)
}

export function validateEventSchedule(date: string, start: string, end: string): string | null {
  if (!date || !start || !end) return null

  const startDateTime = new Date(`${date}T${start}`)
  const endDateTime = new Date(`${date}T${end}`)
  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return 'Invalid date or time.'
  }

  const diffInHours = (startDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  if (diffInHours < MIN_EVENT_ADVANCE_HOURS) {
    return 'Events must be scheduled at least 2 days in advance.'
  }

  if (endDateTime <= startDateTime) {
    return 'End time must be after start time.'
  }

  return null
}

export function scaleCertificateCoordinates(
  coords: CertificateCoordinates,
  fromSize: { width: number; height: number },
  toSize: { width: number; height: number },
): CertificateCoordinates {
  const scaleX = toSize.width / fromSize.width
  const scaleY = toSize.height / fromSize.height
  return {
    name: { x: Math.round(coords.name.x * scaleX), y: Math.round(coords.name.y * scaleY) },
    eventTitle: { x: Math.round(coords.eventTitle.x * scaleX), y: Math.round(coords.eventTitle.y * scaleY) },
    date: { x: Math.round(coords.date.x * scaleX), y: Math.round(coords.date.y * scaleY) },
  }
}

export async function compressImageToBase64(
  file: File,
  opts?: { maxWidth?: number; maxHeight?: number; quality?: number },
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = opts || {}
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
  const targetW = Math.round(bitmap.width * ratio)
  const targetH = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  const isPNG = file.type === 'image/png'
  const mime = isPNG ? 'image/png' : 'image/jpeg'
  return canvas.toDataURL(mime, mime === 'image/jpeg' ? quality : undefined)
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function validateCertificateTemplate(dataUrl: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.width > img.height)
    img.onerror = () => resolve(false)
    img.src = dataUrl
  })
}
