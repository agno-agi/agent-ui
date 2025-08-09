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

export function EntitySelector() {
  const {
    mode,
    agents,
    teams,
    setMessages,
    setSelectedModel,
    setHasStorage,
    setSelectedTeamId,
    setSelectedEntityType
  } = usePlaygroundStore()
  const { focusChatInput } = useChatActions()
  const [agentId, setAgentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [teamId, setTeamId] = useQueryState('team', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [, setSessionId] = useQueryState('session')

  const currentEntities = mode === 'team' ? teams : agents
  const currentValue = mode === 'team' ? teamId : agentId
  const placeholder = mode === 'team' ? 'Select Team' : 'Select Agent'

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentEntities.length > 0 && !currentValue) {
        const firstEntity = currentEntities[0]

        if (mode === 'team') {
          setTeamId(firstEntity.value)
          setSelectedTeamId(firstEntity.value)
        } else {
          setAgentId(firstEntity.value)
        }
        setSelectedModel(firstEntity.model.provider || '')
        setHasStorage(!!firstEntity.storage)
        setSelectedEntityType(mode)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [
    mode,
    currentEntities,
    currentValue,
    setAgentId,
    setTeamId,
    setSelectedTeamId,
    setSelectedModel,
    setHasStorage,
    setSelectedEntityType
  ])

  useEffect(() => {
    if (currentValue && currentEntities.length > 0) {
      const entity = currentEntities.find((item) => item.value === currentValue)
      if (entity) {
        setSelectedModel(entity.model.provider || '')
        setHasStorage(!!entity.storage)
        setSelectedEntityType(mode)
        if (mode === 'team') {
          setSelectedTeamId(entity.value)
        }
        if (entity.model.provider) {
          focusChatInput()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, currentEntities, setSelectedModel, mode])

  const handleOnValueChange = (value: string) => {
    const newValue = value === currentValue ? null : value
    const selectedEntity = currentEntities.find(
      (item) => item.value === newValue
    )

    setSelectedModel(selectedEntity?.model.provider || '')
    setHasStorage(!!selectedEntity?.storage)
    setSelectedEntityType(newValue ? mode : null)

    if (mode === 'team') {
      setSelectedTeamId(newValue)
      setTeamId(newValue)
      setAgentId(null)
    } else {
      setSelectedTeamId(null)
      setAgentId(newValue)
      setTeamId(null)
    }

    setMessages([])
    setSessionId(null)

    if (selectedEntity?.model.provider) {
      focusChatInput()
    }
  }

  if (currentEntities.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="border-primary/15 bg-primaryAccent h-9 w-full rounded-xl border text-xs font-medium uppercase opacity-50">
          <SelectValue placeholder={`No ${mode}s Available`} />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={currentValue || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="border-primary/15 bg-primaryAccent h-9 w-full rounded-xl border text-xs font-medium uppercase">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-primaryAccent font-dmmono border-none shadow-lg">
        {currentEntities.map((entity, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${entity.value}-${index}`}
            value={entity.value}
          >
            <div className="flex items-center gap-3 text-xs font-medium uppercase">
              <Icon type={'user'} size="xs" />
              {entity.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
