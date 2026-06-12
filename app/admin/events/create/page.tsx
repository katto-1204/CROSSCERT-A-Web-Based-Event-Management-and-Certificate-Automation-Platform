'use client'

import { ArrowLeft } from 'lucide-react'
import { CreateEventWizardProvider, useCreateEventWizard } from './create-event-wizard-context'
import { StepIndicator } from './components/step-indicator'
import { PublishModals } from './components/publish-modals'
import { Step1EventDetails } from './steps/step1-event-details'
import { Step2Options } from './steps/step2-options'
import { Step3Theme } from './steps/step3-theme'
import { Step4Certificate } from './steps/step4-certificate'
import { Step5Mapping } from './steps/step5-mapping'
import { Step6Review } from './steps/step6-review'

function CreateEventPageContent() {
  const w = useCreateEventWizard()

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <button
          onClick={() => w.router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
        <p className="text-muted-foreground">Complete every step to publish your event with a custom certificate.</p>
      </div>

      <StepIndicator
        totalSteps={w.totalSteps}
        currentStep={w.currentStep}
        onStepChange={w.setCurrentStep}
      />

      {w.error && (
        <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-sm text-destructive">
          {w.error}
        </div>
      )}

      {w.currentStep === 1 && <Step1EventDetails />}
      {w.currentStep === 2 && <Step2Options />}
      {w.currentStep === 3 && <Step3Theme />}
      {w.currentStep === 4 && <Step4Certificate />}
      {w.currentStep === 5 && <Step5Mapping />}
      {w.currentStep === 6 && <Step6Review />}

      <PublishModals
        showPublishModal={w.showPublishModal}
        setShowPublishModal={w.setShowPublishModal}
        showErrorModal={w.showErrorModal}
        setShowErrorModal={w.setShowErrorModal}
        publishStatus={w.publishStatus}
        isLoading={w.isLoading}
        error={w.error}
        eventName={w.eventName}
        onSuccessNavigate={w.handleSuccessNavigation}
      />
    </div>
  )
}

export default function CreateEventPage() {
  return (
    <CreateEventWizardProvider>
      <CreateEventPageContent />
    </CreateEventWizardProvider>
  )
}
