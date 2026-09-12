import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  AgentDetails,
  SessionEntry,
  TeamDetails,
  type ChatMessage,
  type ToolExecution,
  type UserInputField
} from '@/types/os'

interface Store {
  hydrated: boolean
  setHydrated: () => void
  streamingErrorMessage: string
  setStreamingErrorMessage: (streamingErrorMessage: string) => void
  endpoints: {
    endpoint: string
    id__endpoint: string
  }[]
  setEndpoints: (
    endpoints: {
      endpoint: string
      id__endpoint: string
    }[]
  ) => void
  isStreaming: boolean
  setIsStreaming: (isStreaming: boolean) => void
  isEndpointActive: boolean
  setIsEndpointActive: (isActive: boolean) => void
  isEndpointLoading: boolean
  setIsEndpointLoading: (isLoading: boolean) => void
  messages: ChatMessage[]
  setMessages: (
    messages: ChatMessage[] | ((prevMessages: ChatMessage[]) => ChatMessage[])
  ) => void
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>
  selectedEndpoint: string
  setSelectedEndpoint: (selectedEndpoint: string) => void
  authToken: string
  setAuthToken: (authToken: string) => void
  agents: AgentDetails[]
  setAgents: (agents: AgentDetails[]) => void
  teams: TeamDetails[]
  setTeams: (teams: TeamDetails[]) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  mode: 'agent' | 'team'
  setMode: (mode: 'agent' | 'team') => void
  sessionsData: SessionEntry[] | null
  setSessionsData: (
    sessionsData:
      | SessionEntry[]
      | ((prevSessions: SessionEntry[] | null) => SessionEntry[] | null)
  ) => void
  isSessionsLoading: boolean
  setIsSessionsLoading: (isSessionsLoading: boolean) => void

  // User input pause state
  isPausedForInput: boolean
  setIsPausedForInput: (paused: boolean) => void
  pendingUserInputFields: UserInputField[]
  setPendingUserInputFields: (fields: UserInputField[]) => void
  pausedRunId: string | null
  setPausedRunId: (runId: string | null) => void
  pausedSessionId: string | null
  setPausedSessionId: (sessionId: string | null) => void
  pausedToolName: string | null
  setPausedToolName: (name: string | null) => void
  pausedToolCallId: string | null
  setPausedToolCallId: (id: string | null) => void
  pausedToolExecution: ToolExecution | null
  setPausedToolExecution: (toolExecution: ToolExecution | null) => void

  // User confirmation pause state
  isPausedForConfirmation: boolean
  setIsPausedForConfirmation: (paused: boolean) => void
  pendingConfirmationToolName: string | null
  setPendingConfirmationToolName: (name: string | null) => void
  pendingConfirmationToolArgs: Record<string, string>
  setPendingConfirmationToolArgs: (args: Record<string, string>) => void
  pendingConfirmationToolCallId: string | null
  setPendingConfirmationToolCallId: (id: string | null) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
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
      authToken: '',
      setAuthToken: (authToken) => set(() => ({ authToken })),
      agents: [],
      setAgents: (agents) => set({ agents }),
      teams: [],
      setTeams: (teams) => set({ teams }),
      selectedModel: '',
      setSelectedModel: (selectedModel) => set(() => ({ selectedModel })),
      mode: 'agent',
      setMode: (mode) => set(() => ({ mode })),
      sessionsData: null,
      setSessionsData: (sessionsData) =>
        set((state) => ({
          sessionsData:
            typeof sessionsData === 'function'
              ? sessionsData(state.sessionsData)
              : sessionsData
        })),
      isSessionsLoading: false,
      setIsSessionsLoading: (isSessionsLoading) =>
        set(() => ({ isSessionsLoading })),

      isPausedForInput: false,
      setIsPausedForInput: (isPausedForInput) =>
        set(() => ({ isPausedForInput })),
      pendingUserInputFields: [],
      setPendingUserInputFields: (pendingUserInputFields) =>
        set(() => ({ pendingUserInputFields })),
      pausedRunId: null,
      setPausedRunId: (pausedRunId) => set(() => ({ pausedRunId })),
      pausedSessionId: null,
      setPausedSessionId: (pausedSessionId) =>
        set(() => ({ pausedSessionId })),
      pausedToolName: null,
      setPausedToolName: (pausedToolName) =>
        set(() => ({ pausedToolName })),
      pausedToolCallId: null,
      setPausedToolCallId: (pausedToolCallId) =>
        set(() => ({ pausedToolCallId })),
      pausedToolExecution: null,
      setPausedToolExecution: (pausedToolExecution) =>
        set(() => ({ pausedToolExecution })),

      isPausedForConfirmation: false,
      setIsPausedForConfirmation: (isPausedForConfirmation) =>
        set(() => ({ isPausedForConfirmation })),
      pendingConfirmationToolName: null,
      setPendingConfirmationToolName: (pendingConfirmationToolName) =>
        set(() => ({ pendingConfirmationToolName })),
      pendingConfirmationToolArgs: {},
      setPendingConfirmationToolArgs: (pendingConfirmationToolArgs) =>
        set(() => ({ pendingConfirmationToolArgs })),
      pendingConfirmationToolCallId: null,
      setPendingConfirmationToolCallId: (pendingConfirmationToolCallId) =>
        set(() => ({ pendingConfirmationToolCallId }))
    }),
    {
      name: 'endpoint-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedEndpoint: state.selectedEndpoint
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.()
      }
    }
  )
)
