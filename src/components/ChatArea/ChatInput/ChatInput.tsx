"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ChatTextArea } from "./ChatTextArea";
import { Button } from "@/components/ui/button";
import { usePlaygroundStore } from "@/stores/PlaygroundStore";
import useAIChatStreamHandler from "@/hooks/playground/useAIStreamHandler";
import { SendIcon } from "lucide-react";
import { useQueryState } from "nuqs";

const ChatInput = () => {
  const { chatInputRef } = usePlaygroundStore();

  const { handleStreamResponse } = useAIChatStreamHandler();
  const [selectedAgent] = useQueryState("agent");
  const setStreamingError = usePlaygroundStore(
    (state) => state.setStreamingError,
  );
  const streamingError = usePlaygroundStore((state) => state.streamingError);
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;

    if (streamingError) {
      setStreamingError(false);
    }

    const currentMessage = inputMessage;
    setInputMessage("");

    try {
      await handleStreamResponse(currentMessage);
    } catch (error) {
      toast.error(
        `Error in handleSubmit: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const isDisabled = !selectedAgent;

  return (
    <div className="relative mx-auto flex w-full max-w-2xl justify-center items-center gap-x-2 mb-1 font-geist">
      <ChatTextArea
        placeholder={"Ask anything"}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="w-full border border-accent pr-10 text-sm focus:border-accent bg-primaryAccent text-primary"
        disabled={isDisabled}
        ref={chatInputRef}
      />
      <Button
        onClick={handleSubmit}
        disabled={isDisabled}
        size="icon"
        className="bg-primary text-primaryAccent p-5 rounded-xl"
      >
        <SendIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ChatInput;
