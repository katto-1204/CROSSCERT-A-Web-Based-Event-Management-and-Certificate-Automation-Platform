'use client'

type StepIndicatorProps = {
  totalSteps: number
  currentStep: number
  onStepChange: (step: number) => void
}

export function StepIndicator({ totalSteps, currentStep, onStepChange }: StepIndicatorProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1
        const isActive = step === currentStep
        const isCompleted = step < currentStep
        return (
          <div key={step} className="flex items-center gap-2">
            <button
              onClick={() => onStepChange(step)}
              disabled={step > currentStep + 1}
              className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition-colors ${
                isActive || isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {step}
            </button>
            {step < totalSteps && (
              <div className={`h-1 w-10 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
