import { useCallback } from 'react'

import { APIRoutes } from '@/api/routes'

import useChatActions from '@/hooks/useChatActions'
import { useStore } from '../store'
import {
  RunEvent,
  RunResponseContent,
  type RunResponse,
  type ActiveRequirement
} from '@/types/os'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import useAIResponseStream from './useAIResponseStream'
import { ToolCall } from '@/types/os'
import { useQueryState } from 'nuqs'
import { getJsonMarkdown } from '@/lib/utils'

const useAIChatStreamHandler = () => {
  const setMessages = useStore((state) => state.setMessages)
  const { addMessage, focusChatInput } = useChatActions()
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [sessionId, setSessionId] = useQueryState('session')
  const selectedEndpoint = useStore((state) => state.selectedEndpoint)
  const authToken = useStore((state) => state.authToken)
  const mode = useStore((state) => state.mode)
  const setStreamingErrorMessage = useStore(
    (state) => state.setStreamingErrorMessage
  )
  const setIsStreaming = useStore((state) => state.setIsStreaming)
  const setSessionsData = useStore((state) => state.setSessionsData)
  const setIsPausedForInput = useStore((state) => state.setIsPausedForInput)
  const setPendingUserInputFields = useStore(
    (state) => state.setPendingUserInputFields
  )
  const setPausedRunId = useStore((state) => state.setPausedRunId)
  const setPausedSessionId = useStore((state) => state.setPausedSessionId)
  const setPausedToolName = useStore((state) => state.setPausedToolName)
  const setIsPausedForConfirmation = useStore(
    (state) => state.setIsPausedForConfirmation
  )
  const setPendingConfirmationToolName = useStore(
    (state) => state.setPendingConfirmationToolName
  )
  const setPendingConfirmationToolArgs = useStore(
    (state) => state.setPendingConfirmationToolArgs
  )
  const setPendingConfirmationToolCallId = useStore(
    (state) => state.setPendingConfirmationToolCallId
  )
  const { streamResponse } = useAIResponseStream()

  // Define tools that require confirmation
  const CONFIRMATION_REQUIRED_TOOLS: Record<string, boolean> = {}
  // Define tools that require user input, mapped to their required fields
  const USER_INPUT_REQUIRED_TOOLS: Record<
    string,
    { name: string; field_type: string; description: string }[]
  > = {
    enumerate_subdomains_and_ips: [
      {
        name: 'domain',
        field_type: 'string',
        description: 'Domain to enumerate subdomains for'
      }
    ]
  }

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

  /**
   * Processes a new tool call and adds it to the message
   * @param toolCall - The tool call to add
   * @param prevToolCalls - The previous tool calls array
   * @returns Updated tool calls array
   */
  const processToolCall = useCallback(
    (toolCall: ToolCall, prevToolCalls: ToolCall[] = []) => {
      const toolCallId =
        toolCall.tool_call_id || `${toolCall.tool_name}-${toolCall.created_at}`

      const existingToolCallIndex = prevToolCalls.findIndex(
        (tc) =>
          (tc.tool_call_id && tc.tool_call_id === toolCall.tool_call_id) ||
          (!tc.tool_call_id &&
            toolCall.tool_name &&
            toolCall.created_at &&
            `${tc.tool_name}-${tc.created_at}` === toolCallId)
      )
      if (existingToolCallIndex >= 0) {
        const updatedToolCalls = [...prevToolCalls]
        updatedToolCalls[existingToolCallIndex] = {
          ...updatedToolCalls[existingToolCallIndex],
          ...toolCall
        }
        return updatedToolCalls
      } else {
        return [...prevToolCalls, toolCall]
      }
    },
    []
  )

  /**
   * Processes tool calls from a chunk, handling both single tool object and tools array formats
   * @param chunk - The chunk containing tool call data
   * @param existingToolCalls - The existing tool calls array
   * @returns Updated tool calls array
   */
  const processChunkToolCalls = useCallback(
    (
      chunk: RunResponseContent | RunResponse,
      existingToolCalls: ToolCall[] = []
    ) => {
      let updatedToolCalls = [...existingToolCalls]
      // Handle new single tool object format
      if (chunk.tool) {
        updatedToolCalls = processToolCall(chunk.tool, updatedToolCalls)
      }
      // Handle legacy tools array format
      if (chunk.tools && chunk.tools.length > 0) {
        for (const toolCall of chunk.tools) {
          updatedToolCalls = processToolCall(toolCall, updatedToolCalls)
        }
      }

      return updatedToolCalls
    },
    [processToolCall]
  )

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

        let RunUrl: string | null = null

        if (mode === 'team' && teamId) {
          RunUrl = APIRoutes.TeamRun(endpointUrl, teamId)
        } else if (mode === 'agent' && agentId) {
          RunUrl = APIRoutes.AgentRun(endpointUrl).replace(
            '{agent_id}',
            agentId
          )
        }

        if (!RunUrl) {
          updateMessagesWithErrorState()
          setStreamingErrorMessage('Please select an agent or team first.')
          setIsStreaming(false)
          return
        }

        formData.append('stream', 'true')
        formData.append('session_id', sessionId ?? '')

        // Create headers with auth token if available
        const headers: Record<string, string> = {}
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }

await streamResponse({
          apiUrl: RunUrl,
          headers,
          requestBody: formData,
          onChunk: (chunk: RunResponse) => {
            // Log ALL events to see what's being sent
            if (chunk.event !== RunEvent.RunContent && chunk.event !== RunEvent.RunStarted) {
              console.log('[EVENT]', chunk.event, 'full:', JSON.stringify(chunk))
            }
            
            // Check for is_paused in the chunk (some events have this flag)
            const chunkAny = chunk as unknown as Record<string, unknown>
            if (chunkAny.is_paused === true) {
              console.log('[FOUND] is_paused=true in chunk!')
            }
            
            if (chunk.event === RunEvent.RunPaused) {
              console.log('[DEBUG] RunPaused event received:', JSON.stringify(chunk))
            }
            if (
              chunk.event === RunEvent.RunStarted ||
              chunk.event === RunEvent.TeamRunStarted ||
              chunk.event === RunEvent.ReasoningStarted ||
              chunk.event === RunEvent.TeamReasoningStarted
            ) {
              newSessionId = chunk.session_id as string
              setSessionId(chunk.session_id as string)
              if (
                (!sessionId || sessionId !== chunk.session_id) &&
                chunk.session_id
              ) {
                const sessionData = {
                  session_id: chunk.session_id as string,
                  session_name: formData.get('message') as string,
                  created_at: chunk.created_at
                }
                setSessionsData((prevSessionsData) => {
                  const sessionExists = prevSessionsData?.some(
                    (session) => session.session_id === chunk.session_id
                  )
                  if (sessionExists) {
                    return prevSessionsData
                  }
                  return [sessionData, ...(prevSessionsData ?? [])]
                })
              }
            } else if (
              chunk.event === RunEvent.ToolCallStarted ||
              chunk.event === RunEvent.TeamToolCallStarted ||
              chunk.event === RunEvent.ToolCallCompleted ||
              chunk.event === RunEvent.TeamToolCallCompleted
            ) {
              const toolName = chunk.tool?.tool_name || chunk.tools?.[0]?.tool_name
              console.log('[TOOL] Tool call:', toolName, 'args:', chunk.tool?.tool_args)
              
              // Check if this tool requires user input (domain missing)
              if (toolName && USER_INPUT_REQUIRED_TOOLS[toolName]) {
                const toolArgs = chunk.tool?.tool_args || chunk.tools?.[0]?.tool_args || {}
                const fields = USER_INPUT_REQUIRED_TOOLS[toolName]
                const missingFields = fields.filter((f) => !toolArgs[f.name] || toolArgs[f.name] === '')
                
                if (missingFields.length > 0) {
                  console.log('[HITL] Pausing for user input on tool:', toolName, 'missing:', missingFields.map(f => f.name))
                  setPendingUserInputFields(
                    missingFields.map((f) => ({
                      name: f.name,
                      field_type: f.field_type,
                      description: f.description,
                      value: toolArgs[f.name] || null
                    }))
                  )
                  setPausedToolName(toolName)
                  setPausedRunId(chunk.run_id ?? null)
                  setPausedSessionId(chunk.session_id ?? null)
                  setIsPausedForInput(true)
                  setIsStreaming(false)
                }
              }
              
              // Check if this tool requires user confirmation
              if (toolName && CONFIRMATION_REQUIRED_TOOLS[toolName]) {
                const toolArgs = chunk.tool?.tool_args || chunk.tools?.[0]?.tool_args || {}
                const toolCallId = chunk.tool?.tool_call_id || chunk.tools?.[0]?.tool_call_id || ''
                
                console.log('[HITL] Pausing for confirmation on tool:', toolName)
                setPendingConfirmationToolName(toolName)
                setPendingConfirmationToolArgs(toolArgs as Record<string, string>)
                setPendingConfirmationToolCallId(toolCallId)
                setPausedRunId(chunk.run_id ?? null)
                setPausedSessionId(chunk.session_id ?? null)
                setIsPausedForConfirmation(true)
                setIsStreaming(false)
              }
              
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.role === 'agent') {
                  lastMessage.tool_calls = processChunkToolCalls(
                    chunk,
                    lastMessage.tool_calls
                  )
                }
                return newMessages
              })
            } else if (
              chunk.event === RunEvent.RunContent ||
              chunk.event === RunEvent.TeamRunContent
            ) {
              console.log('[DEBUG] RunContent event:', chunk.event)
              setMessages((prevMessages) => {
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

                  // Handle tool calls streaming
                  lastMessage.tool_calls = processChunkToolCalls(
                    chunk,
                    lastMessage.tool_calls
                  )
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
                  typeof chunk?.content !== 'string' &&
                  chunk.content !== null
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
            } else if (
              chunk.event === RunEvent.ReasoningStep ||
              chunk.event === RunEvent.TeamReasoningStep
            ) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.role === 'agent') {
                  const existingSteps =
                    lastMessage.extra_data?.reasoning_steps ?? []
                  const incomingSteps = chunk.extra_data?.reasoning_steps ?? []
                  lastMessage.extra_data = {
                    ...lastMessage.extra_data,
                    reasoning_steps: [...existingSteps, ...incomingSteps]
                  }
                }
                return newMessages
              })
            } else if (
              chunk.event === RunEvent.ReasoningCompleted ||
              chunk.event === RunEvent.TeamReasoningCompleted
            ) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.role === 'agent') {
                  if (chunk.extra_data?.reasoning_steps) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      reasoning_steps: chunk.extra_data.reasoning_steps
                    }
                  }
                }
                return newMessages
              })
            } else if (
              chunk.event === RunEvent.RunError ||
              chunk.event === RunEvent.TeamRunError ||
              chunk.event === RunEvent.TeamRunCancelled
            ) {
              updateMessagesWithErrorState()
              const errorContent =
                (chunk.content as string) ||
                (chunk.event === RunEvent.TeamRunCancelled
                  ? 'Run cancelled'
                  : 'Error during run')
              setStreamingErrorMessage(errorContent)
              if (newSessionId) {
                setSessionsData(
                  (prevSessionsData) =>
                    prevSessionsData?.filter(
                      (session) => session.session_id !== newSessionId
                    ) ?? null
                )
              }
            } else if (
              chunk.event === RunEvent.UpdatingMemory ||
              chunk.event === RunEvent.TeamMemoryUpdateStarted ||
              chunk.event === RunEvent.TeamMemoryUpdateCompleted
            ) {
              // No-op for now; could surface a lightweight UI indicator in the future
            } else if (
              chunk.event === RunEvent.RunPaused
            ) {
              console.log('[DEBUG] RunPaused FULL chunk:', JSON.stringify(chunk, null, 2))
              const chunkAny = chunk as unknown as Record<string, unknown>

              // Log all top-level keys to see what fields are present
              console.log('[DEBUG] RunPaused keys:', Object.keys(chunkAny))

              // Try every possible location for requirements
              const rawReqs =
                chunkAny.active_requirements ??
                (chunkAny.event_data as Record<string, unknown>)?.active_requirements ??
                chunkAny.tools_requiring_user_input ??
                (chunkAny.event_data as Record<string, unknown>)?.tools_requiring_user_input ??
                chunkAny.requirements ??
                (chunkAny.event_data as Record<string, unknown>)?.requirements ??
                chunkAny.tools ??
                []

              const activeRequirements: ActiveRequirement[] = Array.isArray(rawReqs)
                ? rawReqs as ActiveRequirement[]
                : []

              console.log('[DEBUG] Raw requirements (count):', activeRequirements.length)
              activeRequirements.forEach((r, i) => {
                console.log(`[DEBUG] req[${i}] keys:`, Object.keys(r))
                console.log(`[DEBUG] req[${i}] needs_user_input:`, r.needs_user_input)
                console.log(`[DEBUG] req[${i}] needs_confirmation:`, r.needs_confirmation)
                console.log(`[DEBUG] req[${i}] tool_execution:`, r.tool_execution)
                console.log(`[DEBUG] req[${i}] user_input_schema:`, r.user_input_schema)
              })

              const confirmationReq = activeRequirements.find(
                (r) => r.needs_confirmation || r.tool_execution?.requires_confirmation
              )

              const userInputReq = activeRequirements.find(
                (r) => r.needs_user_input || r.tool_execution?.requires_user_input
              )

              const toolName =
                userInputReq?.tool_execution?.tool_name ??
                confirmationReq?.tool_execution?.tool_name ??
                (chunkAny.tool_name as string) ??
                (chunkAny.event_data as { tool_name?: string })?.tool_name ??
                (chunkAny.tool as { tool_name?: string })?.tool_name ??
                (chunkAny.tools as Array<{ tool_name?: string }>)?.[0]?.tool_name ??
                'Unknown Tool'

              setPausedRunId(chunk.run_id ?? null)
              setPausedSessionId(chunk.session_id ?? null)
              setIsStreaming(false)

              if (confirmationReq) {
                const toolExec = confirmationReq.tool_execution || (chunkAny.tools as Array<Record<string, unknown>>)?.[0]
                console.log('[HITL] Paused for CONFIRMATION on tool:', toolName)
                setPendingConfirmationToolName(
                  (toolExec?.tool_name as string) ?? toolName
                )
                setPendingConfirmationToolArgs(
                  (toolExec?.tool_args as Record<string, string>) ?? {}
                )
                setPendingConfirmationToolCallId(
                  (toolExec?.tool_call_id as string) ?? null
                )
                setPausedToolName(toolName)
                setIsPausedForConfirmation(true)
              } else if (userInputReq?.user_input_schema || userInputReq?.tool_execution?.user_input_schema) {
                const schema = userInputReq.user_input_schema || userInputReq.tool_execution?.user_input_schema
                console.log('[HITL] Paused for USER INPUT on tool:', toolName)
                setPendingUserInputFields(schema as any)
                setPausedToolName(toolName)
                setIsPausedForInput(true)
              } else if (activeRequirements.length > 0) {
                console.log('[HITL] Paused with requirements but no schema/confirmation — using default input field')
                setPendingUserInputFields([{
                  name: 'input',
                  field_type: 'string',
                  description: 'Additional input required',
                  value: null
                }])
                setPausedToolName(toolName)
                setIsPausedForInput(true)
              } else {
                console.log('[HITL] RunPaused received but NO active_requirements found at all')
              }
            } else if (
              chunk.event === RunEvent.RunCompleted ||
              chunk.event === RunEvent.TeamRunCompleted
            ) {
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
                      tool_calls: processChunkToolCalls(
                        chunk,
                        message.tool_calls
                      ),
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
            if (newSessionId) {
              setSessionsData(
                (prevSessionsData) =>
                  prevSessionsData?.filter(
                    (session) => session.session_id !== newSessionId
                  ) ?? null
              )
            }
          },
          onComplete: () => {}
        })
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        if (newSessionId) {
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
      authToken,
      streamResponse,
      agentId,
      teamId,
      mode,
      setStreamingErrorMessage,
      setIsStreaming,
      focusChatInput,
      setSessionsData,
      sessionId,
      setSessionId,
      processChunkToolCalls
    ]
  )

  return { handleStreamResponse }
}

export default useAIChatStreamHandler
