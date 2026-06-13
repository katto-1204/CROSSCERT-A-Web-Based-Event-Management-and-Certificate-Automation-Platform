'use client'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Check, AlertCircle, ArrowLeft } from 'lucide-react'

type PublishModalsProps = {
  showPublishModal: boolean
  setShowPublishModal: (open: boolean) => void
  showErrorModal: boolean
  setShowErrorModal: (open: boolean) => void
  publishStatus: 'idle' | 'loading' | 'success'
  isLoading: boolean
  error: string
  eventName: string
  onSuccessNavigate: () => void
}

export function PublishModals({
  showPublishModal,
  setShowPublishModal,
  showErrorModal,
  setShowErrorModal,
  publishStatus,
  isLoading,
  error,
  eventName,
  onSuccessNavigate,
}: PublishModalsProps) {
  return (
    <>
      <Dialog
        open={showPublishModal}
        onOpenChange={(open) => {
          if (!isLoading && open === false) {
            setShowPublishModal(false)
            if (publishStatus === 'success') {
              onSuccessNavigate()
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md text-center p-8">
          <DialogTitle className="sr-only">
            {publishStatus === 'loading' ? 'Publishing Event' : 'Event Published'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {publishStatus === 'loading'
              ? 'The event is being created and published.'
              : 'The event was published successfully.'}
          </DialogDescription>

          {publishStatus === 'loading' ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Publishing Event</h3>
                <p className="text-muted-foreground">Please wait while we set up your event...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 animate-in zoom-in-50 duration-300">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600 dark:text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-500">Success!</h3>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{eventName}</span> has been published successfully.
                </p>
              </div>
              <Button onClick={onSuccessNavigate} className="w-full bg-green-600 hover:bg-green-700 text-white">
                View Event Details
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md text-center p-6">
          <DialogTitle className="sr-only">Validation Error</DialogTitle>
          <DialogDescription className="sr-only">
            The event could not be published because the schedule needs to be corrected.
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-4 pt-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Scheduling Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground mt-2"
            >
              Okay, I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
