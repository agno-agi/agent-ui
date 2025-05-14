import { useCallback, useEffect, useState } from 'react'

import { APIRoutes } from '@/api/routes'

import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '../store'
import {
  RunEvent,
  type RunResponse,
  Workflow,
  SessionEntry,
  PlaygroundChatMessage
} from '@/types/playground'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import useAIResponseStream from './useAIResponseStream'
import { ToolCall } from '@/types/playground'
import { useQueryState } from 'nuqs'
import { getJsonMarkdown } from '@/lib/utils'
import {
  getPlaygroundWorkflowAPI,
  getWorkflowSessionStateAPI
} from '@/api/playground'

/**
 * useAIChatStreamHandler is responsible for making API calls and handling the stream response.
 * For now, it only streams message content and updates the messages state.
 */
const useAIChatStreamHandler = () => {
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const { addMessage, focusChatInput } = useChatActions()
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [workflowId] = useQueryState('workflow')
  const [sessionId, setSessionId] = useQueryState('session')
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setStreamingErrorMessage = usePlaygroundStore(
    (state) => state.setStreamingErrorMessage
  )
  const setIsStreaming = usePlaygroundStore((state) => state.setIsStreaming)
  const setSessionsData = usePlaygroundStore((state) => state.setSessionsData)
  const hasStorage = usePlaygroundStore((state) => state.hasStorage)
  const { streamResponse } = useAIResponseStream()

  // State to store the current workflow details
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)

  // Fetch workflow details when workflowId changes
  useEffect(() => {
    const fetchWorkflowDetails = async () => {
      if (workflowId && selectedEndpoint) {
        try {
          const workflow = await getPlaygroundWorkflowAPI(
            selectedEndpoint,
            workflowId
          )
          setCurrentWorkflow(workflow)
        } catch (error) {
          console.error('Error fetching workflow details:', error)
          setCurrentWorkflow(null)
        }
      } else {
        setCurrentWorkflow(null)
      }
    }

    fetchWorkflowDetails()
  }, [workflowId, selectedEndpoint])

  const updateMessagesWithErrorState = useCallback(() => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages]
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'agent') {
        lastMessage.streamingError = true
      }
      return newMessages
    })
  }, [setMessages])

  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {
      setIsStreaming(true)

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      setMessages((prevMessages) => {
        if (prevMessages.length >= 2) {
          const lastMessage = prevMessages[prevMessages.length - 1]
          const secondLastMessage = prevMessages[prevMessages.length - 2]
          if (
            lastMessage.role === 'agent' &&
            lastMessage.streamingError &&
            secondLastMessage.role === 'user'
          ) {
            return prevMessages.slice(0, -2)
          }
        }
        return prevMessages
      })

      addMessage({
        role: 'user',
        content: formData.get('message') as string,
        created_at: Math.floor(Date.now() / 1000)
      })

      addMessage({
        role: 'agent',
        content: '',
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000) + 1
      })

      let lastContent = ''
      let newSessionId = sessionId
      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint)

        let currentAgentId = agentId
        const currentTeamId = teamId
        const currentWorkflowId = workflowId

        // Handle priority: team > agent > workflow
        if (currentAgentId && currentTeamId) {
          console.warn(
            'Both agentId and teamId are set. Prioritizing teamId and clearing agentId.'
          )
          currentAgentId = null
        }

        if ((currentAgentId || currentTeamId) && currentWorkflowId) {
          console.warn(
            'Both workflow and agent/team are set. Prioritizing agent/team and ignoring workflow.'
          )
        }

        if (!currentAgentId && !currentTeamId && !currentWorkflowId) {
          console.error('No agent, team, or workflow selected')
          setIsStreaming(false)
          return
        }

        let playgroundRunUrl: string

        if (currentTeamId) {
          playgroundRunUrl = APIRoutes.TeamRun(endpointUrl).replace(
            '{team_id}',
            currentTeamId
          )
        } else if (currentAgentId) {
          playgroundRunUrl = APIRoutes.AgentRun(endpointUrl).replace(
            '{agent_id}',
            currentAgentId
          )
        } else if (currentWorkflowId) {
          playgroundRunUrl = APIRoutes.WorkflowRun(
            endpointUrl,
            currentWorkflowId
          )
        } else {
          console.error(
            'Inconsistent state: No agent, team, or workflow ID found despite initial check.'
          )
          setIsStreaming(false)
          return
        }

        // Handle different request formats for different endpoints
        let requestBody = {}
        let headers: Record<string, string> = {}

        if (currentWorkflowId && currentWorkflow) {
          // For workflows, we need to use the exact format shown in the example
          const userMessage = formData.get('message') as string

          // Generate a unique session ID for workflows if we don't have one yet
          if (!sessionId) {
            // Generate a unique session ID
            const generateUniqueSessionId = (): string => {
              // Generate a random UUID
              const uuid = crypto.randomUUID()

              // Check if this UUID already exists in the sessions list
              const sessionsData = usePlaygroundStore.getState().sessionsData
              if (
                sessionsData &&
                sessionsData.some(
                  (session: SessionEntry) => session.session_id === uuid
                )
              ) {
                // If it exists, generate another one
                return generateUniqueSessionId()
              }
              return uuid
            }

            // Generate a unique session ID
            newSessionId = generateUniqueSessionId()

            // Store the session data
            if (hasStorage) {
              const sessionData = {
                session_id: newSessionId,
                title: formData.get('message') as string,
                created_at: Math.floor(Date.now() / 1000)
              }

              // Add the session to the sessions list
              setSessionsData((prevSessionsData: SessionEntry[] | null) => {
                return [sessionData, ...(prevSessionsData ?? [])]
              })

              // Set the session ID in the URL
              setSessionId(newSessionId)

              // Update all messages with this session ID
              setMessages((prevMessages) => {
                return prevMessages.map((msg) => ({
                  ...msg,
                  session_id: newSessionId || undefined
                }))
              })
            } else {
              setSessionId(newSessionId)
            }
          }

          // Create the exact payload format for workflows
          requestBody = {
            input: {
              user_message: userMessage
            },
            user_id: null,
            session_id: newSessionId || sessionId || null // Use our generated ID, or existing ID, or null
          }

          // Set the exact headers needed
          headers = {
            'Content-Type': 'application/json',
            Accept: '*/*'
          }
        } else {
          // For agents and teams, use the FormData approach
          formData.append('stream', 'true')
          formData.append('session_id', sessionId ?? '')
          requestBody = formData
          headers = {} // Let the browser set the correct Content-Type for FormData
        }

        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody,
          headers,
          onChunk: (chunk: RunResponse) => {
            if (
              chunk.event === RunEvent.RunStarted ||
              chunk.event === RunEvent.ReasoningStarted
            ) {
              // For workflows, the session_id might come in the RunResponse event
              newSessionId = chunk.session_id as string
              setSessionId(chunk.session_id as string)
              if (
                hasStorage &&
                (!sessionId || sessionId !== chunk.session_id) &&
                chunk.session_id
              ) {
                const sessionData = {
                  session_id: chunk.session_id as string,
                  title: formData.get('message') as string,
                  created_at: chunk.created_at
                }
                setSessionsData((prevSessionsData: SessionEntry[] | null) => {
                  const sessionExists = prevSessionsData?.some(
                    (session: SessionEntry) =>
                      session.session_id === chunk.session_id
                  )
                  if (sessionExists) {
                    return prevSessionsData
                  }
                  return [sessionData, ...(prevSessionsData ?? [])]
                })
              }
            } else if (chunk.event === RunEvent.RunResponse) {
              setMessages((prevMessages: PlaygroundChatMessage[]) => {
                const newMessages = [...prevMessages]
                const lastMessage = newMessages[newMessages.length - 1]
                if (
                  lastMessage &&
                  lastMessage.role === 'agent' &&
                  typeof chunk.content === 'string'
                ) {
                  const uniqueContent = chunk.content.replace(lastContent, '')
                  lastMessage.content += uniqueContent
                  lastContent = chunk.content

                  const toolCalls: ToolCall[] = [...(chunk.tools ?? [])]
                  if (toolCalls.length > 0) {
                    lastMessage.tool_calls = toolCalls
                  }
                  if (chunk.extra_data?.reasoning_steps) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      reasoning_steps: chunk.extra_data.reasoning_steps
                    }
                  }

                  if (chunk.extra_data?.references) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      references: chunk.extra_data.references
                    }
                  }

                  lastMessage.created_at =
                    chunk.created_at ?? lastMessage.created_at
                  if (chunk.images) {
                    lastMessage.images = chunk.images
                  }
                  if (chunk.videos) {
                    lastMessage.videos = chunk.videos
                  }
                  if (chunk.audio) {
                    lastMessage.audio = chunk.audio
                  }
                } else if (
                  lastMessage &&
                  lastMessage.role === 'agent' &&
                  typeof chunk?.content !== 'string'
                ) {
                  const jsonBlock = getJsonMarkdown(chunk?.content)

                  lastMessage.content += jsonBlock
                  lastContent = jsonBlock
                } else if (
                  chunk.response_audio?.transcript &&
                  typeof chunk.response_audio?.transcript === 'string'
                ) {
                  const transcript = chunk.response_audio.transcript
                  lastMessage.response_audio = {
                    ...lastMessage.response_audio,
                    transcript:
                      lastMessage.response_audio?.transcript + transcript
                  }
                }
                return newMessages
              })
            } else if (chunk.event === RunEvent.RunError) {
              updateMessagesWithErrorState()
              const errorContent = chunk.content as string
              setStreamingErrorMessage(errorContent)
              if (hasStorage && newSessionId) {
                setSessionsData(
                  (prevSessionsData) =>
                    prevSessionsData?.filter(
                      (session) => session.session_id !== newSessionId
                    ) ?? null
                )
              }
            } else if (chunk.event === RunEvent.RunCompleted) {
              setMessages((prevMessages) => {
                const newMessages = prevMessages.map((message, index) => {
                  if (
                    index === prevMessages.length - 1 &&
                    message.role === 'agent'
                  ) {
                    let updatedContent: string
                    if (typeof chunk.content === 'string') {
                      updatedContent = chunk.content
                    } else {
                      try {
                        updatedContent = JSON.stringify(chunk.content)
                      } catch {
                        updatedContent = 'Error parsing response'
                      }
                    }
                    return {
                      ...message,
                      content: updatedContent,
                      tool_calls:
                        chunk.tools && chunk.tools.length > 0
                          ? [...chunk.tools]
                          : message.tool_calls,
                      images: chunk.images ?? message.images,
                      videos: chunk.videos ?? message.videos,
                      response_audio: chunk.response_audio,
                      created_at: chunk.created_at ?? message.created_at,
                      extra_data: {
                        reasoning_steps:
                          chunk.extra_data?.reasoning_steps ??
                          message.extra_data?.reasoning_steps,
                        references:
                          chunk.extra_data?.references ??
                          message.extra_data?.references
                      }
                    }
                  }
                  return message
                })
                return newMessages
              })
            }
          },
          onError: (error) => {
            updateMessagesWithErrorState()
            setStreamingErrorMessage(error.message)
            if (hasStorage && newSessionId) {
              setSessionsData(
                (prevSessionsData) =>
                  prevSessionsData?.filter(
                    (session) => session.session_id !== newSessionId
                  ) ?? null
              )
            }
          },
          onComplete: async () => {
            // Make sure to end streaming state even if no RunCompleted event was received
            // This is particularly important for workflows where the session_id might be null initially
            setIsStreaming(false)

            // If this is a workflow and we have a session ID, fetch the session state
            if (currentWorkflowId && newSessionId) {
              try {
                const sessionState = await getWorkflowSessionStateAPI(
                  selectedEndpoint,
                  currentWorkflowId,
                  newSessionId
                )
                // Store the session state in the store
                console.log('Workflow session state:', sessionState)
                usePlaygroundStore
                  .getState()
                  .setWorkflowSessionState(sessionState)
              } catch (error) {
                console.error('Error fetching workflow session state:', error)
                // Clear the session state on error
                usePlaygroundStore.getState().setWorkflowSessionState(null)
              }
            } else {
              // Clear the session state when not in a workflow
              usePlaygroundStore.getState().setWorkflowSessionState(null)
            }
          }
        })
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        if (hasStorage && newSessionId) {
          setSessionsData(
            (prevSessionsData) =>
              prevSessionsData?.filter(
                (session) => session.session_id !== newSessionId
              ) ?? null
          )
        }
      } finally {
        focusChatInput()
        setIsStreaming(false)
      }
    },
    [
      setMessages,
      addMessage,
      updateMessagesWithErrorState,
      selectedEndpoint,
      streamResponse,
      agentId,
      teamId,
      setStreamingErrorMessage,
      setIsStreaming,
      focusChatInput,
      setSessionsData,
      sessionId,
      setSessionId,
      hasStorage,
      workflowId,
      currentWorkflow
    ]
  )

  return { handleStreamResponse }
}

export default useAIChatStreamHandler
