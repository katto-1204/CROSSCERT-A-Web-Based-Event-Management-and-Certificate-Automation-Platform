'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, AlertCircle, Loader2, Check, Sparkles, Award, TrendingUp, MessageSquare, Users, MapPin, Clock, BookOpen, Target, ThumbsUp, Heart, Lightbulb, Camera, Image as ImageIcon, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiCall, getAuthenticatedUserEmail, authApi } from '@/lib/api-config'

export default function ParticipantEvaluation() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<any>(null)
  const [registration, setRegistration] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; year_level?: string } | null>(null)
  const [formData, setFormData] = useState({
    contentRating: 4,
    instructorRating: 4,
    facilitiesRating: 4,
    overallRating: 4,
    organizationRating: 4,
    timeManagementRating: 4,
    materialsRating: 4,
    relevanceRating: 4,
    recommendationRating: 4,
    yearLevel: '',
    feedback: '',
    mostLiked: '',
    suggestions: '',
    image: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [eventStatus, setEventStatus] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userEmail = await getAuthenticatedUserEmail()
        if (!userEmail) {
          setError('Please sign in to submit an evaluation.')
          setLoading(false)
          return
        }

        const profileResponse = await apiCall.get(authApi.me())
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.authenticated && profileData.user) {
            const user = profileData.user
            setUserProfile({
              name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
              email: user.email,
              year_level: '',
            })
          }
        }

        const eventUrl = api.eventById(params.id as string)
        const eventResponse = await apiCall.get(eventUrl)

        if (eventResponse.ok) {
          const apiEvent = await eventResponse.json()
          setEvent(apiEvent)
          setEventStatus(apiEvent.status || '')
        } else {
          setError('Event not found.')
          setLoading(false)
          return
        }

        const regUrl = `${api.registrations()}?event=${params.id}&email=${encodeURIComponent(userEmail)}`
        const regResponse = await apiCall.get(regUrl)

        if (regResponse.ok) {
          const regData = await regResponse.json()
          const registrations = Array.isArray(regData) ? regData : (regData.results || regData.data || [])
          if (registrations.length > 0) {
            setRegistration(registrations[0])
          } else {
            setError('Registration not found. Please register for this event first.')
            setLoading(false)
            return
          }
        } else {
          setError('Could not fetch registration.')
          setLoading(false)
          return
        }
      } catch (err: any) {
        console.error('[Evaluation] Error fetching data:', err)
        setError(err.message || 'Failed to load evaluation form.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    fetchData()
  }, [params.id])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Increased limit to 10MB since we compress
        alert('File size too large. Please upload an image smaller than 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Set canvas dimensions to match image
          canvas.width = img.width
          canvas.height = img.height

          // Draw image to canvas
          ctx?.drawImage(img, 0, 0)

          // Compress to JPEG at 80% quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)

          setFormData(prev => ({ ...prev, image: compressedBase64 }))
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!registration || !userProfile) {
      alert('Missing registration or user information.')
      return
    }

    if (!formData.yearLevel.trim()) {
      alert('Please provide your year level.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        registration: registration.id,
        name: userProfile.name,
        email: userProfile.email,
        year_level: formData.yearLevel,
        content_rating: formData.contentRating,
        instructor_rating: formData.instructorRating,
        facilities_rating: formData.facilitiesRating,
        overall_rating: formData.overallRating,
        organization_rating: formData.organizationRating,
        time_management_rating: formData.timeManagementRating,
        materials_rating: formData.materialsRating,
        relevance_rating: formData.relevanceRating,
        recommendation_rating: formData.recommendationRating,
        feedback: formData.feedback,
        most_liked: formData.mostLiked,
        suggestions: formData.suggestions,
        image: formData.image,
      }

      const response = await apiCall.post(api.evaluations(), payload)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        setError(errorData.detail || errorData.error || 'Failed to submit evaluation. Please make sure you have checked in and checked out.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error('[Evaluation] Error submitting:', err)
      setError(err.message || 'Network error while submitting evaluation.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <Card className="p-12 border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-3xl text-center max-w-md">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading evaluation form...</p>
        </Card>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <Card className="p-12 border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-3xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Error</h2>
              <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
            </div>
            <Button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const normalizedStatus = (eventStatus || '').toLowerCase()
  if (normalizedStatus !== 'completed') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>

          <Card className="p-12 border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-3xl text-center space-y-6">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">Evaluation Not Available</h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                This event has not been concluded yet. Evaluations will be available once the event organizer concludes the event.
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8"
              onClick={() => router.push(`/participant/event/${params.id}`)}
            >
              Back to Event
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-neutral-950 dark:via-green-950/20 dark:to-neutral-950 flex items-center justify-center p-6">
        <Card className="p-12 border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full space-y-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-500" />

          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30 animate-bounce">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>

          <div>
            <h2 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">Thank You!</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-2">Your evaluation has been submitted successfully.</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Your certificate will be generated and sent to your email shortly.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl"
              onClick={() => router.push(`/participant/event/${params.id}`)}
            >
              Back to Event
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 rounded-xl font-semibold"
              onClick={() => router.push('/participant/certificates')}
            >
              <Award className="w-4 h-4 mr-2" />
              View My Certificates
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const RatingSection = ({ label, value, onChange, icon: Icon }: { label: string; value: number; onChange: (value: number) => void; icon: any }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <Label className="text-base font-semibold text-neutral-900 dark:text-white">{label}</Label>
      </div>
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-all hover:scale-125 active:scale-95"
          >
            <Star
              className={`w-10 h-10 ${star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-neutral-300 dark:text-neutral-700'
                }`}
            />
          </button>
        ))}
        <span className="ml-3 text-2xl font-bold text-neutral-900 dark:text-white">{value}<span className="text-neutral-400">/5</span></span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-neutral-950 dark:via-red-950/10 dark:to-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-white tracking-tight">Event Evaluation</h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400">Help us improve by sharing your experience</p>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">{event?.title || event?.name || 'Event'}</p>
        </div>

        {error && (
          <Card className="p-6 border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          </Card>
        )}

        {/* Evaluation Form */}
        <Card className="p-8 md:p-12 border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-3xl space-y-8">

          {/* Year Level */}
          <div className="space-y-3">
            <Label htmlFor="yearLevel" className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Year Level <span className="text-red-600">*</span>
            </Label>
            <Input
              id="yearLevel"
              placeholder="e.g., 1st Year, 2nd Year, 3rd Year, 4th Year"
              value={formData.yearLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value }))}
              className="h-14 text-lg border-2 rounded-xl focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Ratings */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-500" />
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Rate Your Experience</h3>
            </div>

            <RatingSection
              label="Content Quality"
              value={formData.contentRating}
              onChange={(value) => setFormData(prev => ({ ...prev, contentRating: value }))}
              icon={Award}
            />
            <RatingSection
              label="Instructor/Resource Speaker"
              value={formData.instructorRating}
              onChange={(value) => setFormData(prev => ({ ...prev, instructorRating: value }))}
              icon={Users}
            />
            <RatingSection
              label="Facilities/Venue"
              value={formData.facilitiesRating}
              onChange={(value) => setFormData(prev => ({ ...prev, facilitiesRating: value }))}
              icon={MapPin}
            />
            <RatingSection
              label="Overall Experience"
              value={formData.overallRating}
              onChange={(value) => setFormData(prev => ({ ...prev, overallRating: value }))}
              icon={Star}
            />
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Additional Ratings */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-red-500" />
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Additional Feedback</h3>
            </div>

            <RatingSection
              label="Event Organization"
              value={formData.organizationRating}
              onChange={(value) => setFormData(prev => ({ ...prev, organizationRating: value }))}
              icon={Sparkles}
            />
            <RatingSection
              label="Time Management"
              value={formData.timeManagementRating}
              onChange={(value) => setFormData(prev => ({ ...prev, timeManagementRating: value }))}
              icon={Clock}
            />
            <RatingSection
              label="Materials/Handouts Quality"
              value={formData.materialsRating}
              onChange={(value) => setFormData(prev => ({ ...prev, materialsRating: value }))}
              icon={BookOpen}
            />
            <RatingSection
              label="Relevance to Your Field"
              value={formData.relevanceRating}
              onChange={(value) => setFormData(prev => ({ ...prev, relevanceRating: value }))}
              icon={Target}
            />
            <RatingSection
              label="Would Recommend This Event"
              value={formData.recommendationRating}
              onChange={(value) => setFormData(prev => ({ ...prev, recommendationRating: value }))}
              icon={ThumbsUp}
            />
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Text Feedback Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="mostLiked" className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                What did you like most about the event? (Optional)
              </Label>
              <Textarea
                id="mostLiked"
                placeholder="Tell us what you enjoyed the most..."
                value={formData.mostLiked}
                onChange={(e) => setFormData(prev => ({ ...prev, mostLiked: e.target.value }))}
                className="min-h-28 text-lg border-2 rounded-xl focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="suggestions" className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-red-500" />
                Suggestions for Improvement (Optional)
              </Label>
              <Textarea
                id="suggestions"
                placeholder="How can we make future events better?"
                value={formData.suggestions}
                onChange={(e) => setFormData(prev => ({ ...prev, suggestions: e.target.value }))}
                className="min-h-28 text-lg border-2 rounded-xl focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="feedback" className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" />
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Any other thoughts, comments, or feedback..."
                value={formData.feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                className="min-h-28 text-lg border-2 rounded-xl focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500" />
              Upload Event Photo (Optional)
            </Label>

            {!formData.image ? (
              <div className="group relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 rounded-2xl p-8 transition-colors text-center cursor-pointer bg-neutral-50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-neutral-400 dark:text-neutral-500 group-hover:text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-700 dark:text-neutral-300">Click to upload a photo</p>
                    <p className="text-sm text-neutral-500">JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={formData.image}
                  alt="Event"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" /> Remove Photo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all"
            onClick={handleSubmit}
            disabled={submitting || !formData.yearLevel.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Submitting Your Evaluation...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-3" />
                Submit Evaluation
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}
