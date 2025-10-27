import type { ChatMessage } from '@/types/os'

import { AgentMessage, UserMessage } from './MessageItem'
import Tooltip from '@/components/ui/tooltip'
import React, { type FC, memo, useEffect, useMemo } from 'react'
import { ToolCallProps, ReferenceData, Reference } from '@/types/os'

import Icon from '@/components/ui/icon'
import ChatBlankState from './ChatBlankState'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: ChatMessage[]
}

interface MessageWrapperProps {
  message: ChatMessage
  messageId: string
}

interface ReferenceProps {
  references: ReferenceData[]
}

interface ReferenceItemProps {
  reference: Reference
}

const ReferenceItem: FC<ReferenceItemProps> = ({ reference }) => (
  <div className="relative flex h-[63px] w-[190px] cursor-default flex-col justify-between overflow-hidden rounded-md bg-background-secondary p-3 transition-colors hover:bg-background-secondary/80">
    <p className="text-sm font-medium text-primary">{reference.name}</p>
    <p className="truncate text-xs text-primary/40">{reference.content}</p>
  </div>
)

const References: FC<ReferenceProps> = ({ references }) => (
  <div className="flex flex-col gap-4">
    {references.map((referenceData, index) => (
      <div
        key={`${referenceData.query}-${index}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap gap-3">
          {referenceData.references.map((reference, refIndex) => (
            <ReferenceItem
              key={`${reference.name}-${reference.meta_data.chunk}-${refIndex}`}
              reference={reference}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)

const ReasoningSummary: FC<{
  message: ChatMessage
  messageId: string
}> = ({ message, messageId }) => {
  const selectedReasoning = useStore((state) => state.selectedReasoning)
  const setSelectedReasoning = useStore((state) => state.setSelectedReasoning)
  const clearSelectedReasoning = useStore((state) => state.clearSelectedReasoning)

  const reasoningTrace = message.extra_data?.reasoning_trace
  const reasoningSteps = message.extra_data?.reasoning_steps

  const badges = useMemo(() => {
    if (reasoningTrace?.badges?.length) {
      return reasoningTrace.badges
    }
    if (!reasoningSteps) {
      return []
    }
    return reasoningSteps.map((step) => step.title).filter(Boolean)
  }, [reasoningSteps, reasoningTrace?.badges])

  const fallbackReasoningText = useMemo(() => {
    if (!reasoningSteps) {
      return undefined
    }
    return reasoningSteps
      .map((step, index) => {
        const segments = [`STEP ${index + 1}: ${step.title}`]
        if (step.reasoning) {
          segments.push(step.reasoning)
        }
        if (step.result) {
          segments.push(`Result: ${step.result}`)
        }
        if (step.next_action) {
          segments.push(`Next: ${step.next_action}`)
        }
        return segments.join('\n')
      })
      .join('\n\n')
  }, [reasoningSteps])

  const reasoningText = reasoningTrace?.raw ?? fallbackReasoningText ?? ''

  const isReasoningAvailable = badges.length > 0 || reasoningText.trim().length

  const isSelected = selectedReasoning?.messageId === messageId

  const badgesKey = badges.join('||')

  useEffect(() => {
    if (!isSelected) return
    if (!isReasoningAvailable) {
      clearSelectedReasoning()
      return
    }

    const trimmedReasoning = reasoningText.trim()
    const currentTraceComplete = reasoningTrace?.isComplete ?? true

    if (
      selectedReasoning &&
      selectedReasoning.messageId === messageId &&
      selectedReasoning.reasoning === trimmedReasoning &&
      selectedReasoning.isComplete === currentTraceComplete &&
      selectedReasoning.badges.join('||') === badgesKey
    ) {
      return
    }

    setSelectedReasoning({
      messageId,
      reasoning: trimmedReasoning,
      badges,
      isComplete: currentTraceComplete
    })
  }, [
    badges,
    badgesKey,
    clearSelectedReasoning,
    isReasoningAvailable,
    isSelected,
    messageId,
    reasoningText,
    reasoningTrace?.isComplete,
    selectedReasoning,
    setSelectedReasoning
  ])

  const handleBadgeClick = () => {
    if (!isReasoningAvailable) return
    if (isSelected) {
      clearSelectedReasoning()
      return
    }
    setSelectedReasoning({
      messageId,
      reasoning: reasoningText.trim(),
      badges,
      isComplete: reasoningTrace?.isComplete ?? true
    })
  }

  if (!isReasoningAvailable) {
    return null
  }

  return (
    <div className="flex items-start gap-4">
      <Tooltip
        delayDuration={0}
        content={<p className="text-accent">Reasoning</p>}
        side="top"
      >
        <Icon type="reasoning" size="sm" />
      </Tooltip>
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase text-secondary">
          {reasoningTrace?.isComplete === false
            ? 'Reasoning (in progress)'
            : 'Reasoning'}
        </p>
        <div className="flex flex-wrap gap-2">
          {badges.map((title, index) => (
            <button
              key={`${title}-${index}`}
              type="button"
              onClick={handleBadgeClick}
              aria-pressed={isSelected}
              className={cn(
                'rounded-full border border-border bg-background-secondary px-3 py-1 text-xs text-secondary transition-colors hover:bg-background-secondary/80',
                isSelected && 'border-accent bg-accent/80 text-primary'
              )}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const AgentMessageWrapper = ({ message, messageId }: MessageWrapperProps) => {
  return (
    <div className="flex flex-col gap-y-9">
      <ReasoningSummary message={message} messageId={messageId} />
      {message.extra_data?.references &&
        message.extra_data.references.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">References</p>}
              side="top"
            >
              <Icon type="references" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <References references={message.extra_data.references} />
            </div>
          </div>
        )}
      {message.tool_calls && message.tool_calls.length > 0 && (
        <div className="flex items-start gap-3">
          <Tooltip
            delayDuration={0}
            content={<p className="text-accent">Tool Calls</p>}
            side="top"
          >
            <Icon
              type="hammer"
              className="rounded-lg bg-background-secondary p-1"
              size="sm"
              color="secondary"
            />
          </Tooltip>

          <div className="flex flex-wrap gap-2">
            {message.tool_calls.map((toolCall, index) => (
              <ToolComponent
                key={
                  toolCall.tool_call_id ||
                  `${toolCall.tool_name}-${toolCall.created_at}-${index}`
                }
                tools={toolCall}
              />
            ))}
          </div>
        </div>
      )}
      <AgentMessage message={message} />
    </div>
  )
}
const ToolComponent = memo(({ tools }: ToolCallProps) => (
  <div className="cursor-default rounded-full bg-accent px-2 py-1.5 text-xs">
    <p className="font-dmmono uppercase text-primary/80">{tools.tool_name}</p>
  </div>
))
ToolComponent.displayName = 'ToolComponent'
const Messages = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return <ChatBlankState />
  }

  return (
    <>
      {messages.map((message, index) => {
        const key = `${message.role}-${message.created_at}-${index}`
        if (message.role === 'agent') {
          return (
            <AgentMessageWrapper
              key={key}
              message={message}
              messageId={key}
            />
          )
        }
        return <UserMessage key={key} message={message} />
      })}
    </>
  )
}

export default Messages
