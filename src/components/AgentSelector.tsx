"use client";

import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useChatStore } from "@/stores/ChatStore";
import { useQueryState } from "nuqs";
import Icon from "@/components/ui/icon";
import { useEffect } from "react";
import useChatActions from "@/hooks/playground/useChatActions";

export function AgentSelector() {
  const { agents, setMessages, setSelectedModel } = useChatStore();
  const { focusChatInput } = useChatActions();
  const [agentId, setAgentId] = useQueryState("agent", {
    parse: (value) => value || undefined,
    history: "push",
  });

  // Set the model when the component mounts if an agent is already selected
  useEffect(() => {
    if (agentId && agents.length > 0) {
      const agent = agents.find((agent) => agent.value === agentId);
      if (agent) {
        setSelectedModel(agent.model.provider || "");
        focusChatInputTimeout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, agents, setSelectedModel]);

  const focusChatInputTimeout = () => {
    setTimeout(() => {
      requestAnimationFrame(() => focusChatInput());
    }, 0);
  };
  const handleOnValueChange = (value: string) => {
    const newAgent = value === agentId ? "" : value;
    setSelectedModel(
      agents.find((agent) => agent.value === newAgent)?.model.provider || "",
    );
    setAgentId(newAgent);
    setMessages([]);
    focusChatInputTimeout();
  };

  return (
    <Select
      value={agentId || ""}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="w-full h-9 border-primary/15 border text-xs font-medium bg-primaryAccent rounded-xl uppercase">
        <SelectValue placeholder="Select Agent" />
      </SelectTrigger>
      <SelectContent className="shadow-lg border-none bg-primaryAccent font-dmmono">
        {agents.map((agent, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${agent.value}-${index}`}
            value={agent.value}
          >
            <div className="flex items-center gap-3 uppercase text-xs font-medium">
              <Icon type={"agent"} size="xs" />
              {agent.label}
            </div>
          </SelectItem>
        ))}
        {agents.length === 0 && (
          <SelectItem
            value="no-agents"
            className="text-center cursor-not-allowed select-none"
          >
            No agents found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
