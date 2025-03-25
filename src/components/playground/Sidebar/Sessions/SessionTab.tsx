"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { usePlaygroundStore } from "@/store";
import { useQueryState } from "nuqs";
import { SessionItem } from "./SessionItem";
import SessionBlankState from "./SessionBlankState";
import useSessionLoader from "@/hooks/useSessionLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FC } from "react";
import useChatActions from "@/hooks/useChatActions";

interface SkeletonListProps {
  skeletonCount: number;
}

const SkeletonList: FC<SkeletonListProps> = ({ skeletonCount }) => {
  const skeletons = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount],
  );

  return skeletons.map((skeleton, index) => (
    <Skeleton
      key={skeleton}
      className={cn("mx-3 mb-2 h-10", index > 0 && "bg-background-secondary")}
    />
  ));
};

dayjs.extend(utc);

const formatDate = (
  timestamp: number,
  format: "natural" | "full" = "full",
): string => {
  const date = dayjs.unix(timestamp).utc();
  return format === "natural"
    ? date.format("HH:mm")
    : date.format("YYYY-MM-DD HH:mm:ss");
};

const Sessions = () => {
  const [agentId] = useQueryState("agent", {
    parse: (value) => value || undefined,
    history: "push",
  });
  const [sessionId] = useQueryState("session");
  const { selectedEndpoint, isEndpointActive, isEndpointLoading, historyData } =
    usePlaygroundStore();
  const [isScrolling, setIsScrolling] = useState(false);
  const { loadSession } = useSessionLoader();
  const { loadHistory } = useChatActions();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(false);

  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1500);
  };

  // Cleanup the scroll timeout when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Load a session on render if a session id exists in url
  useEffect(() => {
    if (sessionId && agentId && selectedEndpoint) {
      loadSession(sessionId, agentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEndpoint || !agentId) return;
    try {
      setIsSessionsLoading(true);
      loadHistory(agentId);
    } finally {
      setIsSessionsLoading(false);
    }
  }, [selectedEndpoint, agentId, loadHistory]);

  const formattedHistory = useMemo(() => {
    if (!historyData || !Array.isArray(historyData)) return [];

    return historyData.map((entry) => ({
      ...entry,
      created_at: entry.created_at,
      formatted_time: formatDate(entry.created_at, "natural"),
    }));
  }, [historyData]);

  if (isSessionsLoading || isEndpointLoading)
    return (
      <div className="mt-4 h-[calc(100vh-325px)] overflow-y-auto">
        <SkeletonList skeletonCount={15} />
      </div>
    );

  return (
    <div>
      <div className="text-xs font-medium uppercase mb-2">Sessions</div>
      <div
        className={`h-[calc(100vh-345px)] overflow-y-auto transition-all duration-300 font-geist [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:transition-opacity [&::-webkit-scrollbar]:duration-300
        ${isScrolling ? "[&::-webkit-scrollbar]:opacity-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-background" : "[&::-webkit-scrollbar]:opacity-100"}`}
        onScroll={handleScroll}
        onMouseOver={() => setIsScrolling(true)}
        onMouseLeave={handleScroll}
      >
        {!isEndpointActive ||
        (!isSessionsLoading && (!historyData || historyData.length === 0)) ? (
          <SessionBlankState />
        ) : (
          <div className="flex flex-col gap-y-1 pr-1">
            {[...formattedHistory, ...formattedHistory, ...formattedHistory,...formattedHistory].map((entry) => (
              <SessionItem key={entry.session_id} {...entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
