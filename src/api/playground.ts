import { toast } from "sonner";

import { APIRoutes } from "./routes";

import { Agent, ComboboxAgent } from "@/types/chat";

// Define a local type to shape the agent data for the combobox.

export const getPlaygroundAgentsAPI = async (
  endpoint: string,
): Promise<ComboboxAgent[]> => {
  const url = APIRoutes.GetPlaygroundAgents(endpoint);
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    // Transform the API response into the expected shape.
    const agents: ComboboxAgent[] = data.map((item: Agent) => ({
      value: item.agent_id || "",
      label: item.name || "",
      model: item.model || "",
    }));
    return agents;
  } catch {
    toast.error("Error fetching playground agents");
    return [];
  }
};

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
  const response = await fetch(APIRoutes.PlaygroundStatus(base), {
    method: "GET",
  });
  return response.status;
};
