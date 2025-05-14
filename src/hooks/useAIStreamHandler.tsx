import { useCallback } from 'react'

import { APIRoutes } from '@/api/routes'

import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '../store'
import { RunEvent, type RunResponse } from '@/types/playground'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import useAIResponseStream from './useAIResponseStream'
import { ToolCall } from '@/types/playground'
import { useQueryState } from 'nuqs'
import { getJsonMarkdown } from '@/lib/utils'

/**
 * useAIChatStreamHandler is responsible for making API calls and handling the stream response.
 * For now, it only streams message content and updates the messages state.
 */
const useAIChatStreamHandler = () => {
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const { addMessage, focusChatInput } = useChatActions()
  const [agentId] = useQueryState('agent')
  const [sessionId, setSessionId] = useQueryState('session')
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setStreamingErrorMessage = usePlaygroundStore(
    (state) => state.setStreamingErrorMessage
  )
  const setIsStreaming = usePlaygroundStore((state) => state.setIsStreaming)
  const setSessionsData = usePlaygroundStore((state) => state.setSessionsData)
  const hasStorage = usePlaygroundStore((state) => state.hasStorage)
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

        if (!agentId) return
        const playgroundRunUrl = APIRoutes.AgentRun(endpointUrl).replace(
          '{agent_id}',
          agentId
        )

        formData.append('stream', 'true')
        formData.append('session_id', sessionId ?? '')

        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody: formData,
          onChunk: (chunk: RunResponse) => {
            if (
              chunk.event === RunEvent.RunStarted ||
              chunk.event === RunEvent.ReasoningStarted
            ) {
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
            } else if (chunk.event === RunEvent.RunResponse) {
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
          onComplete: () => {}
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
      setStreamingErrorMessage,
      setIsStreaming,
      focusChatInput,
      setSessionsData,
      sessionId,
      setSessionId,
      hasStorage
    ]
  )

  return { handleStreamResponse }
}

export default useAIChatStreamHandler
