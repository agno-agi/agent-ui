import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  type PlaygroundChatMessage,
  type SessionEntry
} from '@/types/playground'

interface Agent {
  value: string
  label: string
  model: {
    provider: string
  }
}

interface PlaygroundStore {
  streamingErrorMessage: string
  setStreamingErrorMessage: (streamingErrorMessage: string) => void
  endpoints: {
    endpoint: string
    id_playground_endpoint: string
  }[]
  setEndpoints: (
    endpoints: {
      endpoint: string
      id_playground_endpoint: string
    }[]
  ) => void
  isStreaming: boolean
  setIsStreaming: (isStreaming: boolean) => void
  isEndpointActive: boolean
  setIsEndpointActive: (isActive: boolean) => void
  isEndpointLoading: boolean
  setIsEndpointLoading: (isLoading: boolean) => void
  messages: PlaygroundChatMessage[]
  setMessages: (
    messages:
      | PlaygroundChatMessage[]
      | ((prevMessages: PlaygroundChatMessage[]) => PlaygroundChatMessage[])
  ) => void

  chatInputRef: React.RefObject<HTMLTextAreaElement | null>
  selectedEndpoint: string
  setSelectedEndpoint: (selectedEndpoint: string) => void

  agents: Agent[]
  setAgents: (agents: Agent[]) => void

  selectedModel: string
  setSelectedModel: (model: string) => void
  historyData: SessionEntry[] | null
  setHistoryData: (
    historyData:
      | SessionEntry[]
      | ((prevHistory: SessionEntry[] | null) => SessionEntry[] | null)
  ) => void
}

export const usePlaygroundStore = create<PlaygroundStore>()(
  persist(
    (set) => ({
      streamingErrorMessage: '',
      setStreamingErrorMessage: (streamingErrorMessage) =>
        set(() => ({ streamingErrorMessage })),
      endpoints: [],
      setEndpoints: (endpoints) => set(() => ({ endpoints })),
      isStreaming: false,
      setIsStreaming: (isStreaming) => set(() => ({ isStreaming })),
      isEndpointActive: false,
      setIsEndpointActive: (isActive) =>
        set(() => ({ isEndpointActive: isActive })),
      isEndpointLoading: true,
      setIsEndpointLoading: (isLoading) =>
        set(() => ({ isEndpointLoading: isLoading })),
      messages: [],
      setMessages: (messages) =>
        set((state) => ({
          messages:
            typeof messages === 'function' ? messages(state.messages) : messages
        })),

      chatInputRef: { current: null },
      selectedEndpoint: 'http://localhost:7777',
      setSelectedEndpoint: (selectedEndpoint) =>
        set(() => ({ selectedEndpoint })),

      agents: [],
      setAgents: (agents) => set({ agents }),
      historyData: null,
      setHistoryData: (historyData) =>
        set((state) => ({
          historyData:
            typeof historyData === 'function'
              ? historyData(state.historyData)
              : historyData
        })),

      selectedModel: '',
      setSelectedModel: (selectedModel) => set(() => ({ selectedModel }))
    }),
    {
      name: 'endpoint-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedEndpoint: state.selectedEndpoint
      })
    }
  )
)
