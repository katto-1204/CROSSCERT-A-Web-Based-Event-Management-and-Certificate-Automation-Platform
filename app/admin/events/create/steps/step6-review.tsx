'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Upload, MapPin, CalendarIcon, Clock, Users, Ruler, Eye, Palette, Edit, Globe, Lock, Ticket, CheckCircle, UserCheck, Building2, Tag, BookOpen, GraduationCap, FileText, Maximize2, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CertificateTextOverlay } from '../components/certificate-text-overlay'
import { useCreateEventWizard } from '../create-event-wizard-context'

export function Step6Review() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Review & Publish</h2>
            <p className="text-muted-foreground">
              Double-check all event details and visual assets before going live.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Event Details & Settings */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. Identity & Description */}
              <Card className="overflow-hidden border-border bg-card shadow-sm">
                <div className="relative h-48 bg-muted">
                  {w.coverImage ? (
                    <img src={w.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                      <Upload className="w-8 h-8 opacity-50" />
                      <span className="text-xs uppercase tracking-wide">No Cover Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-2xl font-bold shadow-black drop-shadow-md">{w.eventName || 'Untitled Event'}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1 border border-primary/20">
                      <Tag className="w-3 h-3" />
                      {w.eventCategory === 'department' ? 'Department' : w.eventCategory === 'HCDC' ? 'Institution Wide' : 'Public'}
                    </div>
                    {w.departmentCategory && (
                      <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1 border border-blue-500/20">
                        <Building2 className="w-3 h-3" />
                        {w.departmentCategory}
                      </div>
                    )}
                    <div className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium flex items-center gap-1 border border-orange-500/20">
                      <BookOpen className="w-3 h-3" />
                      {w.semester}
                    </div>
                    <div className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium flex items-center gap-1 border border-violet-500/20">
                      <GraduationCap className="w-3 h-3" />
                      {w.schoolYear}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-primary" />
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {w.eventDescription || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* 2. Logistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-border bg-card flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Date & Time</p>
                    <p className="font-semibold text-foreground mt-0.5">{w.eventDate || 'TBD'}</p>
                    <p className="text-sm text-muted-foreground">{w.startTime} - {w.endTime} ({w.timezone})</p>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Venue</p>
                    <p className="font-semibold text-foreground mt-0.5">{w.venue || 'TBD'}</p>
                  </div>
                </Card>
                <Card className="p-4 border-border bg-card flex items-start gap-3 md:col-span-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Speakers / Guests</p>
                    {w.speakers && w.speakers.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {w.speakers.split(',').map((speaker, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium border border-border">
                            <UserCheck className="w-3 h-3" />
                            {speaker.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">No w.speakers listed.</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* 3. Settings & Permissions */}
              <Card className="p-6 border-border bg-card space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground border-b border-border pb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Access & Registration Settings
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Visibility</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {w.isPublic ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                      {w.isPublic ? 'Public Event' : 'Private / Invite Only'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Approval</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {w.requireApproval ? <CheckCircle className="w-4 h-4 text-blue-500" /> : <CheckCircle className="w-4 h-4 text-muted-foreground" />}
                      {w.requireApproval ? 'Required' : 'Auto-approve'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Users className="w-4 h-4 text-foreground" />
                      {w.hasCapacityLimit ? `${w.capacity} Seats` : 'Unlimited'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ticketing</p>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Ticket className="w-4 h-4 text-foreground" />
                      {w.isPaidEvent ? `Paid (₱${w.ticketPrice})` : 'Free Entry'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Visual Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-6 space-y-6">

                {/* Visual Preview Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Visual Assets
                  </h3>

                  {/* 1. Event Card */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex justify-between">
                      <span>Event Card</span>
                      <span className="text-primary">{w.activeTheme.name} Theme</span>
                    </p>

                    {/* Dynamic Event Card Component */}
                    <Card
                      className={`overflow-hidden bg-card shadow-lg mx-auto border-t-8 ${w.activeTheme.border || 'border-transparent'} ${w.useFloat ? 'animate-pulse' : ''} ${w.cardStyle === 'poster' ? 'max-w-[280px] h-[450px] flex flex-col relative' : 'max-w-full'}`}
                      style={{
                        boxShadow: w.useNeon ? `0 0 25px ${w.activeTheme.accent}60` : undefined,
                        transform: w.useFloat ? 'translateY(-5px)' : 'none',
                        fontSize: w.cardStyle === 'poster' ? '0.9em' : '1em'
                      }}
                    >
                      {/* Banner Image */}
                      <div className={`relative group overflow-hidden ${w.cardStyle === 'poster' ? 'absolute inset-0 h-full' : 'h-40 bg-muted'}`}>
                        {/* Pattern Overlay */}
                        {w.usePattern && (
                          <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: w.activeTheme.id === 11 ? '#000' : '#fff' }} />
                        )}

                        {w.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.coverImage}
                            alt="Event Cover"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center bg-muted relative`}>
                            <Upload className={`w-10 h-10 ${w.activeTheme.textColor || 'text-muted-foreground'} opacity-50 relative z-20`} />
                          </div>
                        )}

                        {/* Poster Mode Overlay */}
                        {w.cardStyle === 'poster' && (
                          <div className={`absolute inset-0 bg-gradient-to-t ${w.activeTheme.id === 11 ? 'from-white via-white/50' : 'from-white/95 via-white/40 dark:from-black/95 dark:via-black/50'} to-transparent pointer-events-none`} />
                        )}

                        {/* Date Badge */}
                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md shadow-md text-center min-w-[50px] z-20 ${w.activeTheme.color} ${w.activeTheme.id === 11 ? 'text-slate-900 border border-slate-200' : 'text-white'}`}>
                          <span className="block text-[10px] uppercase font-bold opacity-90">
                            {w.eventDate ? new Date(w.eventDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'DEC'}
                          </span>
                          <span className="block text-lg font-bold leading-none">
                            {w.eventDate ? new Date(w.eventDate).getDate() : '25'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`p-5 relative transition-all ${w.cardStyle === 'poster' ? 'mt-auto z-20' : ''} ${w.useGlass ? 'bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg' : w.activeTheme.id === w.THEME_WHITE_ID && w.cardStyle !== 'poster' ? 'bg-white' : w.activeTheme.id === w.THEME_BLACK_ID && w.cardStyle !== 'poster' ? 'bg-black' : ''}`}>
                        <h3 className={`text-lg font-bold line-clamp-2 mb-2 ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white' : w.activeTheme.textColor || 'text-foreground'}`}>
                          {w.eventName || 'Annual Cross Blazers Cup 2024'}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className={`flex items-center gap-2 text-xs ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-700' : 'text-muted-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : 'text-muted-foreground'}`}>
                            <Clock className={`w-3.5 h-3.5 ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : w.activeTheme.textColor || 'text-primary'}`} />
                            <span>
                              {w.startTime && w.endTime ? `${w.startTime} - ${w.endTime}` : '8:00 AM - 5:00 PM'}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-700' : 'text-muted-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : 'text-muted-foreground'}`}>
                            <MapPin className={`w-3.5 h-3.5 ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : w.activeTheme.textColor || 'text-primary'}`} />
                            <span>{w.venue || 'HCDC Gymnasium'}</span>
                          </div>
                        </div>

                        {/* Action Area */}
                        <div className={`flex items-center justify-between pt-3 border-t ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'border-slate-200' : 'border-border dark:border-white/20') : w.activeTheme.id === w.THEME_BLACK_ID ? 'border-white/20' : w.activeTheme.border ? w.activeTheme.border.replace('border-', 'border-').replace('500', '200').replace('600', '200').replace('700', '200').replace('900', '200') : 'border-border'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-600' : 'text-muted-foreground dark:text-white/70') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/70' : 'text-muted-foreground'}`}>Tickets from</span>
                            <span className={`font-bold text-sm ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white' : w.activeTheme.textColor || 'text-foreground'}`}>
                              {w.isPaidEvent ? `₱${Number(w.ticketPrice).toLocaleString()}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* 2. Certificate Preview */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex justify-between items-center">
                      <span>Certificate</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Click to Preview</span>
                    </p>

                    <Dialog>
                      <DialogTrigger asChild>
                        <div
                          ref={w.reviewCertificateRef}
                          className="relative border border-border rounded-lg overflow-hidden bg-muted cursor-pointer group hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all w-full"
                          style={{ aspectRatio: `${w.certificateSize.width} / ${w.certificateSize.height}` }}
                        >
                          {w.certificateTemplate ? (
                            <>
                              <img src={w.certificateTemplate} alt="Certificate template" className="absolute inset-0 w-full h-full" />
                              <CertificateTextOverlay
                                certificateSize={w.certificateSize}
                                previewScale={w.reviewPreviewScale}
                                certificateCoordinates={w.certificateCoordinates}
                                sampleName={w.sampleName || 'JUAN DELA CRUZ'}
                                sampleEventTitle={w.sampleEventTitle || w.eventName || 'EVENT TITLE'}
                                sampleDate={w.sampleDate || w.eventDate || 'DATE'}
                                eventName={w.eventName}
                                eventDate={w.eventDate}
                                nameFontSize={w.nameFontSize}
                                eventTitleFontSize={w.eventTitleFontSize}
                                dateFontSize={w.dateFontSize}
                                nameFontColor={w.nameFontColor}
                                eventTitleFontColor={w.eventTitleFontColor}
                                dateFontColor={w.dateFontColor}
                              />

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  View Full Size
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-[10px] flex-col gap-1">
                              <FileText className="w-6 h-6 opacity-50" />
                              No Certificate
                            </div>
                          )}
                        </div>
                      </DialogTrigger>

                      {/* Full Size Modal Content */}
                      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                        <DialogTitle className="sr-only">Certificate Full Preview</DialogTitle>
                        <DialogDescription className="sr-only">
                          Full-size preview of the selected certificate template and mapped text fields.
                        </DialogDescription>
                        <div
                          ref={w.dialogCertificateRef}
                          className="relative w-full rounded-lg overflow-hidden shadow-2xl"
                          style={{ aspectRatio: `${w.certificateSize.width} / ${w.certificateSize.height}` }}
                        >
                          <img src={w.certificateTemplate} alt="Certificate Full Preview" className="absolute inset-0 w-full h-full" />
                          <CertificateTextOverlay
                            certificateSize={w.certificateSize}
                            previewScale={w.dialogPreviewScale}
                            certificateCoordinates={w.certificateCoordinates}
                            sampleName={w.sampleName || 'JUAN DELA CRUZ'}
                            sampleEventTitle={w.sampleEventTitle || w.eventName || 'EVENT TITLE'}
                            sampleDate={w.sampleDate || w.eventDate || 'DATE'}
                            eventName={w.eventName}
                            eventDate={w.eventDate}
                            nameFontSize={w.nameFontSize}
                            eventTitleFontSize={w.eventTitleFontSize}
                            dateFontSize={w.dateFontSize}
                            nameFontColor={w.nameFontColor}
                            eventTitleFontColor={w.eventTitleFontColor}
                            dateFontColor={w.dateFontColor}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                </div>

                {/* Final Actions */}
                <div className="flex flex-col gap-3 pt-6 border-t border-border">
                  <Button onClick={w.handleCreateEvent} disabled={w.isLoading || !w.certificateTemplate} className="w-full h-11 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    {w.isLoading ? 'Creating Event...' : 'Confirm & Publish Event'}
                  </Button>
                  <Button variant="outline" onClick={() => w.setCurrentStep(5)} disabled={w.isLoading} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Edit
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </div>
  )
}
