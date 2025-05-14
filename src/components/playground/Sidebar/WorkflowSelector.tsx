'use client'

import * as React from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import { useEffect } from 'react'
import useChatActions from '@/hooks/useChatActions'

export function WorkflowSelector() {
  const { workflows, setMessages, setHasStorage } = usePlaygroundStore()
  const { focusChatInput } = useChatActions()
  const [workflowId, setWorkflowId] = useQueryState('workflow', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [, setSessionId] = useQueryState('session')
  const [, setTeamId] = useQueryState('team')
  const [, setAgentId] = useQueryState('agent')

  // Set storage flag when the component mounts if a workflow is already selected
  useEffect(() => {
    if (workflowId && workflows.length > 0) {
      const workflow = workflows.find(
        (workflow) => workflow.value === workflowId
      )
      if (workflow) {
        // Force storage to true for workflows to enable session loading
        setHasStorage(true)
        focusChatInput()
      } else {
        setWorkflowId(workflows[0].value)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, workflows, setHasStorage])

  const handleOnValueChange = (value: string) => {
    // If clicking the already selected workflow, clear it
    const newWorkflow = value === workflowId ? null : value

    if (newWorkflow) {
      // Force storage to true for workflows to enable session loading
      setHasStorage(true)
      setWorkflowId(newWorkflow)
      setTeamId(null)
      setAgentId(null)
      setMessages([])
      setSessionId(null)

      focusChatInput()
    } else {
      // Just clearing the workflow
      setWorkflowId(null)
      setMessages([])
      setSessionId(null)
    }
  }

  return (
    <Select
      value={workflowId || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="border-primary/15 bg-primaryAccent h-9 w-full rounded-xl border text-xs font-medium uppercase">
        <SelectValue placeholder="Select Workflow" />
      </SelectTrigger>
      <SelectContent className="bg-primaryAccent font-dmmono border-none shadow-lg">
        {workflows.map((workflow, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${workflow.value}-${index}`}
            value={workflow.value}
          >
            <div className="flex items-center gap-3 text-xs font-medium uppercase">
              <Icon type="reasoning" size="xs" />
              {workflow.label}
            </div>
          </SelectItem>
        ))}
        {workflows.length === 0 && (
          <div className="text-muted-foreground cursor-not-allowed select-none px-2 py-1.5 text-center text-xs">
            No workflows found
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
