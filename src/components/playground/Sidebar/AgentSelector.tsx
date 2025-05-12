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
  const { agents, setMessages, setSelectedModel, setHasStorage } =
    usePlaygroundStore()
  const { focusChatInput } = useChatActions()
  const [agentId, setAgentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [, setSessionId] = useQueryState('session')

  // Set the model when the component mounts if an agent is already selected
  useEffect(() => {
    if (agentId && agents.length > 0) {
      const agent = agents.find((agent) => agent.value === agentId)
      if (agent) {
        setSelectedModel(agent.model.provider || '')
        setHasStorage(!!agent.storage)
        if (agent.model.provider) {
          focusChatInput()
        }
      } else {
        setAgentId(agents[0].value)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, agents, setSelectedModel])

  const handleOnValueChange = (value: string) => {
    const newAgent = value === agentId ? '' : value
    const selectedAgent = agents.find((agent) => agent.value === newAgent)
    setSelectedModel(selectedAgent?.model.provider || '')
    setHasStorage(!!selectedAgent?.storage)
    setAgentId(newAgent)
    setMessages([])
    setSessionId(null)
    if (selectedAgent?.model.provider) {
      focusChatInput()
    }
  }

  return (
    <>
    </>
  )
}
