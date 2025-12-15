'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'
import type {
  SessionStateSchema,
  SessionStateProvider
} from '@/config/sessionStateSchemas'

interface SessionStateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSession: (sessionState: Record<string, string>) => void
  isCreating: boolean
  schema?: SessionStateSchema | null
}

interface KeyValuePair {
  id: string
  key: string
  value: string
  label?: string
  placeholder?: string
  required?: boolean
  provider?: SessionStateProvider // If set, field is read-only
}

export default function SessionStateModal({
  open,
  onOpenChange,
  onCreateSession,
  isCreating,
  schema
}: SessionStateModalProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>([])
  const { data: session } = useSession()

  // Helper to resolve provider values
  const getProviderValue = useCallback((provider: SessionStateProvider): string => {
    switch (provider) {
      case 'google_email':
        return session?.user?.email || ''
      case 'google_name':
        return session?.user?.name || ''
      default:
        return ''
    }
  }, [session?.user?.email, session?.user?.name])

  // Initialize pairs from schema when modal opens
  useEffect(() => {
    if (open && schema && Object.keys(schema).length > 0) {
      const initialPairs = Object.entries(schema).map(([key, config]) => ({
        id: crypto.randomUUID(),
        key: key,
        // Pre-fill with provider value if available, otherwise empty
        value: config.provider ? getProviderValue(config.provider) : '',
        label: config.label,
        placeholder: config.placeholder,
        required: config.required,
        provider: config.provider
      }))
      setPairs(initialPairs)
    } else if (open && !schema) {
      // Start with empty array for manual entry
      setPairs([])
    }
  }, [schema, open, getProviderValue])

  const addPair = () => {
    setPairs([...pairs, { id: crypto.randomUUID(), key: '', value: '' }])
  }

  const updatePair = (id: string, field: 'key' | 'value', newValue: string) => {
    setPairs(
      pairs.map((pair) =>
        pair.id === id ? { ...pair, [field]: newValue } : pair
      )
    )
  }

  const removePair = (id: string) => {
    setPairs(pairs.filter((pair) => pair.id !== id))
  }

  const handleCreate = () => {
    // Validate required fields
    const missingRequired: string[] = []
    const sessionState: Record<string, string> = {}

    pairs.forEach((pair) => {
      if (pair.key.trim()) {
        // Check if required field is empty
        if (pair.required && !pair.value.trim()) {
          missingRequired.push(pair.label || pair.key)
        }
        sessionState[pair.key.trim()] = pair.value
      }
    })

    if (missingRequired.length > 0) {
      toast.error(`Required fields missing: ${missingRequired.join(', ')}`)
      return
    }

    onCreateSession(sessionState)
    // Reset pairs for next time
    setPairs([])
  }

  const handleCancel = () => {
    setPairs([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-dmmono">
        <DialogHeader>
          <DialogTitle className="text-primary">Configure Session State</DialogTitle>
          <DialogDescription className="text-muted">
            Add key-value pairs to customize your session state
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {pairs.length === 0 ? (
            <div className="rounded-lg border border-primary/15 bg-accent p-4 text-center text-xs text-muted">
              No fields added yet. Click &quot;Add Field&quot; to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {pairs.map((pair) => (
                <div key={pair.id} className="space-y-2">
                  {pair.label && (
                    <label className="text-xs font-medium text-primary">
                      {pair.label}
                      {pair.required && (
                        <span className="ml-1 text-destructive">*</span>
                      )}
                    </label>
                  )}
                  <div className="flex items-center gap-2">
                    {/* Show key input only if no schema (manual entry) */}
                    {!schema && (
                      <input
                        type="text"
                        placeholder="key"
                        value={pair.key}
                        onChange={(e) =>
                          updatePair(pair.id, 'key', e.target.value)
                        }
                        className="h-9 flex-1 rounded-lg border border-primary/15 bg-accent px-3 text-xs text-primary placeholder:text-muted focus:border-primary focus:outline-none"
                      />
                    )}
                    <input
                      type="text"
                      placeholder={pair.placeholder || 'value'}
                      value={pair.value}
                      onChange={(e) =>
                        updatePair(pair.id, 'value', e.target.value)
                      }
                      disabled={!!pair.provider}
                      className={`h-9 flex-1 rounded-lg border border-primary/15 bg-accent px-3 text-xs text-primary placeholder:text-muted focus:border-primary focus:outline-none ${
                        pair.provider ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                    />
                    {/* Only show remove button if no schema (manual entry) */}
                    {!schema && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePair(pair.id)}
                        className="h-9 w-9 hover:bg-destructive/10"
                      >
                        <Icon
                          type="trash"
                          size="xs"
                          className="text-destructive"
                        />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Only show "Add Field" button if no schema */}
          {!schema && (
            <Button
              onClick={addPair}
              variant="outline"
              size="sm"
              className="w-full border-primary/15 text-xs"
            >
              <Icon type="plus-icon" size="xs" />
              <span className="uppercase">Add Field</span>
            </Button>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
            className="border-primary/15 text-xs uppercase"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-primary text-xs uppercase text-background hover:bg-primary/80"
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
