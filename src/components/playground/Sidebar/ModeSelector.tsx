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
import useChatActions from '@/hooks/useChatActions'

export function ModeSelector() {
  const {
    mode,
    setMode,
    teams,
    agents,
    setMessages,
    setSelectedModel,
    setHasStorage,
    setSelectedTeamId
  } = usePlaygroundStore()
  const { clearChat } = useChatActions()
  const [, setAgentId] = useQueryState('agent')
  const [, setTeamId] = useQueryState('team')
  const [, setSessionId] = useQueryState('session')

  const hasTeams = teams.length > 0
  const hasAgents = agents.length > 0
  const isDropdownDisabled = !(hasTeams && hasAgents)

  const handleModeChange = (newMode: 'agent' | 'team') => {
    if (newMode === mode) return

    setMode(newMode)

    setAgentId(null)
    setTeamId(null)
    setSelectedTeamId(null)
    setSelectedModel('')
    setHasStorage(false)
    setMessages([])
    setSessionId(null)
    clearChat()
  }

  React.useEffect(() => {
    if (!hasTeams && hasAgents && mode === 'team') {
      setMode('agent')
    } else if (!hasAgents && hasTeams && mode === 'agent') {
      setMode('team')
    }
  }, [hasTeams, hasAgents, mode, setMode])

  if (!hasTeams && !hasAgents) {
    return (
      <Select disabled>
        <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase opacity-50">
          <SelectValue placeholder="No Mode Available" />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={mode}
      onValueChange={(value) => handleModeChange(value as 'agent' | 'team')}
      disabled={isDropdownDisabled}
    >
      <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
        {hasAgents && (
          <SelectItem value="agent" className="cursor-pointer">
            <div className="text-xs font-medium uppercase">Agent</div>
          </SelectItem>
        )}
        {hasTeams && (
          <SelectItem value="team" className="cursor-pointer">
            <div className="text-xs font-medium uppercase">Team</div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
