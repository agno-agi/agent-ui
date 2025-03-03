"use client";

import { useChatStore } from "@/stores/ChatStore";
import MessageList from "./Messages/MessageList";
import ScrollToBottomButton from "@/components/ChatArea/ScrollToBottom";
import { StickToBottom } from "use-stick-to-bottom";

const ChatArea = () => {
  const { messages } = useChatStore();

  return (
    <StickToBottom
      className="relative mb-4 flex max-h-[calc(100vh-64px)] min-h-0 flex-grow flex-col"
      resize="smooth"
      initial="smooth"
    >
      {" "}
      <StickToBottom.Content className="flex min-h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-2xl space-y-9 px-4 pb-4">
          <MessageList messages={messages} />
        </div>
      </StickToBottom.Content>
      <ScrollToBottomButton />
    </StickToBottom>
  );
};

export default ChatArea;
