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

export function AgentSelector() {
  const { agents, setMessages, setSelectedModel } = usePlaygroundStore()
  const { focusChatInput } = useChatActions()
  const [agentId, setAgentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })

  // Set the model when the component mounts if an agent is already selected
  useEffect(() => {
    if (agentId && agents.length > 0) {
      const agent = agents.find((agent) => agent.value === agentId)
      if (agent) {
        setSelectedModel(agent.model.provider || '')
        if (agent.model.provider) {
          focusChatInput()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, agents, setSelectedModel])

  const handleOnValueChange = (value: string) => {
    const newAgent = value === agentId ? '' : value
    setSelectedModel(
      agents.find((agent) => agent.value === newAgent)?.model.provider || ''
    )
    setAgentId(newAgent)
    setMessages([])
    if (agents.find((agent) => agent.value === newAgent)?.model.provider) {
      focusChatInput()
    }
  }

  return (
    <Select
      value={agentId || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase">
        <SelectValue placeholder="Select Agent" />
      </SelectTrigger>
      <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
        {agents.map((agent, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${agent.value}-${index}`}
            value={agent.value}
          >
            <div className="flex items-center gap-3 text-xs font-medium uppercase">
              <Icon type={'agent'} size="xs" />
              {agent.label}
            </div>
          </SelectItem>
        ))}
        {agents.length === 0 && (
          <SelectItem
            value="no-agents"
            className="cursor-not-allowed select-none text-center"
          >
            No agents found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
