import { useCallback } from "react";

import { APIRoutes } from "@/api/routes";

import useChatActions from "@/hooks/playground/useChatActions";
import { usePlaygroundStore } from "@/stores/PlaygroundStore";
import { RunEvent, type RunResponse } from "@/types/playground";
import { constructEndpointUrl } from "@/utils/playgroundUtils";
import useAIResponseStream from "../streaming/useAIResponseStream";
import { ToolCall } from "@/types/playground";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

/**
 * useAIChatStreamHandler is responsible for making API calls and handling the stream response.
 * For now, it only streams message content and updates the messages state.
 */
const useAIChatStreamHandler = () => {
  const setMessages = usePlaygroundStore((state) => state.setMessages);
  const setStreamingError = usePlaygroundStore(
    (state) => state.setStreamingError,
  );
  const { addMessage } = useChatActions();
  const [agentId] = useQueryState("agent");
  const selectedEndpoint = usePlaygroundStore(
    (state) => state.selectedEndpoint,
  );

  const { streamResponse } = useAIResponseStream();

  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {
      // Uncomment if you want to use streaming loading state later:
      // setIsStreaming(true)

      // Create FormData if input is a string
      const formData = input instanceof FormData ? input : new FormData();
      if (typeof input === "string") {
        formData.append("message", input);
      }

      // Remove the last two messages only if they were an errored pair
      setMessages((prevMessages) => {
        if (prevMessages.length >= 2) {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const secondLastMessage = prevMessages[prevMessages.length - 2];
          if (
            lastMessage.role === "agent" &&
            lastMessage.streamingError === true && // only remove if an error occurred
            secondLastMessage.role === "user"
          ) {
            return prevMessages.slice(0, -2);
          }
        }
        return prevMessages;
      });

      // Add user message
      addMessage({
        role: "user",
        content: formData.get("message") as string,
        created_at: Math.floor(Date.now() / 1000),
      });

      // Add an empty agent message placeholder with tool_calls array
      addMessage({
        role: "agent",
        content: "",
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000) + 1,
      });

      // Define variable to hold previous content for tool call diffing
      let lastContent = "";

      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint);

        if (!agentId) return;
        // Build URL with the agent id from the URL query parameter
        const playgroundRunUrl = APIRoutes.AgentRun(endpointUrl).replace(
          "{agent_id}",
          agentId,
        );

        // Append required field
        formData.append("stream", "true");

        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody: formData,
          onChunk: (chunk: RunResponse) => {
            if (chunk.event === RunEvent.RunResponse) {
              // Update the last (agent) message with new content and tool calls from the stream chunk
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (
                  lastMessage &&
                  lastMessage.role === "agent" &&
                  typeof chunk.content === "string"
                ) {
                  // Append only the new part of the content
                  const uniqueContent = chunk.content.replace(lastContent, "");
                  lastMessage.content += uniqueContent;
                  lastContent = chunk.content;

                  // Process tool calls from chunk (removing reasoning messages)
                  const toolCalls: ToolCall[] = [...(chunk.tools ?? [])];
                  if (toolCalls.length > 0) {
                    lastMessage.tool_calls = toolCalls;
                  }
                  if (chunk.extra_data?.reasoning_steps) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      reasoning_steps: chunk.extra_data.reasoning_steps,
                    };
                  }

                  lastMessage.created_at =
                    chunk.created_at ?? lastMessage.created_at;
                  //   if (chunk.extra_data?.reasoning_steps) {
                  //     lastMessage.extra_data = {
                  //       ...(lastMessage.extra_data || {}),
                  //       reasoning_steps: chunk.extra_data.reasoning_steps
                  //     }
                  //   }
                  //   if (chunk.extra_data?.references) {
                  //     lastMessage.extra_data = {
                  //       ...(lastMessage.extra_data || {}),
                  //       references: chunk.extra_data.references
                  //     }
                  //   }
                  if (chunk.images) {
                    lastMessage.images = chunk.images;
                  }
                  if (chunk.videos) {
                    lastMessage.videos = chunk.videos;
                  }
                  if (chunk.audio) {
                    lastMessage.audio = chunk.audio;
                  }
                } else if (
                  chunk.response_audio?.transcript &&
                  typeof chunk.response_audio?.transcript === "string"
                ) {
                  const transcript = chunk.response_audio.transcript;
                  lastMessage.response_audio = {
                    ...lastMessage.response_audio,
                    transcript:
                      lastMessage.response_audio?.transcript + transcript,
                  };
                }
                return newMessages;
              });
            } else if (chunk.event === RunEvent.RunCompleted) {
              // Final update on completion of the stream:
              setMessages((prevMessages) => {
                const newMessages = prevMessages.map((message, index) => {
                  if (
                    index === prevMessages.length - 1 &&
                    message.role === "agent"
                  ) {
                    let updatedContent: string;
                    if (typeof chunk.content === "string") {
                      updatedContent = chunk.content;
                    } else {
                      try {
                        updatedContent = JSON.stringify(chunk.content);
                      } catch {
                        updatedContent = "Error parsing response";
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
                      // audio: chunk.audio ?? message.audio,
                      response_audio: chunk.response_audio,
                      created_at: chunk.created_at ?? message.created_at,
                      extra_data: {
                        //     ...message.extra_data,
                        reasoning_steps:
                          chunk.extra_data?.reasoning_steps ??
                          message.extra_data?.reasoning_steps,
                        //     references:
                        //       chunk.extra_data?.references ??
                        //       message.extra_data?.references
                      },
                    };
                  }
                  return message;
                });
                return newMessages;
              });
            }
          },
          onError: (error) => {
            setMessages((prevMessages) => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === "agent") {
                lastMessage.streamingError = true;
              }
              return newMessages;
            });
            // Update global state to indicate a streaming error occurred
            setStreamingError(true);
            toast.error(
              `Error in streamResponse: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          },
          onComplete: () => {
            // Reset the global streaming error flag on successful completion
            setStreamingError(false);
          },
        });
      } catch {
      } finally {
        // Uncomment when adding streaming state updates
        // setIsStreaming(false)
      }
    },
    [
      // setIsStreaming, // not used for now
      setMessages,
      addMessage,
      selectedEndpoint,
      streamResponse,
      agentId,
      setStreamingError,
    ],
  );

  return { handleStreamResponse };
};

export default useAIChatStreamHandler;
