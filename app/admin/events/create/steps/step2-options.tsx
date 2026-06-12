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

export function Step2Options() {
  const w = useCreateEventWizard()
  const router = useRouter()
  return (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">Step 2 · Event Options</h2>
                <p className="text-sm text-muted-foreground">
                  Configure registration settings and access control for your event.
                </p>
              </div>
            </div>
          </Card>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Capacity Limit */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Limit Capacity</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Restrict the number of participants</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => w.setHasCapacityLimit(prev => !prev)}
                  className={`transition-all ${w.hasCapacityLimit ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {w.hasCapacityLimit ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              {w.hasCapacityLimit && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm">Maximum Capacity</Label>
                  <Input type="number" value={w.capacity} min={1} onChange={(e) => w.setCapacity(e.target.value)} placeholder="100" />
                </div>
              )}
            </Card>

            {/* Require Approval */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Require Approval</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Manually approve each registration</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => w.setRequireApproval(prev => !prev)}
                  className={`transition-all ${w.requireApproval ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {w.requireApproval ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </Card>

            {/* Paid Event */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💰</span>
                    <h3 className="font-semibold text-foreground">Paid Event</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Charge a ticket price for entry</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => w.setIsPaidEvent(prev => !prev)}
                  className={`transition-all ${w.isPaidEvent ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {w.isPaidEvent ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              {w.isPaidEvent && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm">Ticket Price (PHP)</Label>
                  <Input type="number" min={0} max={1000} value={w.ticketPrice} onChange={(e) => w.setTicketPrice(e.target.value)} placeholder="100" />
                  <p className="text-xs text-muted-foreground">Maximum price allowed is ₱1,000</p>
                </div>
              )}
            </Card>

            {/* Public Event */}
            <Card className="p-6 border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Public Event</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Show on the Discover page</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => w.setIsPublic(prev => !prev)}
                  className={`transition-all ${w.isPublic ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                >
                  {w.isPublic ? 'Public' : 'Private'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => w.setCurrentStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </Button>
              <Button disabled={!w.isStep2Valid} onClick={() => w.setCurrentStep(3)} className="gap-2 min-w-[140px]">
                Continue
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </Card>
        </div>
  )
}
