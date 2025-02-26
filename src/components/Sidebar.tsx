"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { AgentSelector } from "@/components/AgentSelector";
import useChatActions from "@/hooks/playground/useChatActions";
import { usePlaygroundStore } from "@/stores/PlaygroundStore";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Icon from "@/components/ui/icon";
import { getProviderIcon } from "@/utils/modelProvider";
import { motion, AnimatePresence } from "framer-motion";

const SidebarHeader = () => (
  <div className="flex items-center gap-2">
    <Icon type="agno" size="xs" />
    <span className="text-white text-xs font-medium uppercase">Agent UI</span>
  </div>
);

const NewChatButton = ({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="bg-primary h-9 text-background hover:bg-primary/80 rounded-xl text-xs font-medium w-full"
  >
    <PlusIcon />
    <span className="uppercase">New Chat</span>
  </Button>
);

const ModelDisplay = ({ model }: { model: string }) => (
  <div className="w-full border-primary/15 flex items-center gap-3 h-9 border text-muted text-xs font-medium bg-accent rounded-xl uppercase p-3">
    {(() => {
      const icon = getProviderIcon(model);
      return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null;
    })()}
    {model}
  </div>
);

const Endpoint = () => {
  const { selectedEndpoint, isEndpointActive } = usePlaygroundStore();
  const { loadData } = useChatActions();

  const getStatusColor = (isActive: boolean) =>
    isActive ? "bg-positive" : "bg-destructive";

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="uppercase text-xs font-medium text-primary">Endpoint</div>
      <div className="flex w-full gap-1 items-center">
        <div className="flex w-full items-center justify-between border-primary/15 border bg-accent rounded-xl uppercase p-3 h-9">
          <p className="text-xs font-medium text-muted "> {selectedEndpoint}</p>
          <div
            className={`size-2 rounded-full ${getStatusColor(isEndpointActive)}`}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadData}
          className="hover:bg-transparent hover:cursor-pointer"
        >
          <RefreshCw size={16} />
        </Button>
      </div>
    </div>
  );
};

// Main Sidebar component
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { clearChat, loadData } = useChatActions();
  const { messages, selectedEndpoint, isEndpointActive } = usePlaygroundStore();
  const [model] = useQueryState("model");

  useEffect(() => {
    if (selectedEndpoint) {
      loadData();
    }
  }, [selectedEndpoint, loadData]);

  return (
    <motion.aside
      className="h-screen font-dmmono relative py-3 pl-2 pr-1 flex flex-col gap-3 shrink-0 grow-0 overflow-hidden"
      initial={{ width: isCollapsed ? "2.5rem" : "16rem" }}
      animate={{ width: isCollapsed ? "2.5rem" : "16rem" }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-2 right-2 p-1 z-10"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`transform ${isCollapsed ? "rotate-180" : "rotate-0"}`}
        />
      </motion.button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="space-y-5 w-60"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SidebarHeader />
            <NewChatButton
              disabled={messages.length === 0}
              onClick={clearChat}
            />
            {selectedEndpoint && (
              <>
                <Endpoint />
                {isEndpointActive && (
                  <motion.div
                    className="flex flex-col items-start gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <div className="uppercase text-xs font-medium text-primary">
                      Agent
                    </div>
                    <AgentSelector />
                    {model && <ModelDisplay model={model} />}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
