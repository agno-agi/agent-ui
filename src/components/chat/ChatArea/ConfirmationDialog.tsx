'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import useContinueRun from '@/hooks/useContinueRun'

const ConfirmationDialog = () => {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPausedForConfirmation = useStore(
    (state) => state.isPausedForConfirmation
  )
  const pendingConfirmationToolName = useStore(
    (state) => state.pendingConfirmationToolName
  )
  const pendingConfirmationToolArgs = useStore(
    (state) => state.pendingConfirmationToolArgs
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const { confirmRun, cancelRun } = useContinueRun()

  const handleCancel = async () => {
    setIsSubmitting(true)
    await cancelRun()
    setIsSubmitting(false)
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    await confirmRun(true)
    setIsSubmitting(false)
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    await confirmRun(false)
    setIsSubmitting(false)
  }

  if (!mounted) return null
  if (!isPausedForConfirmation) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background p-6 rounded-lg border border-border max-w-md w-full shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Confirmation Required</h2>
        <p className="text-sm text-muted-foreground mb-2">
          The agent wants to execute{' '}
          <span className="font-medium text-primary">
            {pendingConfirmationToolName || 'a tool'}
          </span>
        </p>
        {Object.keys(pendingConfirmationToolArgs).length > 0 && (
          <div className="mb-4 rounded-lg border border-border bg-secondary/20 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Arguments
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(pendingConfirmationToolArgs).map(
                ([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-medium text-primary min-w-20">
                      {key}:
                    </span>
                    <span className="text-muted-foreground break-all">
                      {value as string}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        <p className="mb-4 text-sm text-muted-foreground">
          Do you want to proceed?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
            onClick={handleReject}
          >
            {isSubmitting ? 'Submitting...' : 'Reject'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2 border border-border text-sm text-muted-foreground hover:text-green-600 rounded-md disabled:opacity-50"
            onClick={handleApprove}
          >
            {isSubmitting ? 'Submitting...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
