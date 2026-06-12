'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, CheckCircle, Star, Filter, ArrowLeft, MessageSquare, Quote, ThumbsUp, Medal, GraduationCap, Building2, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, apiCall, adminApi, getApiErrorMessage } from '@/lib/api-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type EvaluationRecord = {
  id: number
  registration: number
  name: string
  email: string
  year_level: string
  content_rating: number
  instructor_rating: number
  facilities_rating: number
  overall_rating: number
  feedback: string
  submitted_at: string
  event_title?: string
  event_id?: number
  participant_name?: string
  image?: string
}

type EventRecord = {
  id: number
  title: string
  status: string
}

export default function AdminEvaluations() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, evaluationsRes] = await Promise.all([
          apiCall.get(adminApi.events()),
          apiCall.get(api.evaluations()),
        ])

        if (!eventsRes.ok) {
          throw new Error(await getApiErrorMessage(eventsRes, 'Unable to load events data'))
        }
        if (!evaluationsRes.ok) {
          throw new Error(await getApiErrorMessage(evaluationsRes, 'Unable to load evaluations data'))
        }

        const eventsData = await eventsRes.json()
        const evaluationsData = await evaluationsRes.json()

        const eventsList: EventRecord[] = Array.isArray(eventsData)
          ? eventsData
          : (eventsData.results || eventsData.data || [])

        const evaluationsList: EvaluationRecord[] = Array.isArray(evaluationsData)
          ? evaluationsData
          : (evaluationsData.results || evaluationsData.data || [])

        setEvents(eventsList)
        setEvaluations(evaluationsList)
      } catch (err: any) {
        if (err?.message !== 'Backend unavailable') {
          console.error('[AdminEvaluations] Error loading data:', err)
        }
        setError(err.message || 'Unable to load evaluations.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      evaluation.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.participant_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesEvent = selectedEvent === 'all' || String(evaluation.event_id) === selectedEvent

    return matchesSearch && matchesEvent
  })

  const calculateAverage = (field: keyof EvaluationRecord) => {
    if (evaluations.length === 0) return 0
    const sum = evaluations.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0)
    return (sum / evaluations.length).toFixed(1)
  }

  const avgOverall = calculateAverage('overall_rating')
  const avgContent = calculateAverage('content_rating')
  const avgInstructor = calculateAverage('instructor_rating')
  const avgFacilities = calculateAverage('facilities_rating')

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-neutral-200 dark:fill-neutral-800 text-neutral-200 dark:text-neutral-800'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Evaluations</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 ml-12">Feedback and ratings from event participants.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <Medal className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Overall Rating</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{avgOverall}</span>
            <span className="text-sm font-medium text-neutral-400 mb-1">/ 5.0</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Content</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{avgContent}</span>
            <span className="text-sm font-medium text-neutral-400 mb-1">/ 5.0</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Instructor</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{avgInstructor}</span>
            <span className="text-sm font-medium text-neutral-400 mb-1">/ 5.0</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Facilities</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{avgFacilities}</span>
            <span className="text-sm font-medium text-neutral-400 mb-1">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/80 dark:bg-neutral-900/80">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search by name, email, feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-0 cursor-pointer min-w-[150px]"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Evaluations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvaluations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvaluations.map((evaluation) => (
            <div key={evaluation.id} className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col">

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {(evaluation.participant_name || evaluation.name).charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-1">
                      {evaluation.participant_name || evaluation.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{evaluation.year_level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">{evaluation.overall_rating}</span>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 pb-4 mb-auto">
                <div className="flex items-start gap-2 text-neutral-400 mb-2">
                  <Quote className="w-4 h-4 shrink-0 mt-1" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 italic line-clamp-4">
                    &quot;{evaluation.feedback || "No written feedback provided."}&quot;
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Content</span>
                  {renderStars(evaluation.content_rating)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Instructor</span>
                  {renderStars(evaluation.instructor_rating)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Facilities</span>
                  {renderStars(evaluation.facilities_rating)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded truncate max-w-[150px]">
                  {evaluation.event_title}
                </span>
                <span className="text-neutral-400">
                  {new Date(evaluation.submitted_at).toLocaleDateString()}
                </span>
              </div>

              {evaluation.image && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 group"
                    onClick={() => setSelectedImage(evaluation.image || null)}
                  >
                    <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    View Attached Photo
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
          <p>No evaluations found matching your filters.</p>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <DialogTitle className="sr-only">Evaluation Photo</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-3xl p-4">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Evaluation Attachment"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
