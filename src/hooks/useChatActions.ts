import { useCallback } from 'react'
import { toast } from 'sonner'

import { usePlaygroundStore } from '../store'

import { ComboboxAgent, type PlaygroundChatMessage } from '@/types/playground'
import {
  getPlaygroundAgentsAPI,
  getPlaygroundStatusAPI
} from '@/api/playground'
import { useQueryState } from 'nuqs'
import { getAllPlaygroundSessionsAPI } from '@/api/playground'

const useChatActions = () => {
  const { chatInputRef } = usePlaygroundStore()
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setSelectedModel = usePlaygroundStore((state) => state.setSelectedModel)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const setIsEndpointActive = usePlaygroundStore(
    (state) => state.setIsEndpointActive
  )
  const setIsEndpointLoading = usePlaygroundStore(
    (state) => state.setIsEndpointLoading
  )
  const setAgents = usePlaygroundStore((state) => state.setAgents)
  const setHistoryData = usePlaygroundStore((state) => state.setHistoryData)
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

  const resetData = useCallback(({ agent }: { agent: ComboboxAgent }) => {
    if (!agent) setSelectedModel('')
    setAgentId(agent?.value ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadHistory = useCallback(
    async (agentId: string) => {
      if (!agentId || !selectedEndpoint) return
      const history = await getAllPlaygroundSessionsAPI(
        selectedEndpoint,
        agentId
      )
      setHistoryData(history)
    },
    [selectedEndpoint, setHistoryData]
  )

  const loadData = useCallback(async () => {
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: ComboboxAgent[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        agents = await getAgents()
      } else {
        setIsEndpointActive(false)
      }
      resetData({ agent: agents?.[0] })
      setAgents(agents)
      return agents
    } finally {
      setIsEndpointLoading(false)
    }
  }, [
    getStatus,
    getAgents,
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    resetData
  ])

  return {
    clearChat,
    addMessage,
    getAgents,
    focusChatInput,
    loadData,
    loadHistory
  }
}

export default useChatActions
