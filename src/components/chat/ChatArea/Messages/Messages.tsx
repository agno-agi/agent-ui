import type { ChatMessage } from '@/types/os'

import { AgentMessage, UserMessage } from './MessageItem'
import Tooltip from '@/components/ui/tooltip'
import { memo } from 'react'
import {
  ToolCallProps,
  ReasoningStepProps,
  ReasoningProps,
  ReferenceData,
  Reference
} from '@/types/os'
import React, { type FC, useState } from 'react'

import Icon from '@/components/ui/icon'
import ChatBlankState from './ChatBlankState'

interface MessageListProps {
  messages: ChatMessage[]
}

interface MessageWrapperProps {
  message: ChatMessage
  isLastMessage: boolean
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

const AgentMessageWrapper = ({ message }: MessageWrapperProps) => {
  return (
    <div className="flex flex-col gap-y-9">
      {message.extra_data?.reasoning_steps &&
        message.extra_data.reasoning_steps.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">Reasoning</p>}
              side="top"
            >
              <Icon type="reasoning" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase">Reasoning</p>
              <Reasonings reasoning={message.extra_data.reasoning_steps} />
            </div>
          </div>
        )}
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
const Reasoning: FC<ReasoningStepProps> = ({ index, stepTitle }) => (
  <div className="flex items-center gap-2 text-secondary">
    <div className="flex h-[20px] items-center rounded-md bg-background-secondary p-2">
      <p className="text-xs">STEP {index + 1}</p>
    </div>
    <p className="text-xs">{stepTitle}</p>
  </div>
)
const Reasonings: FC<ReasoningProps> = ({ reasoning }) => (
  <div className="flex flex-col items-start justify-center gap-2">
    {reasoning.map((title, index) => (
      <Reasoning
        key={`${title.title}-${title.action}-${index}`}
        stepTitle={title.title}
        index={index}
      />
    ))}
  </div>
)

const ToolComponent = memo(({ tools }: ToolCallProps) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="cursor-default rounded-lg bg-accent px-2 py-1.5 text-xs flex flex-col gap-1 min-w-[120px]">
      <button
        className="flex items-center gap-2 w-full text-left focus:outline-none"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        title={expanded ? 'Hide tool call details' : 'Show tool call details'}
      >
        <span className="font-dmmono uppercase text-primary/80">{tools.tool_name}</span>
        <span className="ml-auto">
          {expanded ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </span>
      </button>
      {expanded && tools.tool_args && Object.keys(tools.tool_args).length > 0 && (
        <div className="mt-2 bg-background-secondary/60 rounded p-2 text-xs text-primary/70 border border-accent/30">
          <span className="font-semibold">Params:</span>
          <ul className="list-disc ml-4 mt-1">
            {Object.entries(tools.tool_args).map(([key, value]) => (
              <li key={key} className="mb-1">
                <span className="font-mono text-primary/90">{key}</span>
                {': '}
                {typeof value === 'object' && value !== null ? (
                  <pre className="bg-background-secondary/80 rounded p-1 mt-1 text-[11px] overflow-x-auto border border-accent/20">
                    <code>{JSON.stringify(value, null, 2)}</code>
                  </pre>
                ) : (
                  <span className="text-primary/80">{String(value)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
ToolComponent.displayName = 'ToolComponent'
const Messages = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return <ChatBlankState />
  }

  return (
    <>
      {messages.map((message, index) => {
        const key = `${message.role}-${message.created_at}-${index}`
        const isLastMessage = index === messages.length - 1

        if (message.role === 'agent') {
          return (
            <AgentMessageWrapper
              key={key}
              message={message}
              isLastMessage={isLastMessage}
            />
          )
        }
        return <UserMessage key={key} message={message} />
      })}
    </>
  )
}

export default Messages
