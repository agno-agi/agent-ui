'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const ReasoningPanelContent = ({ onClose }: { onClose: () => void }) => {
  const selectedReasoning = useStore((state) => state.selectedReasoning)

  if (!selectedReasoning) {
    return null
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase text-secondary">
            Agent Reasoning
          </p>
          {!selectedReasoning.isComplete && (
            <span className="text-xs text-secondary/70">
              Reasoning still streaming
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {selectedReasoning.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedReasoning.badges.map((badge, index) => (
            <span
              key={`${badge}-${index}`}
              className="rounded-full bg-background px-3 py-1 text-xs text-secondary"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto rounded-md bg-background p-4 text-sm text-secondary shadow-inner">
        <pre className="whitespace-pre-wrap font-sans">
          {selectedReasoning.reasoning}
        </pre>
      </div>
    </div>
  )
}

const ReasoningViewer = () => {
  const selectedReasoning = useStore((state) => state.selectedReasoning)
  const clearSelectedReasoning = useStore((state) => state.clearSelectedReasoning)

  return (
    <>
      <aside
        className={cn(
          'hidden h-full flex-col border-l border-border bg-background-secondary transition-[width,opacity] duration-300 ease-in-out lg:flex',
          selectedReasoning ? 'w-[360px] opacity-100' : 'w-0 opacity-0'
        )}
      >
        <div
          className={cn(
            'h-full overflow-hidden',
            selectedReasoning ? 'px-6 py-6' : 'px-0 py-0'
          )}
        >
          <ReasoningPanelContent onClose={clearSelectedReasoning} />
        </div>
      </aside>
      <div
        className={cn(
          'fixed inset-0 z-50 flex h-full w-full flex-col bg-background/95 px-6 py-6 transition-opacity duration-200 lg:hidden',
          selectedReasoning ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <ReasoningPanelContent onClose={clearSelectedReasoning} />
      </div>
    </>
  )
}

export default ReasoningViewer
