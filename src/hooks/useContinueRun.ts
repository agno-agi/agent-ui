import { useCallback } from 'react'
import { useStore } from '../store'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import { APIRoutes } from '@/api/routes'
import { RunEvent, type RunResponse, type ActiveRequirement, type UserInputField } from '@/types/os'
import useChatActions from './useChatActions'
import { useQueryState } from 'nuqs'
import { getJsonMarkdown } from '@/lib/utils'
import useAIResponseStream from './useAIResponseStream'

const useContinueRun = () => {
  const selectedEndpoint = useStore((state) => state.selectedEndpoint)
  const authToken = useStore((state) => state.authToken)
  const mode = useStore((state) => state.mode)
  const setMessages = useStore((state) => state.setMessages)
  const setIsStreaming = useStore((state) => state.setIsStreaming)
  const setStreamingErrorMessage = useStore(
    (state) => state.setStreamingErrorMessage
  )
  const setIsPausedForInput = useStore((state) => state.setIsPausedForInput)
  const setPendingUserInputFields = useStore(
    (state) => state.setPendingUserInputFields
  )
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
  const setPausedRunId = useStore((state) => state.setPausedRunId)
  const setPausedSessionId = useStore((state) => state.setPausedSessionId)
  const setPausedToolName = useStore((state) => state.setPausedToolName)
  const setPausedToolCallId = useStore((state) => state.setPausedToolCallId)
  const setPausedToolExecution = useStore(
    (state) => state.setPausedToolExecution
  )
  const pausedRunId = useStore((state) => state.pausedRunId)
  const pausedSessionId = useStore((state) => state.pausedSessionId)
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [sessionId, setSessionId] = useQueryState('session')
  const { focusChatInput } = useChatActions()
  const { streamResponse } = useAIResponseStream()

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

  const clearPausedState = useCallback(() => {
    setIsPausedForInput(false)
    setPendingUserInputFields([])
    setIsPausedForConfirmation(false)
    setPendingConfirmationToolName(null)
    setPendingConfirmationToolArgs({})
    setPendingConfirmationToolCallId(null)
    setPausedRunId(null)
    setPausedSessionId(null)
    setPausedToolName(null)
    setPausedToolCallId(null)
    setPausedToolExecution(null)
  }, [
    setIsPausedForInput,
    setPendingUserInputFields,
    setIsPausedForConfirmation,
    setPendingConfirmationToolName,
    setPendingConfirmationToolArgs,
    setPendingConfirmationToolCallId,
    setPausedRunId,
    setPausedSessionId,
    setPausedToolName,
    setPausedToolCallId,
    setPausedToolExecution
  ])

  const streamContinuation = useCallback(
    async (
      url: string,
      formData: FormData
    ) => {
      let lastContent = ''
      let newSessionId = sessionId

      const headers: Record<string, string> = {}
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      await streamResponse({
        apiUrl: url,
        headers,
        requestBody: formData,
        onChunk: (chunk: RunResponse) => {
          if (
            chunk.event === RunEvent.RunStarted ||
            chunk.event === RunEvent.TeamRunStarted
          ) {
            newSessionId = chunk.session_id as string
            if (chunk.session_id && chunk.session_id !== sessionId) {
              setSessionId(chunk.session_id)
            }
          } else if (
            chunk.event === RunEvent.RunContent ||
            chunk.event === RunEvent.TeamRunContent
          ) {
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
              }
              return newMessages
            })
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
            clearPausedState()
            setIsStreaming(false)
          } else if (
            chunk.event === RunEvent.RunError ||
            chunk.event === RunEvent.TeamRunError
          ) {
            updateMessagesWithErrorState()
            setStreamingErrorMessage(
              (chunk.content as string) || 'Error during run continuation'
            )
            if (newSessionId) {
              useStore.getState().setSessionsData(
                (prevSessionsData) =>
                  prevSessionsData?.filter(
                    (session) => session.session_id !== newSessionId
                  ) ?? null
              )
            }
          } else if (chunk.event === RunEvent.RunPaused) {
            const rawReqs = chunk.requirements ?? []
            const requirements: ActiveRequirement[] = Array.isArray(rawReqs)
              ? rawReqs as ActiveRequirement[]
              : []

            const confirmationReq = requirements.find(
              (r) => r.needs_confirmation || r.tool_execution?.requires_confirmation
            )

            const userInputReq = requirements.find(
              (r) => r.needs_user_input || r.tool_execution?.requires_user_input
            )

            const toolName =
              userInputReq?.tool_execution?.tool_name ??
              confirmationReq?.tool_execution?.tool_name ??
              'Unknown Tool'

            setPausedRunId(chunk.run_id ?? null)
            setPausedSessionId(chunk.session_id ?? null)
            setIsStreaming(false)

            if (confirmationReq) {
              const toolExec = confirmationReq.tool_execution
              setPausedToolExecution(toolExec ?? null)
              setPendingConfirmationToolName(toolName)
              setPendingConfirmationToolArgs(
                (toolExec?.tool_args ?? {}) as Record<string, string>
              )
              setPendingConfirmationToolCallId(
                (toolExec?.tool_call_id ?? null) as string | null
              )
              setPausedToolName(toolName)
              setPausedToolCallId((toolExec?.tool_call_id ?? null) as string | null)
              setIsPausedForConfirmation(true)
            } else if (userInputReq?.user_input_schema || userInputReq?.tool_execution?.user_input_schema) {
              const schema = userInputReq.user_input_schema ?? userInputReq.tool_execution?.user_input_schema
              setPendingUserInputFields(schema as UserInputField[])
              setPausedToolExecution(userInputReq.tool_execution ?? null)
              setPausedToolName(toolName)
              setPausedToolCallId((userInputReq.tool_execution?.tool_call_id ?? null) as string | null)
              setIsPausedForInput(true)
            }
          }
        },
        onError: (error) => {
          updateMessagesWithErrorState()
          setStreamingErrorMessage(error.message)
          clearPausedState()
          setIsStreaming(false)
        },
        onComplete: () => {
          clearPausedState()
          setIsStreaming(false)
          focusChatInput()
        }
      })
    },
    [
      sessionId,
      setSessionId,
      setMessages,
      updateMessagesWithErrorState,
      setStreamingErrorMessage,
      clearPausedState,
      setIsStreaming,
      focusChatInput,
      authToken,
      streamResponse,
      setPausedRunId,
      setPausedSessionId,
      setPendingConfirmationToolName,
      setPendingConfirmationToolArgs,
      setPendingConfirmationToolCallId,
      setPausedToolName,
      setPausedToolCallId,
      setPausedToolExecution,
      setIsPausedForConfirmation,
      setPendingUserInputFields,
      setIsPausedForInput
    ]
  )

  const doContinueRequest = useCallback(
    async (
      toolsPayload: Record<string, unknown>[]
    ) => {
      const endpointUrl = constructEndpointUrl(selectedEndpoint)

      let ContinueUrl: string | null = null
      if (mode === 'team' && teamId) {
        ContinueUrl = APIRoutes.TeamContinueRun(endpointUrl, teamId, pausedRunId!)
      } else if (mode === 'agent' && agentId) {
        ContinueUrl = APIRoutes.AgentContinueRun(endpointUrl, agentId, pausedRunId!)
      }

      if (!ContinueUrl) {
        setIsStreaming(false)
        return
      }

      const formData = new FormData()
      formData.append('tools', JSON.stringify(toolsPayload))
      formData.append('session_id', pausedSessionId!)
      formData.append('stream', 'true')

      await streamContinuation(ContinueUrl, formData)
    },
    [
      pausedRunId,
      pausedSessionId,
      selectedEndpoint,
      authToken,
      mode,
      agentId,
      teamId,
      streamContinuation
    ]
  )

  const continueRun = useCallback(
    async (userInputValues: Record<string, string>) => {
      if (!pausedRunId || !pausedSessionId) return

      const pausedState = useStore.getState()
      const pausedToolExecution = pausedState.pausedToolExecution
      const toolCallId =
        pausedToolExecution?.tool_call_id ||
        pausedState.pausedToolCallId ||
        pausedRunId
      const toolName =
        pausedToolExecution?.tool_name || pausedState.pausedToolName || ''

      const schemaSource = pausedToolExecution?.user_input_schema?.length
        ? pausedToolExecution.user_input_schema
        : pausedState.pendingUserInputFields

      const userInputSchema = schemaSource.map((field) => ({
        ...field,
        value: userInputValues[field.name] ?? field.value ?? null
      }))

      clearPausedState()
      setStreamingErrorMessage('')
      setIsStreaming(true)

      const toolsPayload = [
        {
          ...(pausedToolExecution ?? {}),
          tool_call_id: toolCallId,
          tool_name: toolName,
          tool_args: pausedToolExecution?.tool_args ?? {},
          requires_user_input: true,
          user_input_schema: userInputSchema
        }
      ]

      try {
        await doContinueRequest(toolsPayload)
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        setIsStreaming(false)
        clearPausedState()
      }
    },
    [
      pausedRunId,
      pausedSessionId,
      clearPausedState,
      setStreamingErrorMessage,
      setIsStreaming,
      updateMessagesWithErrorState,
      doContinueRequest
    ]
  )

  const confirmRun = useCallback(
    async (confirmed: boolean) => {
      if (!pausedRunId || !pausedSessionId) return

      const pausedState = useStore.getState()
      const pausedToolExecution = pausedState.pausedToolExecution
      const confirmationToolCallId =
        pausedState.pendingConfirmationToolCallId
      const confirmationToolName = pausedState.pendingConfirmationToolName
      const confirmationToolArgs = pausedState.pendingConfirmationToolArgs

      clearPausedState()
      setStreamingErrorMessage('')
      setIsStreaming(true)

      const toolsPayload = [
        {
          ...(pausedToolExecution ?? {}),
          tool_call_id:
            pausedToolExecution?.tool_call_id ||
            confirmationToolCallId ||
            pausedRunId,
          tool_name:
            pausedToolExecution?.tool_name || confirmationToolName || '',
          tool_args: pausedToolExecution?.tool_args ?? confirmationToolArgs,
          requires_confirmation: true,
          confirmed
        }
      ]

      try {
        await doContinueRequest(toolsPayload)
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        setIsStreaming(false)
        clearPausedState()
      }
    },
    [
      pausedRunId,
      pausedSessionId,
      clearPausedState,
      setStreamingErrorMessage,
      setIsStreaming,
      updateMessagesWithErrorState,
      doContinueRequest
    ]
  )

  const cancelRun = useCallback(
    async () => {
      if (!pausedRunId || !pausedSessionId) return

      const pausedState = useStore.getState()
      const pausedToolExecution = pausedState.pausedToolExecution
      const isConfirmation = pausedState.isPausedForConfirmation
      const toolCallId =
        pausedToolExecution?.tool_call_id ||
        pausedState.pausedToolCallId ||
        pausedRunId
      const toolName =
        pausedToolExecution?.tool_name || pausedState.pausedToolName || ''

      clearPausedState()
      setStreamingErrorMessage('')
      setIsStreaming(true)

      const toolsPayload = [
        {
          ...(pausedToolExecution ?? {}),
          tool_call_id: toolCallId,
          tool_name: toolName,
          tool_args: pausedToolExecution?.tool_args ?? {},
          requires_confirmation: isConfirmation,
          requires_user_input: false,
          user_input_schema: isConfirmation
            ? pausedToolExecution?.user_input_schema
            : undefined,
          confirmed: false
        }
      ]

      try {
        await doContinueRequest(toolsPayload)
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        setIsStreaming(false)
        clearPausedState()
      }
    },
    [
      pausedRunId,
      pausedSessionId,
      clearPausedState,
      setStreamingErrorMessage,
      setIsStreaming,
      updateMessagesWithErrorState,
      doContinueRequest
    ]
  )

  return { continueRun, confirmRun, cancelRun }
}

export default useContinueRun