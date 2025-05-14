import { useCallback } from 'react'
import {
  getPlaygroundSessionAPI,
  getAllPlaygroundSessionsAPI,
  getAllPlaygroundTeamSessionsAPI,
  getPlaygroundTeamSessionAPI,
  getAllPlaygroundWorkflowSessionsAPI,
  getPlaygroundWorkflowSessionAPI,
  getWorkflowSessionStateAPI
} from '@/api/playground'
import { PlaygroundStore, usePlaygroundStore } from '../store'
import { toast } from 'sonner'
import {
  PlaygroundChatMessage,
  ToolCall,
  ReasoningMessage,
  ChatEntry
} from '@/types/playground'
import { getJsonMarkdown } from '@/lib/utils'

interface SessionResponse {
  session_id: string
  agent_id?: string
  workflow_id?: string
  user_id: string | null
  runs?: ChatEntry[]
  memory: {
    runs?: ChatEntry[]
    chats?: ChatEntry[]
  }
  agent_data?: Record<string, unknown>
  workflow_data?: Record<string, unknown>
}

const useSessionLoader = () => {
  const setMessages = usePlaygroundStore(
    (state: PlaygroundStore) => state.setMessages
  )
  const selectedEndpoint = usePlaygroundStore(
    (state: PlaygroundStore) => state.selectedEndpoint
  )
  const setIsSessionsLoading = usePlaygroundStore(
    (state: PlaygroundStore) => state.setIsSessionsLoading
  )
  const setSessionsData = usePlaygroundStore(
    (state: PlaygroundStore) => state.setSessionsData
  )
  const setWorkflowSessionState = usePlaygroundStore(
    (state: PlaygroundStore) => state.setWorkflowSessionState
  )

  const getSessions = useCallback(
    async (
      agentId: string | null,
      teamId?: string | null,
      workflowId?: string | null
    ) => {
      if (!selectedEndpoint || (!agentId && !teamId && !workflowId)) {
        setSessionsData([])
        return
      }
      try {
        setIsSessionsLoading(true)
        let sessions
        if (workflowId) {
          // For workflows, we don't pass a user_id parameter
          sessions = await getAllPlaygroundWorkflowSessionsAPI(
            selectedEndpoint,
            workflowId
          )
        } else if (teamId) {
          sessions = await getAllPlaygroundTeamSessionsAPI(
            selectedEndpoint,
            teamId
          )
        } else if (agentId) {
          sessions = await getAllPlaygroundSessionsAPI(
            selectedEndpoint,
            agentId
          )
        }
        setSessionsData(sessions || [])
      } catch {
        toast.error('Error loading sessions')
        setSessionsData([]) // Clear on error
      } finally {
        setIsSessionsLoading(false)
      }
    },
    [selectedEndpoint, setSessionsData, setIsSessionsLoading]
  )

  const getSession = useCallback(
    async (
      sessionId: string,
      agentId: string | null,
      teamId?: string | null,
      workflowId?: string | null
    ) => {
      console.log('🔍 getSession called with:', {
        sessionId,
        agentId,
        teamId,
        workflowId
      })

      if (
        !sessionId ||
        (!agentId && !teamId && !workflowId) ||
        !selectedEndpoint
      ) {
        console.log('⚠️ Missing required parameters for getSession')
        return null
      }

      // Check if this is a newly created session by comparing current messages
      const currentMessages = usePlaygroundStore.getState().messages
      const isNewSession =
        currentMessages.length > 0 &&
        currentMessages[currentMessages.length - 1].session_id === sessionId

      if (isNewSession) {
        console.log(
          '🆕 Detected newly created session with existing messages, skipping load'
        )
        return currentMessages
      }

      try {
        console.log('📥 Fetching session from API:', sessionId)
        let response: SessionResponse | null = null
        if (workflowId) {
          // For workflows, we don't pass a user_id parameter
          console.log('🔄 Fetching workflow session')
          response = (await getPlaygroundWorkflowSessionAPI(
            selectedEndpoint,
            workflowId,
            sessionId
          )) as SessionResponse

          // Also fetch the workflow session state
          console.log('🔄 Fetching workflow session state')
          try {
            const stateResponse = await getWorkflowSessionStateAPI(
              selectedEndpoint,
              workflowId,
              sessionId
            )
            console.log('📦 Workflow session state:', stateResponse)
            setWorkflowSessionState(stateResponse)
          } catch (error) {
            console.error('Error fetching workflow session state:', error)
            setWorkflowSessionState(null)
          }
        } else if (teamId) {
          console.log('👥 Fetching team session')
          response = (await getPlaygroundTeamSessionAPI(
            selectedEndpoint,
            teamId,
            sessionId
          )) as SessionResponse
        } else if (agentId) {
          console.log('🤖 Fetching agent session')
          response = (await getPlaygroundSessionAPI(
            selectedEndpoint,
            agentId,
            sessionId
          )) as SessionResponse
        }
        console.log('📦 Session API response:', response)

        if (response && response.memory) {
          const sessionHistory = response.runs
            ? response.runs
            : response.memory.runs

          if (sessionHistory && Array.isArray(sessionHistory)) {
            const messagesForPlayground = sessionHistory.flatMap((run) => {
              const filteredMessages: PlaygroundChatMessage[] = []

              // Handle workflow run format (direct properties)
              if (workflowId && 'event' in run && run.event === 'RunResponse') {
                filteredMessages.push({
                  role: 'agent',
                  content:
                    'content' in run ? ((run.content as string) ?? '') : '',
                  created_at:
                    'created_at' in run
                      ? (run.created_at as number)
                      : Math.floor(Date.now() / 1000),
                  run_id:
                    'run_id' in run
                      ? (run.run_id as string)
                      : String(
                          'created_at' in run ? run.created_at : Date.now()
                        ),
                  session_id: sessionId
                })
              } else if (
                workflowId &&
                'event' in run &&
                run.event === 'UserMessage'
              ) {
                filteredMessages.push({
                  role: 'user',
                  content:
                    'content' in run ? ((run.content as string) ?? '') : '',
                  created_at:
                    'created_at' in run
                      ? (run.created_at as number)
                      : Math.floor(Date.now() / 1000),
                  run_id:
                    'run_id' in run
                      ? (run.run_id as string)
                      : String(
                          'created_at' in run ? run.created_at : Date.now()
                        ),
                  session_id: sessionId
                })
              }
              // Handle standard agent/team format
              else {
                if (run.message) {
                  filteredMessages.push({
                    role: 'user',
                    content: run.message.content ?? '',
                    created_at: run.message.created_at,
                    run_id:
                      run.response?.run_id || String(run.message.created_at),
                    session_id: sessionId
                  })
                }

                if (run.response) {
                  const toolCalls = [
                    ...(run.response.tools ?? []),
                    ...(
                      run.response.extra_data?.reasoning_messages ?? []
                    ).reduce((acc: ToolCall[], msg: ReasoningMessage) => {
                      if (msg.role === 'tool') {
                        acc.push({
                          role: msg.role,
                          content: msg.content,
                          tool_call_id: msg.tool_call_id ?? '',
                          tool_name: msg.tool_name ?? '',
                          tool_args: msg.tool_args ?? {},
                          tool_call_error: msg.tool_call_error ?? false,
                          metrics: msg.metrics ?? { time: 0 },
                          created_at:
                            msg.created_at ?? Math.floor(Date.now() / 1000)
                        })
                      }
                      return acc
                    }, [])
                  ]

                  filteredMessages.push({
                    role: 'agent',
                    content: (run.response.content as string) ?? '',
                    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
                    extra_data: run.response.extra_data,
                    images: run.response.images,
                    videos: run.response.videos,
                    audio: run.response.audio,
                    response_audio: run.response.response_audio,
                    created_at: run.response.created_at,
                    run_id:
                      run.response.run_id || String(run.response.created_at),
                    session_id: sessionId
                  })
                }
              }
              return filteredMessages
            })

            const processedMessages = messagesForPlayground.map(
              (message: PlaygroundChatMessage) => {
                if (Array.isArray(message.content)) {
                  const textContent = message.content
                    .filter((item: { type: string }) => item.type === 'text')
                    .map((item) => item.text)
                    .join(' ')

                  return {
                    ...message,
                    content: textContent
                  }
                }
                if (typeof message.content !== 'string') {
                  return {
                    ...message,
                    content: getJsonMarkdown(message.content)
                  }
                }
                return message
              }
            )

            setMessages(processedMessages)
            return processedMessages
          }
        }
      } catch {
        return null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedEndpoint, setMessages]
  )

  return { getSession, getSessions }
}

export default useSessionLoader
