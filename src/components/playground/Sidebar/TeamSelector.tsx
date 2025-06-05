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

export function TeamSelector() {
  const {
    teams,
    setMessages,
    setSelectedModel,
    setHasStorage,
    setSelectedTeamId,
    setSelectedEntityType
  } = usePlaygroundStore()
  const { focusChatInput } = useChatActions()
  const [teamId, setTeamId] = useQueryState('team', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [, setSessionId] = useQueryState('session')
  const [, setAgentId] = useQueryState('agent')

  useEffect(() => {
    if (teamId && teams.length > 0) {
      const team = teams.find((t) => t.value === teamId)
      if (team) {
        setSelectedModel(team.model.provider || '')
        setHasStorage(!!team.storage)
        setSelectedTeamId(team.value)
        setSelectedEntityType('team')
        if (team.model.provider) {
          focusChatInput()
        }
      } else {
        setTeamId(teams[0].value) // Default to first team if selected one not found
      }
    } else if (teams.length > 0 && !teamId) {
      // Optionally select the first team if none is selected in the URL
      // setTeamId(teams[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teams, setSelectedModel])

  const handleOnValueChange = (value: string) => {
    const newTeam = value === teamId ? null : value
    const selectedTeam = teams.find((team) => team.value === newTeam)

    setSelectedModel(selectedTeam?.model.provider || '')
    setHasStorage(!!selectedTeam?.storage)
    setSelectedTeamId(newTeam)
    setSelectedEntityType(newTeam ? 'team' : null)
    setTeamId(newTeam)
    setAgentId(null) // Clear agent selection
    setMessages([])
    setSessionId(null)

    if (selectedTeam?.model.provider) {
      focusChatInput()
    }
  }

  return (
    <Select
      value={teamId || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase">
        <SelectValue placeholder="Select Team" />
      </SelectTrigger>
      <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
        {teams.map((team, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${team.value}-${index}`}
            value={team.value}
          >
            <div className="flex items-center gap-3 text-xs font-medium uppercase">
              <Icon type={'user'} size="xs" />
              {team.label}
            </div>
          </SelectItem>
        ))}
        {/* No need for a 'no teams found' message here as this component only renders if teams exist */}
      </SelectContent>
    </Select>
  )
} 