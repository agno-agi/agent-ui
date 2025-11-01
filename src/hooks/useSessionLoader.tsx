import { useCallback } from 'react'
import { getSessionAPI, getAllSessionsAPI } from '@/api/os'
import { useStore } from '../store'
import { toast } from 'sonner'
import { ChatMessage, ToolCall, ReasoningMessage, ChatEntry } from '@/types/os'
import { getJsonMarkdown } from '@/lib/utils'

interface SessionResponse {
  session_id: string
  agent_id: string
  user_id: string | null
  runs?: ChatEntry[]
  memory: {
    runs?: ChatEntry[]
    chats?: ChatEntry[]
  }
  agent_data: Record<string, unknown>
}

interface LoaderArgs {
  entityType: 'agent' | 'team' | null
  agentId?: string | null
  teamId?: string | null
  dbId: string | null
}

const useSessionLoader = () => {
  const setMessages = useStore((state) => state.setMessages)
  const selectedEndpoint = useStore((state) => state.selectedEndpoint)
  const authToken = useStore((state) => state.authToken)
  const setIsSessionsLoading = useStore((state) => state.setIsSessionsLoading)
  const setSessionsData = useStore((state) => state.setSessionsData)
  const agents = useStore((state) => state.agents)

  const getSessions = useCallback(
    async ({ entityType, agentId, teamId, dbId }: LoaderArgs) => {
      const selectedId = entityType === 'agent' ? agentId : teamId
      const userId = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('user_id')
        : null
      // When user_id is present, dbId is optional for playground endpoints
      if (!selectedEndpoint || !entityType || !selectedId || (!userId && !dbId)) return

      try {
        setIsSessionsLoading(true)

        const sessions = await getAllSessionsAPI(
          selectedEndpoint,
          entityType,
          selectedId,
          dbId || '',
          authToken
        )
        
        // Only update if we got valid data
        if (sessions && sessions.data !== undefined) {
          setSessionsData(sessions.data)
        } else {
          console.warn('Invalid sessions response:', sessions)
          setSessionsData([])
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
        toast.error('Error loading sessions')
        // Don't clear existing sessions on error - might be temporary network issue
      } finally {
        setIsSessionsLoading(false)
      }
    },
    [selectedEndpoint, authToken, setSessionsData, setIsSessionsLoading]
  )

  const getSession = useCallback(
    async (
      { entityType, agentId, teamId, dbId }: LoaderArgs,
      sessionId: string,
      options?: { suppressErrors?: boolean }
    ) => {
      const suppressErrors = options?.suppressErrors ?? false
      const userId = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('user_id')
        : null
      let selectedId = entityType === 'agent' ? agentId : teamId
      
          // When user_id is present and no agentId is provided, use first available agent
          if (userId && !selectedId && entityType === 'agent' && agents.length > 0) {
            selectedId = agents[0]?.id || (agents[0] as any)?.agent_id
          }
      
      // When user_id is present, dbId is optional for playground endpoints
      // Otherwise, require all parameters
      if (
        !selectedEndpoint ||
        !sessionId ||
            !entityType ||
            (!userId && !selectedId && !dbId)
          ) {
            return
          }

          try {
            // For playground mode, try to fetch with the provided agentId first
        // If that fails with "Agent not found" or "Session not found", try other agent IDs
        let response: SessionResponse | undefined
        let retryWithSessionAgentId = false
        
        // Only try initial fetch if we have an agentId (required for playground)
        if (selectedId || !userId) {
          try {
            response = await getSessionAPI(
              selectedEndpoint,
              entityType,
              sessionId,
              dbId || '',
              authToken,
              selectedId || undefined // Pass agentId/teamId for playground endpoints
            )
          } catch (error) {
            // If we get "Agent not found" or "Session not found" error, try fetching the session with different agents
            // Sessions might have been created with a different agent_id than the current one
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
                  const isNotFoundError = errorMessage.includes('agent not found') || 
                                        errorMessage.includes('session not found') ||
                                        errorMessage.includes('404')
                
                if (isNotFoundError && userId) {
                  retryWithSessionAgentId = true
                  
                  // If we don't have agents loaded, cannot retry
                  if (agents.length === 0) {
                    throw error
                  }
              
              // Try with each available agent until we find the one that works
              // Start with agents different from selectedId, then include selectedId if not already tried
              const agentIdsToTry = agents
                .map(a => a?.id || (a as any)?.agent_id)
                .filter((id): id is string => !!id)
              
                   // Remove duplicates and ensure we try selectedId last (or skip if already in list)
                   const uniqueAgentIds = Array.from(new Set(agentIdsToTry))
                   const selectedIdStr = selectedId || ''
                   const otherAgents = uniqueAgentIds.filter(id => id !== selectedIdStr)
                   const agentsToTry = [...otherAgents]
                   if (selectedIdStr && !otherAgents.includes(selectedIdStr)) {
                     agentsToTry.push(selectedIdStr)
                   }
                     
                   let lastError = error
              for (const tryAgentId of agentsToTry) {
                     if (!tryAgentId) continue
                     
                     try {
                       response = await getSessionAPI(
                         selectedEndpoint,
                         entityType,
                         sessionId,
                         dbId || '',
                         authToken,
                         tryAgentId
                       )
                       // Success! Break out of the loop
                       lastError = null
                       break
                     } catch (retryError) {
                       lastError = retryError as Error
                     }
              }
              
              // If we still don't have a response after trying all agents, throw the error
              if (!response || lastError) {
                // Only log error if not suppressed (don't log 404s on initial load)
                if (!suppressErrors) {
                  console.error('Failed to fetch session with all available agents. Last error:', lastError)
                }
                throw lastError || error
              }
            } else {
              throw error
            }
          }
        } else if (userId && agents.length > 0) {
          // No selectedId but we have agents - try with first agent directly
          const firstAgentId = agents[0]?.id || (agents[0] as any)?.agent_id
          if (firstAgentId) {
            try {
              response = await getSessionAPI(
                selectedEndpoint,
                entityType,
                sessionId,
                dbId || '',
                authToken,
                firstAgentId
              )
            } catch (error) {
              // Try other agents
              const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
              const isNotFoundError = errorMessage.includes('agent not found') || 
                                     errorMessage.includes('session not found') ||
                                     errorMessage.includes('404')
              
              if (isNotFoundError) {
                for (let i = 1; i < agents.length; i++) {
                  const tryAgentId = agents[i]?.id || (agents[i] as any)?.agent_id
                  if (!tryAgentId) continue
                  try {
                    response = await getSessionAPI(
                      selectedEndpoint,
                      entityType,
                      sessionId,
                      dbId || '',
                      authToken,
                      tryAgentId
                    )
                    break
                  } catch {
                    // Continue to next agent
                  }
                }
                if (!response) {
                  throw error
                }
              } else {
                throw error
              }
            }
          }
        } else {
          // No way to fetch - missing required params
          console.error('Cannot fetch session - missing agentId and no agents available')
          throw new Error('Cannot fetch session: missing agent ID')
        }
        
        // Ensure we have a response
        if (!response) {
          console.error('No response received after all retry attempts')
          setMessages([])
          return []
        }
        
        if (response) {
          // Playground API returns a session object with runs inside, standard API returns array directly
          // Extract runs from either format
          // Note: Playground API has runs in memory.runs, and each run has events array
          let runs: ChatEntry[] = []
          if (Array.isArray(response)) {
            // Standard format: array of runs
            runs = response
          } else if (response.memory?.runs && Array.isArray(response.memory.runs) && response.memory.runs.length > 0) {
            // Playground format: runs in memory.runs
            // Each run has: run_id, events[], content, created_at, messages[], etc.
            runs = response.memory.runs.map((memoryRun: any) => {
              // Extract user input from messages (first user message) or events
              const events = memoryRun.events || []
              const messages = memoryRun.messages || []
              const userMessage = messages.find((m: any) => m.role === 'user') || messages[0]
              
              const runStartedEvent = events.find((e: any) => e.event === 'RunStarted')
              const userInput = userMessage?.content || runStartedEvent?.input || runStartedEvent?.user_input || runStartedEvent?.message || ''
              
              // Use content directly from memoryRun (it's the agent's response)
              const agentContent = memoryRun.content || ''
              
              return {
                run_id: memoryRun.run_id || '',
                run_input: userInput,
                content: agentContent,
                created_at: memoryRun.created_at || runStartedEvent?.created_at || Math.floor(Date.now() / 1000),
                updated_at: memoryRun.updated_at || memoryRun.created_at || Math.floor(Date.now() / 1000),
                agent_id: memoryRun.agent_id || runStartedEvent?.agent_id,
                tools: [], // Extract from events if needed
                extra_data: {},
                images: [],
                videos: [],
                audio: [],
                response_audio: undefined
              }
            }).filter((run: any) => run.run_input || run.content) // Only include runs with content
          } else if (response.runs && Array.isArray(response.runs)) {
            // Alternative format: session object with runs property
            runs = response.runs
          }
          
          if (runs.length > 0) {
            const messagesFor = runs.flatMap((run) => {
              const filteredMessages: ChatMessage[] = []

              if (run) {
                filteredMessages.push({
                  role: 'user',
                  content: run.run_input ?? '',
                  created_at: run.created_at
                })
              }

              if (run) {
                const toolCalls = [
                  ...(run.tools ?? []),
                  ...(run.extra_data?.reasoning_messages ?? []).reduce(
                    (acc: ToolCall[], msg: ReasoningMessage) => {
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
                    },
                    []
                  )
                ]

                filteredMessages.push({
                  role: 'agent',
                  content: (run.content as string) ?? '',
                  tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
                  extra_data: run.extra_data,
                  images: run.images,
                  videos: run.videos,
                  audio: run.audio,
                  response_audio: run.response_audio,
                  created_at: run.created_at
                })
              }
              return filteredMessages
            })

            const processedMessages = messagesFor.map(
              (message: ChatMessage) => {
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
          } else {
            console.warn('No runs found in session response:', response)
            console.warn('Response structure:', {
              hasRuns: !!(response as any).runs,
              hasMemory: !!(response as any).memory,
              hasMemoryRuns: !!(response as any).memory?.runs,
              isArray: Array.isArray(response),
              keys: typeof response === 'object' ? Object.keys(response as any) : 'not an object'
            })
            setMessages([])
            return []
          }
        } else {
          console.warn('Empty or null response from getSessionAPI')
          setMessages([])
          return []
        }
      } catch (error) {
        let errorMessage = 'Unknown error'
        let isSessionNotFound = false
        
        if (error instanceof Error) {
          errorMessage = error.message
          // Check if it's a "session not found" error
          const lowerMessage = errorMessage.toLowerCase()
          isSessionNotFound = lowerMessage.includes('session not found') || 
                             lowerMessage.includes('404') ||
                             (lowerMessage.includes('not found') && lowerMessage.includes('session'))
          
          // Extract meaningful error message from "Failed to fetch session: 404 ..." format
          if (errorMessage.includes('Failed to fetch session:')) {
            const parts = errorMessage.split('Failed to fetch session:')
            if (parts.length > 1) {
              errorMessage = parts[1].trim()
            }
          }
        }
        
        // Suppress console errors when suppressErrors is true (e.g., initial load from URL)
        if (!suppressErrors) {
          console.error('Error fetching session:', error)
        }
        
        // Check if we're streaming - if so, don't show error for new sessions that aren't ready yet
        // This prevents errors when a new session ID is set but the session isn't fetchable immediately
        try {
          const isStreaming = useStore.getState().isStreaming
          if (isStreaming && isSessionNotFound) {
            setMessages([])
            return []
          }
        } catch {
          // If we can't access store state, continue with normal error handling
        }
        
        // Only show toast errors if not suppressed
        // For initial page loads with stale session IDs, silently handle the error
        if (!suppressErrors) {
          if (isSessionNotFound) {
            toast.error('Session not found. It may have been deleted.', {
              duration: 4000,
            })
          } else {
            toast.error(`Failed to load conversation: ${errorMessage}`, {
              duration: 4000,
            })
          }
        }
        
        setMessages([])
        
        // If session not found, we should clear it from URL to prevent repeated errors
        // This will be handled by the parent component
        return []
      }
    },
    [selectedEndpoint, authToken, setMessages, agents]
  )

  return { getSession, getSessions }
}

export default useSessionLoader
