import { Switch } from "@/components/ui/switch"
import { usePlaygroundStore } from "@/store"
import Icon from "@/components/ui/icon"
import Tooltip from "@/components/ui/tooltip"
import { memo } from 'react'

const ToolCallsToggle = memo(() => {
  const showToolCalls = usePlaygroundStore((state) => state.showToolCalls)
  const setShowToolCalls = usePlaygroundStore((state) => state.setShowToolCalls)

  const handleToggleChange = (checked: boolean) => {
    setShowToolCalls(checked)
  }

  return (
    <div 
      className="flex w-full items-center justify-between rounded-xl border border-primary/15 bg-accent p-3"
      data-testid="tool-calls-toggle"
    >
      <div className="flex items-center gap-2">
        <Icon 
          type="hammer" 
          size="xs" 
          aria-hidden="true"
        />
        <span className="text-xs font-medium uppercase text-muted">
          Show Tool Calls
        </span>
      </div>
      <Tooltip
        delayDuration={0}
        content={
          <p className="text-xs">
            {showToolCalls ? "Hide" : "Show"} tool calls in chat
          </p>
        }
      >
        <Switch
          checked={showToolCalls}
          onCheckedChange={handleToggleChange}
          className="data-[state=checked]:bg-primary"
          aria-label="Toggle tool calls visibility"
        />
      </Tooltip>
    </div>
  )
})

ToolCallsToggle.displayName = 'ToolCallsToggle'

export default ToolCallsToggle