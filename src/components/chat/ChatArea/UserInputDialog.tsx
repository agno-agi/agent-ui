'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import useContinueRun from '@/hooks/useContinueRun'

const UserInputDialog = () => {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPausedForInput = useStore((state) => state.isPausedForInput)
  const pendingUserInputFields = useStore(
    (state) => state.pendingUserInputFields
  )
  const pausedToolName = useStore((state) => state.pausedToolName)
  const setIsPausedForInput = useStore((state) => state.setIsPausedForInput)
  const setPendingUserInputFields = useStore(
    (state) => state.setPendingUserInputFields
  )
  const setPausedRunId = useStore((state) => state.setPausedRunId)
  const setPausedSessionId = useStore((state) => state.setPausedSessionId)
  const setPausedToolName = useStore((state) => state.setPausedToolName)
  const setPendingConfirmationToolName = useStore(
    (state) => state.setPendingConfirmationToolName
  )
  const setPendingConfirmationToolArgs = useStore(
    (state) => state.setPendingConfirmationToolArgs
  )
  const setPendingConfirmationToolCallId = useStore(
    (state) => state.setPendingConfirmationToolCallId
  )
  const setPausedToolCallId = useStore((state) => state.setPausedToolCallId)
  const setIsPausedForConfirmation = useStore(
    (state) => state.setIsPausedForConfirmation
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const { continueRun, cancelRun } = useContinueRun()
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  const handleCancel = async () => {
    setIsSubmitting(true)
    await cancelRun()
    setIsSubmitting(false)
    setFieldValues({})
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const values: Record<string, string> = {}
    for (const field of pendingUserInputFields) {
      if (field.value !== null) {
        values[field.name] = field.value
      } else {
        values[field.name] = fieldValues[field.name] || ''
      }
    }
    setFieldValues({})
    await continueRun(values)
    setIsSubmitting(false)
  }

  if (!mounted) return null

  if (!isPausedForInput || pendingUserInputFields.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background p-6 rounded-lg border border-border max-w-md w-full shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Input Required</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {pausedToolName ? (
            <>
              The agent needs additional information to execute{' '}
              <span className="font-medium text-primary">
                {pausedToolName}
              </span>
            </>
          ) : (
            'The agent needs additional information to continue.'
          )}
        </p>
        <div className="flex flex-col gap-4 mb-4">
          {pendingUserInputFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-primary">
                {field.name}
                {field.field_type && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({field.field_type})
                  </span>
                )}
              </label>
              {field.description && (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              )}
              {field.value !== null ? (
                <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
                  {field.value}
                </p>
              ) : (
                <input
                  type="text"
                  value={fieldValues[field.name] || ''}
                  onChange={(e) =>
                    setFieldValues((prev) => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))
                  }
                  placeholder={`Enter ${field.name}`}
                  disabled={isSubmitting}
                  autoFocus={
                    pendingUserInputFields.indexOf(field) === 0 &&
                    field.value === null
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2 border border-border rounded-md text-sm disabled:opacity-50"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2 border border-border rounded-md hover:opacity-30 text-sm disabled:opacity-50"
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserInputDialog
