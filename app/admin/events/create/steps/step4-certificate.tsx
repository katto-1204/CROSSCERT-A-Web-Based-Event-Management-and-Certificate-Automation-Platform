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

export function Step4Certificate() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
        <div className="space-y-6">
          {/* Header Section with Enhanced Typography */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  Step 4 · Certificate Template
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Select from our professionally designed department templates or upload your own custom certificate design.
                </p>
              </div>
              {w.certificateTemplate && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Template Selected</span>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left side: Premade Templates - Takes 2 columns */}
            <Card className="xl:col-span-2 p-6 border border-border bg-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Premade Certificates
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {w.PREMADE_CERTIFICATES.length} templates
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to select • Hover for details
                  </p>
                </div>
              </div>

              {/* Template Grid with Enhanced Design */}
              <div className="grid grid-cols-4 gap-4">
                {w.PREMADE_CERTIFICATES.map((template, index) => (
                  <button
                    key={template.path}
                    onClick={() => w.handlePremadeTemplateSelect(template.path)}
                    className={`group relative aspect-[2000/1414] rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${w.selectedPremadeTemplate === template.path
                      ? 'border-primary ring-4 ring-primary/20 shadow-xl scale-105'
                      : 'border-border hover:border-primary/50 shadow-md'
                      }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                    }}
                  >
                    {/* Template Image */}
                    <img
                      src={template.path}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                    {/* Department Info - Slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="text-center space-y-1">
                        <p className="text-white font-bold text-sm drop-shadow-lg">{template.name}</p>
                        <p className="text-white/90 text-[10px] leading-tight drop-shadow-md line-clamp-2">
                          {template.department}
                        </p>
                      </div>
                    </div>

                    {/* Selected Badge - Enhanced */}
                    {w.selectedPremadeTemplate === template.path && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-1 shadow-lg animate-in zoom-in duration-300">
                        <Eye className="w-3 h-3" />
                        <span className="text-[10px] font-semibold">SELECTED</span>
                      </div>
                    )}

                    {/* Corner Badge with Template Name */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {template.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Helper Text */}
              <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">💡</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Pro Tip:</span> The HCDC-Wide template is perfect for institution-wide events,
                  while department-specific templates are ideal for college or school events.
                </p>
              </div>
            </Card>

            {/* Right side: Preview & Upload */}
            <Card className="p-6 border border-border bg-card space-y-6 h-fit sticky top-6">
              {/* Preview Section - Always Visible and Prominent */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Preview</h3>
                  {w.certificateTemplate && (
                    <div className="flex items-center gap-2">
                      {w.selectedPremadeTemplate ? (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {w.PREMADE_CERTIFICATES.find(t => t.path === w.selectedPremadeTemplate)?.name || 'Premade'}
                        </span>
                      ) : (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Custom</span>
                      )}
                    </div>
                  )}
                </div>

                {w.certificateTemplate ? (
                  <div className="relative group rounded-xl overflow-hidden border-2 border-primary shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
                    <img
                      src={w.certificateTemplate}
                      alt="Certificate template"
                      className="w-full rounded-lg transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <div className="text-center space-y-1">
                        <span className="text-white text-sm font-bold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full block">
                          Selected Template
                        </span>
                        <span className="text-white/80 text-xs">
                          {w.certificateSize.width} × {w.certificateSize.height} px
                        </span>
                      </div>
                    </div>
                    {/* Animated border pulse */}
                    <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/30 aspect-[1123/794] flex items-center justify-center">
                    <div className="text-center space-y-3 p-6">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                        <Eye className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">No Template Selected</p>
                        <p className="text-xs text-muted-foreground/70">
                          Choose a premade template or upload your own
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Upload Custom Certificate Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Upload Custom</h3>
                  <p className="text-xs text-muted-foreground">
                    Use your own certificate design
                  </p>
                </div>

                {/* Enhanced Upload Area */}
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${w.certificateTemplate && !w.selectedPremadeTemplate
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    id="certificate-upload"
                    className="hidden"
                    onChange={w.handleCertificateUpload}
                  />
                  <label htmlFor="certificate-upload" className="flex flex-col items-center gap-3 cursor-pointer group">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-7 h-7 text-primary group-hover:animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {w.certificateTemplate && !w.selectedPremadeTemplate ? 'Change Template' : 'Upload Certificate'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG or JPG • Landscape
                      </p>
                    </div>
                  </label>
                </div>

                {/* Error Display */}
                {w.certificateError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      {w.certificateError}
                    </p>
                  </div>
                )}

                {/* Requirements List */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requirements</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Landscape orientation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      PNG or JPEG format
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      High resolution recommended
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Bar - Fixed at bottom of section */}
          {/* Navigation Bar - Fixed at bottom of section */}
          {/* Navigation Bar - Fixed at bottom of section */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 flex justify-center animate-in slide-in-from-bottom-5 duration-300">
            <div className="w-full max-w-5xl flex items-center justify-between">
              <Button variant="outline" onClick={() => w.setCurrentStep(3)} disabled={w.isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Theme
              </Button>
              <Button
                disabled={!w.certificateTemplate}
                onClick={() => w.setCurrentStep(5)}
                className="gap-2 min-w-[160px]"
              >
                Continue to Mapping
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
  )
}
