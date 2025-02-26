import { create } from "zustand";

import {
  //   type HistoryEntry,
  type PlaygroundChatMessage,
} from "@/types/playground";

interface Agent {
  value: string;
  label: string;
  model: {
    provider: string;
  };
}

interface PlaygroundStore {
  streamingError: boolean;
  setStreamingError: (streamingError: boolean) => void;
  storage: boolean;
  setStorage: (storage: boolean) => void;
  endpoints: {
    endpoint: string;
    id_playground_endpoint: string;
  }[];
  setEndpoints: (
    endpoints: {
      endpoint: string;
      id_playground_endpoint: string;
    }[],
  ) => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
  historyLoading: boolean;
  setHistoryLoading: (loading: boolean) => void;
  isEndpointActive: boolean;
  setIsEndpointActive: (isActive: boolean) => void;
  endpointLoading: boolean;
  setEndpointLoading: (loading: boolean) => void;

  messages: PlaygroundChatMessage[];
  setMessages: (
    messages:
      | PlaygroundChatMessage[]
      | ((prevMessages: PlaygroundChatMessage[]) => PlaygroundChatMessage[]),
  ) => void;

  //   historyData: HistoryEntry[];
  //   setHistoryData: (
  //     historyData:
  //       | HistoryEntry[]
  //       | ((prevHistoryData: HistoryEntry[]) => HistoryEntry[]),
  //   ) => void;
  //   isMonitoring: boolean;
  //   setIsMonitoring: (isMonitoring: boolean) => void;

  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  selectedEndpoint: string;
  setSelectedEndpoint: (selectedEndpoint: string) => void;

  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  streamingError: false,
  setStreamingError: (streamingError) => set(() => ({ streamingError })),
  storage: false,
  setStorage: (storage) => set(() => ({ storage })),
  endpoints: [],
  setEndpoints: (endpoints) => set(() => ({ endpoints })),
  isStreaming: false,
  setIsStreaming: (isStreaming) => set(() => ({ isStreaming })),
  isSidebarCollapsed: true,
  setIsSidebarCollapsed: (isSidebarCollapsed) =>
    set(() => ({ isSidebarCollapsed })),
  historyLoading: false,
  setHistoryLoading: (loading) => set(() => ({ historyLoading: loading })),
  isEndpointActive: false,
  setIsEndpointActive: (isActive) =>
    set(() => ({ isEndpointActive: isActive })),
  endpointLoading: true,
  setEndpointLoading: (loading) => set(() => ({ endpointLoading: loading })),

  messages: [],
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function" ? messages(state.messages) : messages,
    })),

  //   historyData: [],
  //   setHistoryData: (historyData) =>
  //     set((state) => ({
  //       historyData:
  //         typeof historyData === "function"
  //           ? historyData(state.historyData)
  //           : historyData,
  //     })),

  //   isMonitoring: true,
  //   setIsMonitoring: (isMonitoring) => set(() => ({ isMonitoring })),

  chatInputRef: { current: null },
  selectedEndpoint: process.env.NEXT_PUBLIC_BASE_URL || "",
  setSelectedEndpoint: (selectedEndpoint) => set(() => ({ selectedEndpoint })),

  agents: [],
  setAgents: (agents) => set({ agents }),
}));
