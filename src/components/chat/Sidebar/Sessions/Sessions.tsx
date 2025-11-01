'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryState } from 'nuqs'

import { useStore } from '@/store'
import useSessionLoader from '@/hooks/useSessionLoader'

import SessionItem from './SessionItem'
import SessionBlankState from './SessionBlankState'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonListProps {
  skeletonCount: number
}
const SkeletonList: FC<SkeletonListProps> = ({ skeletonCount }) => {
  const list = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount]
  )

  return list.map((k, idx) => (
    <Skeleton
      key={k}
      className={cn(
        'mb-1 h-11 rounded-lg px-3 py-2',
        idx > 0 && 'bg-background-secondary'
      )}
    />
  ))
}

const Sessions = () => {
  const [agentId] = useQueryState('agent', {
    parse: (v: string | null) => v || undefined,
    history: 'push'
  })
  const [teamId] = useQueryState('team')
  const [sessionId, setSessionId] = useQueryState('session')
  const [dbId] = useQueryState('db_id')
  const [userId] = useQueryState('user_id')

  const {
    selectedEndpoint,
    mode,
    isEndpointActive,
    isEndpointLoading,
    hydrated,
    sessionsData,
    setSessionsData,
    isSessionsLoading,
    agents
  } = useStore()

  const [isScrolling, setIsScrolling] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )

  const { getSessions, getSession } = useSessionLoader()
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleScroll = () => {
    setIsScrolling(true)

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }

  // Cleanup the scroll timeout when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Track if we're currently loading to prevent duplicate requests
  const loadingSessionRef = useRef<string | null>(null)
  // Track recently created sessions to avoid trying to fetch them immediately
  // When a session is created via streaming, mark it so we don't try to fetch it right away
  const recentlyCreatedSessionsRef = useRef<Set<string>>(new Set())
  // Track initial session load attempts from URL (on page reload) to suppress errors
  const initialLoadAttemptsRef = useRef<Set<string>>(new Set())
  
  const { isStreaming } = useStore()
  
  // Listen for session creation events to mark sessions as recently created
  useEffect(() => {
    if (sessionId && isStreaming) {
      // When streaming starts with a session ID, mark it as recently created
      recentlyCreatedSessionsRef.current.add(sessionId)
      // Remove from set after streaming completes (allow 5 seconds after streaming ends)
      const timeout = setTimeout(() => {
        recentlyCreatedSessionsRef.current.delete(sessionId)
      }, 8000) // Give extra time after streaming
      
      return () => clearTimeout(timeout)
    }
  }, [sessionId, isStreaming])
  
  useEffect(() => {
    if (!hydrated || !sessionId || !selectedEndpoint) return
    if (isEndpointLoading) return // Wait for initialization to complete
    
    // Don't try to fetch session if we're currently streaming (session is being created)
    // New sessions might not be immediately available via GET endpoint until streaming completes
    if (isStreaming) {
      return
    }
    
    // Don't fetch sessions that were recently created (within last 10 seconds)
    // They might not be immediately available via GET endpoint
    if (recentlyCreatedSessionsRef.current.has(sessionId)) {
      return
    }
    
    // Prevent duplicate fetches for the same session
    if (loadingSessionRef.current === sessionId) {
      return
    }
    
    // When user_id is present, use agent from store if not in URL
    let effectiveAgentId = agentId
    let effectiveMode = mode
    
    if (userId && !effectiveAgentId) {
      // Wait for agents to load when user_id is present
      if (agents.length === 0) {
        return
      }
      effectiveAgentId = agents[0].id || (agents[0] as any).agent_id
      effectiveMode = 'agent'
    }
    
    // Only require agentId/teamId when user_id is not present
    // When user_id is present, we can use the agent from store (already handled above)
    if (!userId && !(effectiveAgentId || teamId)) return
    
    const entityType = effectiveAgentId ? 'agent' : 'team'
    
    // Check if this is the initial load attempt for this session (from URL on page reload)
    const isInitialLoad = !initialLoadAttemptsRef.current.has(sessionId)
    if (isInitialLoad) {
      initialLoadAttemptsRef.current.add(sessionId)
    }
    
    loadingSessionRef.current = sessionId
    // Use async function to properly handle errors and prevent React error bubble
    ;(async () => {
      try {
        await getSession({ 
          entityType, 
          agentId: effectiveAgentId, 
          teamId, 
          dbId: dbId || '' 
        }, sessionId, {
          // Suppress errors on initial load from URL (page reload with stale session ID)
          suppressErrors: isInitialLoad
        })
      } catch (error) {
        // Error is already handled and displayed via toast in getSession (unless suppressed)
        // Just clear session from URL if it's a "not found" error to prevent repeated errors on refresh
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
        const isSessionNotFound = errorMessage.includes('session not found') || 
                                  (errorMessage.includes('not found') && errorMessage.includes('404'))
        
        if (isSessionNotFound) {
          // If session not found and we're streaming, it might be a new session that's not ready yet
          // Don't clear from URL yet, but mark it as recently created
          if (isStreaming) {
            recentlyCreatedSessionsRef.current.add(sessionId)
            // Clear from set after 10 seconds
            setTimeout(() => {
              recentlyCreatedSessionsRef.current.delete(sessionId)
            }, 10000)
          } else {
            // Silently clear from URL if session is truly not found (not during streaming)
            // This prevents repeated errors on page reload with stale session IDs
            setSessionId(null)
          }
        }
        // Silently handle the error - it's already shown to user via toast (unless suppressed)
      } finally {
        // Clear loading ref after a delay to allow for retries
        setTimeout(() => {
          if (loadingSessionRef.current === sessionId) {
            loadingSessionRef.current = null
          }
        }, 1000)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, sessionId, selectedEndpoint, agentId, teamId, dbId, userId, agents, mode, isEndpointLoading, isStreaming, getSession, setSessionId])

  useEffect(() => {
    if (!selectedEndpoint || isEndpointLoading || !hydrated) return
    
    // When user_id is present, use agent from store if not in URL
    let effectiveAgentId = agentId
    let effectiveMode = mode
    
    if (userId && !effectiveAgentId && agents.length > 0) {
      effectiveAgentId = agents[0].id || (agents[0] as any).agent_id
      // Ensure mode is 'agent' when using first agent from store
      effectiveMode = 'agent'
    }
    
    // When user_id is present, we can load sessions with just agentId (dbId optional for playground)
    // Otherwise, require agentId/teamId and dbId
    const canLoadSessions = userId 
      ? (effectiveAgentId || teamId) 
      : (effectiveAgentId || teamId || dbId)
    
    
    if (!canLoadSessions) {
      // Don't clear sessions if we're just waiting for agent to load (when user_id is present)
      if (!userId || agents.length === 0) {
        setSessionsData([])
      }
      return
    }
    
    // Only require endpoint to be active when user_id is not present
    // When user_id is present, playground backend handles things differently
    if (!userId && !isEndpointActive) {
      return
    }
    
    // Don't clear sessions before loading - let getSessions handle it
    getSessions({
      entityType: effectiveMode || mode || 'agent',
      agentId: effectiveAgentId,
      teamId,
      dbId: dbId || '' // Allow empty dbId when user_id is present
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedEndpoint,
    agentId,
    teamId,
    mode,
    isEndpointLoading,
    isEndpointActive,
    getSessions,
    dbId,
    userId,
    agents,
    hydrated
  ])

  useEffect(() => {
    if (sessionId) setSelectedSessionId(sessionId)
  }, [sessionId])

  const handleSessionClick = useCallback(
    (id: string) => () => setSelectedSessionId(id),
    []
  )

  if (isSessionsLoading || isEndpointLoading) {
    return (
      <div className="w-full">
        <div className="mb-2 text-xs font-medium uppercase">Sessions</div>
        <div className="mt-4 h-[calc(100vh-325px)] w-full overflow-y-auto">
          <SkeletonList skeletonCount={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-2 w-full text-xs font-medium uppercase">Sesijos</div>
      <div
        className={`h-[calc(100vh-345px)] overflow-y-auto font-geist transition-all duration-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:transition-opacity [&::-webkit-scrollbar]:duration-300 ${
          isScrolling
            ? '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-background [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:opacity-0'
            : '[&::-webkit-scrollbar]:opacity-100'
        }`}
        onScroll={handleScroll}
        onMouseOver={() => setIsScrolling(true)}
        onMouseLeave={handleScroll}
      >
        {isSessionsLoading ? (
          <SkeletonList skeletonCount={3} />
        ) : sessionsData && sessionsData.length > 0 ? (
          <div className="flex flex-col gap-y-1 pr-1">
            {sessionsData.map((entry, idx) => (
              <SessionItem
                key={`${entry?.session_id}-${idx}`}
                currentSessionId={selectedSessionId}
                isSelected={selectedSessionId === entry?.session_id}
                onSessionClick={handleSessionClick(entry?.session_id)}
                session_name={entry?.session_name ?? '-'}
                session_id={entry?.session_id}
                created_at={entry?.created_at}
              />
            ))}
          </div>
        ) : (
          <SessionBlankState />
        )}
      </div>
    </div>
  )
}

export default Sessions
