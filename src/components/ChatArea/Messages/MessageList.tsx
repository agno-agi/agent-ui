import type { PlaygroundChatMessage } from "@/types/playground";

import { AgentMessage, UserMessage } from "./Messages";
import Tooltip from "@/components/common/Tooltip";
import { memo } from "react";
import {
  ToolCallProps,
  ReasoningStepProps,
  ReasoningProps,
} from "@/types/playground";
import React, { type FC } from "react";
import { ChatBlankState } from "./ChatBlankState";
import Icon from "@/components/ui/icon";

interface MessageListProps {
  messages: PlaygroundChatMessage[];
}

interface MessageWrapperProps {
  message: PlaygroundChatMessage;
  isLastMessage: boolean;
}

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
              <Icon type="brain-circuit" className="h-5 w-5" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase">Reasoning</p>
              <Reasonings reasoning={message.extra_data.reasoning_steps} />
            </div>
          </div>
        )}
      {message.tool_calls && message.tool_calls.length > 0 && (
        <div className="flex items-center gap-3">
          <Tooltip
            delayDuration={0}
            content={<p className="text-accent">Tool Calls</p>}
            side="top"
            className="bg-background p-1 border border-border rounded-lg"
          >
            <Icon type="hammer" size='xs' color="primary/80" />
          </Tooltip>

          <div className="flex flex-wrap gap-2">
            {message.tool_calls.map((toolCall) => (
              <ToolComponent
                key={
                  toolCall.tool_call_id ||
                  `${toolCall.tool_name}-${toolCall.created_at}`
                }
                tools={toolCall}
              />
            ))}
          </div>
        </div>
      )}
      <AgentMessage message={message} />
    </div>
  );
};
const Reasoning: FC<ReasoningStepProps> = ({ index, stepTitle }) => (
  <div className="flex items-center gap-2 text-secondary">
    <div className="flex h-[20px] items-center rounded-sm bg-background p-2">
      <p className="text-xs">STEP {index + 1}</p>
    </div>
    <p className="text-xs">{stepTitle}</p>
  </div>
);
const Reasonings: FC<ReasoningProps> = ({ reasoning }) => (
  <div className="flex flex-col items-start justify-center gap-2">
    {reasoning.map((title, index) => (
      <Reasoning
        key={`${title.title}-${title.action}`}
        stepTitle={title.title}
        index={index}
      />
    ))}
  </div>
);

export const ToolComponent = memo(({ tools }: ToolCallProps) => (
  <div className="cursor-default rounded-full bg-accent px-2  py-1.5 text-xs">
    <p className=" text-primary/80">{tools.tool_name}</p>
  </div>
));

ToolComponent.displayName = "ToolComponent";

const MessageList = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return <ChatBlankState />;
  }

  return (
    <>
      {messages.map((message, index) => {
        const key = `${message.role}-${message.created_at}-${index}`;
        const isLastMessage = index === messages.length - 1;

        if (message.role === "agent") {
          return (
            <AgentMessageWrapper
              key={key}
              message={message}
              isLastMessage={isLastMessage}
            />
          );
        }
        return <UserMessage key={key} message={message} />;
      })}
    </>
  );
};

export default MessageList;
