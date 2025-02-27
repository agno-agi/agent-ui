"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { AgentSelector } from "@/components/AgentSelector";
import useChatActions from "@/hooks/playground/useChatActions";
import { usePlaygroundStore } from "@/stores/PlaygroundStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getProviderIcon } from "@/utils/modelProvider";

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
  const { selectedEndpoint, isEndpointActive, setSelectedEndpoint } =
    usePlaygroundStore();
  const { loadData } = useChatActions();
  const [isEditing, setIsEditing] = useState(false);
  const [endpointValue, setEndpointValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setEndpointValue(selectedEndpoint);
    setIsMounted(true);
  }, [selectedEndpoint]);

  const getStatusColor = (isActive: boolean) =>
    isActive ? "bg-positive" : "bg-destructive";

  const handleSave = () => {
    setSelectedEndpoint(endpointValue);
    setIsEditing(false);
    setIsHovering(false);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="uppercase text-xs font-medium text-primary">Endpoint</div>
      {isEditing ? (
        <div className="flex w-full gap-1 items-center">
          <input
            type="text"
            value={endpointValue}
            onChange={(e) => setEndpointValue(e.target.value)}
            className="flex w-full items-center border-primary/15 border bg-accent rounded-xl p-3 h-9 text-xs font-medium text-muted"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:bg-transparent hover:cursor-pointer"
          >
            <Icon type="save" size="xs" />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center">
          <motion.div
            className="flex w-full items-center justify-between border-primary/15 border bg-accent rounded-xl uppercase p-3 h-9 relative cursor-pointer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsEditing(true)}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <AnimatePresence mode="wait">
              {isHovering ? (
                <motion.div
                  key="endpoint-display-hover"
                  className="flex w-full items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium text-primary flex items-center gap-2">
                    <Icon type="edit" size="xxs" /> EDIT ENDPOINT
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="endpoint-display"
                  className="flex w-full items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium text-muted">
                    {isMounted ? selectedEndpoint : "http://localhost:7777"}
                  </p>
                  <div
                    className={`size-2 rounded-full ${getStatusColor(isEndpointActive)}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            className="hover:bg-transparent hover:cursor-pointer"
          >
            <Icon type="refresh" size="xs" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { clearChat, loadData } = useChatActions();
  const { messages, selectedEndpoint, isEndpointActive, selectedModel } =
    usePlaygroundStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
            {isMounted && selectedEndpoint && (
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
                    {selectedModel && <ModelDisplay model={selectedModel} />}
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
