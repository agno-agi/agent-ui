"use client";
import { Button } from "../ui/button";
import Icon from "../ui/icon";
import useChatActions from "@/hooks/playground/useChatActions";
import { useChatStore } from "@/stores/ChatStore";

function NewChatButton() {
  const { clearChat } = useChatActions();
  const { messages } = useChatStore();
  return (
    <Button
      className="z-10 bg-brand hover:bg-brand/80 text-primary font-bold py-2 px-4 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={clearChat}
      disabled={messages.length === 0}
    >
      <div className="flex items-center gap-2">
        <p>New Chat</p>{" "}
        <Icon type="plus-icon" size="xs" className="text-background" />
      </div>
    </Button>
  );
}

export default NewChatButton;
