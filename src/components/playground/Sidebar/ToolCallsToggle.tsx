"use client"

import { memo } from "react"
import { Switch } from "@/components/ui/switch"
import Icon from "@/components/ui/icon"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip/tooltip"
import { usePlaygroundStore } from "@/store"

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
        <Icon type="hammer" size="xs" aria-hidden="true" />
        <span className="text-xs font-medium uppercase">
          Show Tool Calls
        </span>
      </div>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Switch
              checked={showToolCalls}
              onCheckedChange={handleToggleChange}
              className={`${!showToolCalls ? "bg-black" : "bg-primary"} transition-colors`}
              aria-label="Toggle tool calls visibility"
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{showToolCalls ? "Hide" : "Show"} tool calls in chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
})

ToolCallsToggle.displayName = "ToolCallsToggle"

export default ToolCallsToggle