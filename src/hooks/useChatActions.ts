import { useCallback } from 'react'
import { toast } from 'sonner'

import { usePlaygroundStore } from '../store'

import {
  ComboboxAgent,
  ComboboxTeam,
  type PlaygroundChatMessage
} from '@/types/playground'
import {
  getPlaygroundAgentsAPI,
  getPlaygroundStatusAPI,
  getPlaygroundTeamsAPI
} from '@/api/playground'
import { useQueryState } from 'nuqs'

const useChatActions = () => {
  const { chatInputRef } = usePlaygroundStore()
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const [, setSessionId] = useQueryState('session')
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const setIsEndpointActive = usePlaygroundStore(
    (state) => state.setIsEndpointActive
  )
  const setIsEndpointLoading = usePlaygroundStore(
    (state) => state.setIsEndpointLoading
  )
  const setAgents = usePlaygroundStore((state) => state.setAgents)
  const setTeams = usePlaygroundStore((state) => state.setTeams)
  const setSelectedModel = usePlaygroundStore((state) => state.setSelectedModel)
  const setHasStorage = usePlaygroundStore((state) => state.setHasStorage)
  const setSelectedTeamId = usePlaygroundStore(
    (state) => state.setSelectedTeamId
  )
  const setSelectedEntityType = usePlaygroundStore(
    (state) => state.setSelectedEntityType
  )
  const setMode = usePlaygroundStore((state) => state.setMode)
  const [agentId, setAgentId] = useQueryState('agent')
  const [teamId, setTeamId] = useQueryState('team')

  const getStatus = useCallback(async () => {
    try {
      const status = await getPlaygroundStatusAPI(selectedEndpoint)
      return status
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async () => {
    try {
      const agents = await getPlaygroundAgentsAPI(selectedEndpoint)
      return agents
    } catch {
      toast.error('Error fetching agents')
      return []
    }
  }, [selectedEndpoint])

  const getTeams = useCallback(async () => {
    try {
      const teams = await getPlaygroundTeamsAPI(selectedEndpoint)
      return teams
    } catch {
      toast.error('Error fetching teams')
      return []
    }
  }, [selectedEndpoint])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addMessage = useCallback(
    (message: PlaygroundChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message])
    },
    [setMessages]
  )

  const initializePlayground = useCallback(async () => {
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: ComboboxAgent[] = []
      let teams: ComboboxTeam[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        teams = await getTeams()
        agents = await getAgents()

        if (!agentId && !teamId) {
          const currentMode = usePlaygroundStore.getState().mode

          if (currentMode === 'team' && teams.length > 0) {
            const firstTeam = teams[0]
            setTeamId(firstTeam.value)
            setSelectedTeamId(firstTeam.value)
            setSelectedModel(firstTeam.model.provider || '')
            setHasStorage(!!firstTeam.storage)
            setSelectedEntityType('team')
          } else if (currentMode === 'agent' && agents.length > 0) {
            const firstAgent = agents[0]
            setAgentId(firstAgent.value)
            setSelectedModel(firstAgent.model.provider || '')
            setHasStorage(!!firstAgent.storage)
            setSelectedTeamId(null)
            setSelectedEntityType('agent')
          } else {
            if (teams.length > 0 && agents.length === 0) {
              setMode('team')
              const firstTeam = teams[0]
              setTeamId(firstTeam.value)
              setSelectedTeamId(firstTeam.value)
              setSelectedModel(firstTeam.model.provider || '')
              setHasStorage(!!firstTeam.storage)
              setSelectedEntityType('team')
            } else if (agents.length > 0 && teams.length === 0) {
              setMode('agent')
              const firstAgent = agents[0]
              setAgentId(firstAgent.value)
              setSelectedModel(firstAgent.model.provider || '')
              setHasStorage(!!firstAgent.storage)
              setSelectedTeamId(null)
              setSelectedEntityType('agent')
            } else if (teams.length > 0 || agents.length > 0) {
              setMode('team')
            }
          }
        }
      } else {
        setIsEndpointActive(false)
        setMode('agent')
        setSelectedModel('')
        setHasStorage(false)
        setSelectedTeamId(null)
        setSelectedEntityType(null)
        setAgentId(null)
        setTeamId(null)
      }
      setAgents(agents)
      setTeams(teams)
      return { agents, teams }
    } catch (error) {
      console.error('Error initializing playground:', error)
      setIsEndpointActive(false)
      setMode('agent')
      setSelectedModel('')
      setHasStorage(false)
      setSelectedTeamId(null)
      setSelectedEntityType(null)
      setAgentId(null)
      setTeamId(null)
      setAgents([])
      setTeams([])
    } finally {
      setIsEndpointLoading(false)
    }
  }, [
    getStatus,
    getAgents,
    getTeams,
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    setTeams,
    setAgentId,
    setSelectedModel,
    setHasStorage,
    setSelectedTeamId,
    setSelectedEntityType,
    setMode,
    setTeamId,
    agentId,
    teamId
  ])

  return {
    clearChat,
    addMessage,
    getAgents,
    focusChatInput,
    getTeams,
    initializePlayground
  }
}

export default useChatActions
