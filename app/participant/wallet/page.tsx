'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  Award,
  Calendar,
  ChevronRight,
  Loader2,
  MapPin,
  Ticket,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, apiCall, getAuthenticatedUserEmail } from '@/lib/api-config'

type WalletTicket = {
  kind: 'ticket'
  id: number
  eventId: number
  title: string
  date: string
  location?: string
  coverImage?: string
  qrValue: string
  status: 'upcoming' | 'checked-in' | 'checked-out' | 'completed'
}

type WalletCertificate = {
  kind: 'certificate'
  id: number
  eventTitle: string
  issueDate: string
  certificateNumber: string
  status: string
}

type WalletItem = WalletTicket | WalletCertificate

export default function ParticipantWalletPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<WalletItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const loadWallet = async () => {
      const email = await getAuthenticatedUserEmail()
      if (!email) {
        setError('Please sign in to open your wallet.')
        setLoading(false)
        return
      }

      try {
        const regsBase = api.registrations().endsWith('/')
          ? api.registrations().slice(0, -1)
          : api.registrations()
        const certsBase = api.certificates().endsWith('/')
          ? api.certificates().slice(0, -1)
          : api.certificates()

        const [regsRes, certsRes] = await Promise.all([
          apiCall.get(`${regsBase}/?email=${encodeURIComponent(email)}`),
          apiCall.get(`${certsBase}/my_certificates/`),
        ])

        const walletItems: WalletItem[] = []

        if (regsRes.ok) {
          const regsData = await regsRes.json()
          const registrations = Array.isArray(regsData)
            ? regsData
            : (regsData.results || regsData.data || [])

          const eventIds = Array.from(
            new Set(registrations.map((r: { event: number }) => Number(r.event)))
          ) as number[]
          const eventMap = new Map<number, Record<string, unknown>>()

          await Promise.all(
            eventIds.map(async (eventId: number) => {
              try {
                const evRes = await apiCall.get(api.eventById(eventId))
                if (evRes.ok) {
                  eventMap.set(eventId, await evRes.json())
                }
              } catch {
                /* skip */
              }
            })
          )

          for (const reg of registrations) {
            const ev = eventMap.get(reg.event)
            const qrValue = reg.qr_code_value || reg.qr_code
            if (!qrValue) continue

            let status: WalletTicket['status'] = 'upcoming'
            if (reg.has_evaluated) status = 'completed'
            else if (reg.is_checked_out) status = 'checked-out'
            else if (reg.is_present) status = 'checked-in'

            walletItems.push({
              kind: 'ticket',
              id: reg.id,
              eventId: reg.event,
              title: (ev?.title as string) || (ev?.name as string) || `Event #${reg.event}`,
              date: (ev?.date as string) || '',
              location: (ev?.location as string) || (ev?.venue as string),
              coverImage: (ev?.cover_image as string) || (ev?.coverImage as string),
              qrValue,
              status,
            })
          }
        }

        if (certsRes.ok) {
          const certsData = await certsRes.json()
          const certs = Array.isArray(certsData) ? certsData : []
          for (const cert of certs) {
            walletItems.push({
              kind: 'certificate',
              id: cert.id,
              eventTitle: cert.event_title || 'Certificate',
              issueDate: cert.issue_date || '',
              certificateNumber: cert.certificate_number || '',
              status: cert.status || 'generated',
            })
          }
        }

        setItems(walletItems)
      } catch {
        setError('Could not load your wallet. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadWallet()
  }, [])

  const tickets = useMemo(() => items.filter((i): i is WalletTicket => i.kind === 'ticket'), [items])
  const certificates = useMemo(
    () => items.filter((i): i is WalletCertificate => i.kind === 'certificate'),
    [items]
  )

  const statusLabel = (status: WalletTicket['status']) => {
    switch (status) {
      case 'checked-in': return 'Checked in'
      case 'checked-out': return 'Checked out'
      case 'completed': return 'Completed'
      default: return 'Ready to use'
    }
  }

  const statusColor = (status: WalletTicket['status']) => {
    switch (status) {
      case 'checked-in': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      case 'checked-out': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
      case 'completed': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/80 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6 animate-in fade-in duration-500">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Wallet hero card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 p-6 text-white shadow-xl shadow-rose-500/25">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium tracking-wide">My Passes</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Event Wallet</h1>
              <p className="text-sm text-white/85 mt-1 max-w-[240px]">
                Your tickets and certificates, always at hand.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold">{items.length}</p>
              <p className="text-xs text-white/75 uppercase tracking-wider">items</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-sm">Opening your wallet…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/auth/signin')} className="bg-rose-600 hover:bg-rose-700">
              Sign in
            </Button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <Ticket className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Nothing here yet</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Register for an event and your ticket will show up here automatically.
            </p>
            <Button
              className="bg-rose-600 hover:bg-rose-700 w-full sm:w-auto"
              onClick={() => router.push('/participant/events')}
            >
              Browse events
            </Button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Event tickets
            </h2>
            {tickets.map((ticket) => {
              const key = `ticket-${ticket.id}`
              const isOpen = expandedId === key
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full p-4 flex items-center gap-3 text-left"
                    onClick={() => setExpandedId(isOpen ? null : key)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/20 flex items-center justify-center shrink-0">
                      <Ticket className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-white truncate">{ticket.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {ticket.date && (
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ticket.date}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(ticket.status)}`}>
                          {statusLabel(ticket.status)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-top-2 duration-200">
                      {ticket.location && (
                        <p className="text-xs text-neutral-500 flex items-center gap-1 mb-4 mt-3">
                          <MapPin className="w-3.5 h-3.5" />
                          {ticket.location}
                        </p>
                      )}
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-inner border border-neutral-100">
                          <QRCodeSVG value={ticket.qrValue} size={180} level="M" includeMargin />
                        </div>
                        <p className="text-xs text-neutral-500 text-center max-w-[260px]">
                          Show this code at the entrance — staff will scan it for check-in.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/participant/event/${ticket.eventId}/qrcode`)}
                        >
                          Full ticket view
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {!loading && !error && certificates.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certificates
            </h2>
            {certificates.map((cert) => (
              <button
                key={`cert-${cert.id}`}
                type="button"
                className="w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center gap-3 text-left shadow-sm hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                onClick={() => router.push('/participant/certificates')}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/20 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{cert.eventTitle}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {cert.issueDate ? `Issued ${cert.issueDate}` : cert.certificateNumber}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
