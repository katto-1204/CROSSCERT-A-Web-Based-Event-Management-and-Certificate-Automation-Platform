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

export function Step3Theme() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 3 · Choose Theme</h2>
                <p className="text-sm text-muted-foreground">
                  Select a color theme and style for your event card. Preview updates in real-time.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6 border border-border bg-card space-y-6">

              <div className="grid grid-cols-5 gap-3 mb-6">
                {w.THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => w.setSelectedTheme(theme.id)}
                    className={`relative w-full aspect-square rounded-full transition-all flex items-center justify-center group outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${w.selectedTheme === theme.id
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    title={theme.name}
                  >
                    <div className={`w-full h-full rounded-full shadow-sm ${theme.color} ${theme.id === 11 ? 'border border-slate-300 dark:border-slate-600' : ''}`} />
                    {w.selectedTheme === theme.id && (
                      <div className={`absolute inset-0 flex items-center justify-center drop-shadow-md ${theme.id === 11 ? 'text-slate-900' : 'text-white'}`}>
                        <Eye className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Helpful Feature: Card Style Switcher */}
              <div className="space-y-4">
                <div className="bg-muted p-1 rounded-lg grid grid-cols-2 gap-1">
                  <button
                    onClick={() => w.setCardStyle('standard')}
                    className={`py-1.5 text-sm font-medium rounded-md transition-all ${w.cardStyle === 'standard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Standard Card
                  </button>
                  <button
                    onClick={() => w.setCardStyle('poster')}
                    className={`py-1.5 text-sm font-medium rounded-md transition-all ${w.cardStyle === 'poster' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Poster Mode
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => w.setUsePattern(!w.usePattern)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${w.usePattern ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="w-4 h-4 bg-current rounded-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                    </div>
                    <span className="text-xs font-medium">Texture</span>
                  </button>

                  <button
                    onClick={() => w.setUseFloat(!w.useFloat)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${w.useFloat ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-current rounded-md animate-pulse" />
                    </div>
                    <span className="text-xs font-medium">Float</span>
                  </button>

                  <button
                    onClick={() => w.setUseGlass(!w.useGlass)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${w.useGlass ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-current opacity-10 backdrop-blur-sm" />
                      <div className="w-full h-full border border-current opacity-20 rounded-full" />
                    </div>
                    <span className="text-xs font-medium">Glass</span>
                  </button>

                  <button
                    onClick={() => w.setUseNeon(!w.useNeon)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${w.useNeon ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border hover:bg-muted/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-lg shadow-current">
                      <div className="w-3 h-3 bg-current rounded-full" />
                    </div>
                    <span className="text-xs font-medium">Neon</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Selected: <span className="font-semibold text-foreground">{w.activeTheme.name}</span>
              </p>
            </Card>

            {/* Live Preview - Right Side */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Live Preview</h3>

                {/* Event Card Preview */}
                <Card
                  className={`overflow-hidden bg-card shadow-lg mx-auto transition-all duration-1000 ${
                    // Border Logic: Remove default top border for HCDC theme (we use custom div)
                    w.activeTheme.name === 'HCDC' ? 'border-t-0' : `border-t-8 ${w.activeTheme.border || 'border-transparent'}`
                    } ${w.useFloat ? 'animate-pulse' : ''} ${w.cardStyle === 'poster' ? 'max-w-[320px] h-[500px] flex flex-col relative' : 'max-w-md'}`}
                  style={{
                    boxShadow: w.useNeon ? `0 0 25px ${w.activeTheme.accent}60` : undefined,
                    transform: w.useFloat ? 'translateY(-5px)' : 'none',
                    // Removed background gradient as requested
                  }}
                >
                  {/* Custom Gradient Top Border for HCDC Theme */}
                  {w.activeTheme.name === 'HCDC' && (
                    <div className="h-2 w-full" style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #1e3a8a 100%)' }} />
                  )}

                  {/* Banner Image */}
                  <div className={`relative group overflow-hidden ${w.cardStyle === 'poster' ? 'absolute inset-0 h-full' : 'h-48 bg-muted'}`}>
                    {/* Pattern Overlay Surprise */}
                    {w.usePattern && (
                      <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: w.activeTheme.id === 11 ? '#000' : '#fff' }} />
                    )}

                    {w.coverImage ? (
                      <img
                        src={w.coverImage}
                        alt="Event Cover"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-muted relative`}>
                        <Upload className={`w-12 h-12 ${w.activeTheme.textColor || 'text-muted-foreground'} opacity-50 relative z-20`} />
                      </div>
                    )}

                    {/* Poster Mode Overlay */}
                    {w.cardStyle === 'poster' && (
                      <div className={`absolute inset-0 bg-gradient-to-t ${w.activeTheme.id === 11 ? 'from-white via-white/50' : 'from-white/95 via-white/40 dark:from-black/95 dark:via-black/50'} to-transparent pointer-events-none`} />
                    )}

                    {/* Date Badge - Themed */}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-md shadow-md text-center min-w-[60px] z-20 ${w.activeTheme.color} ${w.activeTheme.id === 11 ? 'text-slate-900 border border-slate-200' : 'text-white'}`}>
                      <span className="block text-xs uppercase font-bold opacity-90">
                        {w.eventDate ? new Date(w.eventDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'DEC'}
                      </span>
                      <span className="block text-xl font-bold leading-none">
                        {w.eventDate ? new Date(w.eventDate).getDate() : '25'}
                      </span>
                    </div>

                    {/* Category Badge - Themed */}
                    <div className="absolute top-4 right-4 z-20">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm bg-background/90 backdrop-blur-md ${w.activeTheme.textColor || 'text-foreground'}`}>
                        {w.eventCategory === 'HCDC' ? 'HCDC Wide' : w.eventCategory === 'department' ? 'Department' : 'Public'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`p-6 relative transition-all ${w.cardStyle === 'poster' ? 'mt-auto z-20' : ''} ${w.useGlass ? 'bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg' : w.activeTheme.id === w.THEME_WHITE_ID && w.cardStyle !== 'poster' ? 'bg-white' : w.activeTheme.id === w.THEME_BLACK_ID && w.cardStyle !== 'poster' ? 'bg-black' : ''}`}>
                    <h3 className={`text-xl font-bold line-clamp-2 mb-3 ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white' : w.activeTheme.textColor || 'text-foreground'}`}>
                      {w.eventName || 'Annual Cross Blazers Cup 2024'}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className={`flex items-center gap-3 text-sm ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-700' : 'text-muted-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : 'text-muted-foreground'}`}>
                        <Clock className={`w-4 h-4 ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : w.activeTheme.textColor || 'text-primary'}`} />
                        <span>
                          {w.startTime && w.endTime ? `${w.startTime} - ${w.endTime}` : '8:00 AM - 5:00 PM'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-3 text-sm ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-700' : 'text-muted-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : 'text-muted-foreground'}`}>
                        <MapPin className={`w-4 h-4 ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white/80') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/80' : w.activeTheme.textColor || 'text-primary'}`} />
                        <span>{w.venue || 'HCDC Gymnasium'}</span>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className={`flex items-center justify-between pt-4 border-t ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'border-slate-200' : 'border-border dark:border-white/20') : w.activeTheme.id === w.THEME_BLACK_ID ? 'border-white/20' : w.activeTheme.border ? w.activeTheme.border.replace('border-', 'border-').replace('500', '200').replace('600', '200').replace('700', '200').replace('900', '200') : 'border-border'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-600' : 'text-muted-foreground dark:text-white/70') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white/70' : 'text-muted-foreground'}`}>Tickets starting at</span>
                        <span className={`font-bold ${w.cardStyle === 'poster' ? (w.activeTheme.id === w.THEME_WHITE_ID ? 'text-slate-900' : 'text-foreground dark:text-white') : w.activeTheme.id === w.THEME_BLACK_ID ? 'text-white' : w.activeTheme.textColor || 'text-foreground'}`}>
                          {w.isPaidEvent ? `₱${Number(w.ticketPrice).toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                      <Button
                        className={`${w.activeTheme.color} ${w.activeTheme.id === 11 ? 'text-slate-900 border border-slate-200 hover:bg-slate-50' : 'text-white hover:opacity-90'} transition-opacity shadow-sm pointer-events-none`}
                      >
                        Register
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="mt-8 flex justify-center gap-8">
                  {/* Mobile Preview Mockup */}
                  <div className="w-16 h-2 rounded-full bg-border mx-auto mb-2" />
                </div>
              </div>
            </div>

            {/* Navigation */}
            {/* Navigation Bar - Fixed at bottom of section */}
            <Card className="p-4 border border-border bg-card flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => w.setCurrentStep(2)} disabled={w.isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Options
              </Button>
              <Button
                onClick={() => w.setCurrentStep(4)}
                className="gap-2 min-w-[160px]"
              >
                Continue to Template
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Card>
          </div>
        </div>
  )
}
