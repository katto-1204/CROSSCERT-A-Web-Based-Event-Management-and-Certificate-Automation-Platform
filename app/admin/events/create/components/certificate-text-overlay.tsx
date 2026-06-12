'use client'

import type { ReactNode } from 'react'
import type { CertificateCoordinates } from '@/lib/event-create-constants'

type CertificateOverlayProps = {
  certificateSize: { width: number; height: number }
  previewScale: number
  certificateCoordinates: CertificateCoordinates
  sampleName: string
  sampleEventTitle: string
  sampleDate: string
  eventName: string
  eventDate: string
  nameFontSize: number
  eventTitleFontSize: number
  dateFontSize: number
  nameFontColor: string
  eventTitleFontColor: string
  dateFontColor: string
  onDragStart?: (field: keyof CertificateCoordinates, e: React.MouseEvent<HTMLSpanElement>) => void
  interactive?: boolean
}

export function CertificateTextOverlay({
  certificateSize,
  previewScale,
  certificateCoordinates,
  sampleName,
  sampleEventTitle,
  sampleDate,
  eventName,
  eventDate,
  nameFontSize,
  eventTitleFontSize,
  dateFontSize,
  nameFontColor,
  eventTitleFontColor,
  dateFontColor,
  onDragStart,
  interactive = false,
}: CertificateOverlayProps) {
  const scale = previewScale > 0 ? previewScale : 0.001

  return (
    <div
      className="absolute bottom-0 left-0"
      style={{
        width: certificateSize.width,
        height: certificateSize.height,
        transform: `scale(${scale})`,
        transformOrigin: 'bottom left',
      }}
    >
      <span
        className={`absolute font-bold uppercase tracking-wide whitespace-nowrap select-none ${interactive ? 'cursor-move' : 'pointer-events-none'}`}
        style={{
          left: certificateCoordinates.name.x,
          bottom: certificateCoordinates.name.y,
          transform: 'translate(-50%, 50%)',
          fontSize: nameFontSize,
          color: nameFontColor,
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
        onMouseDown={interactive && onDragStart ? (e) => onDragStart('name', e) : undefined}
      >
        {sampleName}
      </span>
      <span
        className={`absolute font-bold whitespace-nowrap select-none ${interactive ? 'cursor-move' : 'pointer-events-none'}`}
        style={{
          left: certificateCoordinates.eventTitle.x,
          bottom: certificateCoordinates.eventTitle.y,
          transform: 'translate(-50%, 50%)',
          fontSize: eventTitleFontSize,
          color: eventTitleFontColor,
          fontFamily: "'Times New Roman', Times, serif",
        }}
        onMouseDown={interactive && onDragStart ? (e) => onDragStart('eventTitle', e) : undefined}
      >
        {sampleEventTitle || eventName}
      </span>
      <span
        className={`absolute whitespace-nowrap select-none ${interactive ? 'cursor-move' : 'pointer-events-none'}`}
        style={{
          left: certificateCoordinates.date.x,
          bottom: certificateCoordinates.date.y,
          transform: 'translate(-50%, 50%)',
          fontSize: dateFontSize,
          color: dateFontColor,
          fontFamily: "'Times New Roman', Times, serif",
        }}
        onMouseDown={interactive && onDragStart ? (e) => onDragStart('date', e) : undefined}
      >
        {sampleDate || eventDate}
      </span>
    </div>
  )
}

export type { CertificateOverlayProps }
