'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Upload, MapPin, CalendarIcon, Clock, Users, Ruler, Eye, Palette, Edit, Globe, Lock, Ticket, CheckCircle, UserCheck, Building2, Tag, BookOpen, GraduationCap, FileText, Maximize2, Loader2, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CertificateTextOverlay } from '../components/certificate-text-overlay'
import { useCreateEventWizard } from '../create-event-wizard-context'

export function Step5Mapping() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Ruler className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 5 · Coordinate Mapping</h2>
                <p className="text-sm text-muted-foreground">
                  Position text fields on your certificate and customize fonts. Drag elements directly on the preview or use the controls below.
                </p>
              </div>
            </div>
          </Card>

          {/* Main Content Card */}
          <Card className="p-6 border border-border bg-card space-y-6">
            {/* Certificate Preview */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Certificate Preview</h3>
                <p className="text-xs text-muted-foreground">
                  Drag the text elements to position them on your certificate template. Font sizes match the generated PDF — use Download Certificate Sample to verify.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={w.handleDownloadCertificateSample}
                disabled={!w.certificateTemplate || w.isDownloadingSample}
                className="gap-2 shrink-0"
              >
                {w.isDownloadingSample ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Certificate Sample
                  </>
                )}
              </Button>
            </div>
            {w.sampleDownloadError && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {w.sampleDownloadError}
              </p>
            )}

            {/* Visual drag-and-drop preview */}
            <div
              ref={w.certificatePreviewRef}
              className="relative border-2 border-border rounded-xl overflow-hidden bg-muted shadow-inner w-full"
              style={{ aspectRatio: `${w.certificateSize.width} / ${w.certificateSize.height}` }}
            >
              {w.certificateTemplate ? (
                <>
                  {/* Template image — aspect ratio matches container so coordinates map 1:1 to PDF */}
                  <img
                    src={w.certificateTemplate}
                    alt="Certificate template"
                    className="absolute inset-0 w-full h-full select-none pointer-events-none"
                  />
                  <div className="absolute inset-0">
                    <CertificateTextOverlay
                      certificateSize={w.certificateSize}
                      previewScale={w.previewScale}
                      certificateCoordinates={w.certificateCoordinates}
                      sampleName={w.sampleName}
                      sampleEventTitle={w.sampleEventTitle}
                      sampleDate={w.sampleDate}
                      eventName={w.eventName}
                      eventDate={w.eventDate}
                      nameFontSize={w.nameFontSize}
                      eventTitleFontSize={w.eventTitleFontSize}
                      dateFontSize={w.dateFontSize}
                      nameFontColor={w.nameFontColor}
                      eventTitleFontColor={w.eventTitleFontColor}
                      dateFontColor={w.dateFontColor}
                      onDragStart={w.handleDragStart}
                      interactive
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  Upload a certificate template in Step 3 to position the text overlays.
                </div>
              )}
            </div>

            {/* Font Customization Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Font Customization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name Font Controls */}
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">Participant Name</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => w.setNameFontSize(prev => Math.max(8, prev - 2))}
                          className="h-8 w-8"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold">{w.nameFontSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => w.setNameFontSize(prev => Math.min(72, prev + 2))}
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Title Font Controls */}
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">Event Title</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => w.setEventTitleFontSize(prev => Math.max(8, prev - 2))}
                          className="h-8 w-8"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold">{w.eventTitleFontSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => w.setEventTitleFontSize(prev => Math.min(72, prev + 2))}
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Font Controls */}
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">Event Date</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => w.setDateFontSize(prev => Math.max(8, prev - 2))}
                          className="h-8 w-8"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold">{w.dateFontSize}px</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => w.setDateFontSize(prev => Math.min(72, prev + 2))}
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Color Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Name Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={w.nameFontColor}
                      onChange={(e) => w.setNameFontColor(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={w.nameFontColor}
                      onChange={(e) => w.setNameFontColor(e.target.value)}
                      className="h-10 w-24 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Event Title Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Event Title Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={w.eventTitleFontColor}
                      onChange={(e) => w.setEventTitleFontColor(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={w.eventTitleFontColor}
                      onChange={(e) => w.setEventTitleFontColor(e.target.value)}
                      className="h-10 w-24 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Date Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Date Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={w.dateFontColor}
                      onChange={(e) => w.setDateFontColor(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={w.dateFontColor}
                      onChange={(e) => w.setDateFontColor(e.target.value)}
                      className="h-10 w-24 font-mono text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinate Mapping Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Position Coordinates
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Fine-tune the exact position of each text element
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Participant Name', key: 'name' as const },
                  { label: 'Event Title', key: 'eventTitle' as const },
                  { label: 'Event Date', key: 'date' as const },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-3 border border-border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <p className="font-semibold text-sm text-foreground">{label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs uppercase text-muted-foreground">X Position</Label>
                        <Input
                          type="number"
                          value={w.certificateCoordinates[key].x}
                          onChange={(e) => w.handleCoordinateChange(key, 'x', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase text-muted-foreground">Y Position</Label>
                        <Input
                          type="number"
                          value={w.certificateCoordinates[key].y}
                          onChange={(e) => w.handleCoordinateChange(key, 'y', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Text Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Sample Text
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Edit the sample text to preview how it will appear on the certificate
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample Name</Label>
                  <Input value={w.sampleName} onChange={(e) => w.setSampleName(e.target.value)} placeholder="Juan Dela Cruz" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample Event Title</Label>
                  <Input value={w.sampleEventTitle} onChange={(e) => w.setSampleEventTitle(e.target.value)} placeholder="Sample Event Title" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample Date</Label>
                  <Input value={w.sampleDate} onChange={(e) => w.setSampleDate(e.target.value)} placeholder="January 01, 2025" />
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => w.setCurrentStep(4)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Template
              </Button>
              <Button onClick={() => w.setCurrentStep(6)} className="gap-2 min-w-[140px]">
                Review & Publish
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </Card>
        </div>
  )
}
