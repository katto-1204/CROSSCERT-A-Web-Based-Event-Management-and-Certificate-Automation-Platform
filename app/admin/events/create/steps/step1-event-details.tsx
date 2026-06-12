'use client'

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

export function Step1EventDetails() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className={`p-6 border border-border ${w.activeTheme.color} bg-opacity-10`} style={{ background: w.activeTheme.name === 'HCDC' ? 'linear-gradient(135deg, #b91c1c 0%, #1e3a8a 100%)' : undefined }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-bounce">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">Step 1 · Event Details</h2>
                <p className="text-sm text-white/90">
                  Fill in the essential information about your event. Fields marked with * are required.
                </p>
              </div>
            </div>
          </Card>

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <Card className="lg:col-span-2 p-6 border border-border bg-card space-y-6">
              <div className="space-y-5">
                {/* Event Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-destructive">*</span>
                    Event Name
                  </Label>
                  <Input
                    value={w.eventName}
                    onChange={(e) => w.setEventName(e.target.value)}
                    placeholder="e.g., CROSS BLAZERS CUP 2025"
                    className="text-base"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-destructive">*</span>
                    Description
                  </Label>
                  <Textarea
                    value={w.eventDescription}
                    onChange={(e) => w.setEventDescription(e.target.value)}
                    placeholder="Describe your event, its purpose, and what participants can expect..."
                    className="min-h-32 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{w.eventDescription.length} characters</p>
                </div>

                {/* Date & Time Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Date & Time
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <span className="text-destructive">*</span>
                        Event Date
                      </Label>
                      <Input
                        type="date"
                        value={w.eventDate}
                        onChange={(e) => w.setEventDate(e.target.value)}
                        min={w.getMinEventDate()}
                      />
                      {w.scheduleError && (
                        <p className="text-xs text-destructive">{w.scheduleError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Timezone</Label>
                      <Input value={w.timezone} onChange={(e) => w.setTimezone(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <span className="text-destructive">*</span>
                        Start Time
                      </Label>
                      <Input type="time" value={w.startTime} onChange={(e) => w.setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <span className="text-destructive">*</span>
                        End Time
                      </Label>
                      <Input type="time" value={w.endTime} onChange={(e) => w.setEndTime(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Location
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <span className="text-destructive">*</span>
                      Venue
                    </Label>
                    <div className="space-y-4">
                      {/* Visual Venue Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {w.VENUES.map((v) => (
                          <div
                            key={v.name}
                            onClick={() => {
                              w.setVenue(v.name)
                              // Auto-suggest w.capacity if enabled
                              if (w.hasCapacityLimit) {
                                w.setCapacity(v.capacity.toString())
                              }
                            }}
                            className={`
                              cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 relative overflow-hidden group
                              ${w.venue === v.name
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                              }
                            `}
                          >
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm transition-colors
                              ${w.venue === v.name ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-background'}
                            `}>
                              {v.icon}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${w.venue === v.name ? 'text-primary' : 'text-foreground'}`}>
                                {v.name}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-md">
                                  <Users className="w-3 h-3" />
                                  {v.capacity}
                                </span>
                              </div>
                            </div>
                            {w.venue === v.name && (
                              <div className="absolute top-3 right-3 animate-in fade-in zoom-in duration-200">
                                <CheckCircle className="w-4 h-4 text-primary fill-primary/20" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Custom Venue Input */}
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground mb-1.5 ml-1 block">Or enter a custom w.venue</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={w.venue}
                            onChange={(e) => w.setVenue(e.target.value)}
                            placeholder="Type a custom w.venue name..."
                            className="pl-9 bg-muted/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Additional Details
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-sm">Speakers (Optional)</Label>
                    <Input
                      value={w.speakers}
                      onChange={(e) => w.setSpeakers(e.target.value)}
                      placeholder="Separate names with commas: John Doe, Jane Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Semester</Label>
                      <select
                        value={w.semester}
                        onChange={(e) => w.setSemester(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Semester</option>
                        {w.SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">School Year</Label>
                      <select
                        value={w.schoolYear}
                        onChange={(e) => w.setSchoolYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select School Year</option>
                        {w.SCHOOL_YEARS.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Event Category Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground">Event Category</h3>
                  <div className="space-y-2">
                    <Label className="text-sm">Category Type</Label>
                    <select
                      value={w.eventCategory}
                      onChange={(e) => {
                        w.setEventCategory(e.target.value)
                        if (e.target.value === 'outside') {
                          w.setDepartmentCategory('Outside Event')
                        }
                      }}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="HCDC">HCDC-Wide Event</option>
                      <option value="department">Departmental Event</option>
                      <option value="outside">Outside Event</option>
                    </select>
                  </div>
                  {w.eventCategory === 'department' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-sm">College / School</Label>
                      <select
                        value={w.departmentCategory}
                        onChange={(e) => w.setDepartmentCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a college or school</option>
                        {Object.keys(w.COLLEGES).map((college) => (
                          <option key={college} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Right Column - Cover Image */}
            <Card className="p-6 border border-border bg-card space-y-4 h-fit sticky top-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Cover Image</h3>
                <p className="text-xs text-muted-foreground">
                  Upload an eye-catching image for your event
                </p>
              </div>

              <div className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300 ${w.coverImage ? 'border-primary' : 'border-border hover:border-primary/50'
                }`}>
                <input
                  type="file"
                  accept="image/*"
                  id="cover-upload"
                  className="hidden"
                  onChange={w.handleCoverUpload}
                />
                <label htmlFor="cover-upload" className="cursor-pointer block">
                  {w.coverImage ? (
                    <div className="relative group">
                      <img src={w.coverImage} alt="Cover" className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Upload className="w-8 h-8 text-white mx-auto" />
                          <p className="text-white text-sm font-semibold">Change Image</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 hover:bg-muted/30 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1">Upload Image</p>
                      <p className="text-xs text-muted-foreground text-center">
                        Click to browse or drag and drop
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommendations</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    16:9 aspect ratio
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Minimum 1200×675 pixels
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    JPG or PNG format
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => w.router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>
              <Button disabled={!w.isStep1Valid} onClick={() => w.setCurrentStep(2)} className="gap-2 min-w-[140px]">
                Continue
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </Card>
        </div>
  )
}
