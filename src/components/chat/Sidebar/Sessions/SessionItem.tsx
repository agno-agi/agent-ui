import { useQueryState } from 'nuqs'
import { SessionEntry } from '@/types/os'
import { Button } from '../../../ui/button'
import useSessionLoader from '@/hooks/useSessionLoader'
import { deleteSessionAPI } from '@/api/os'
import { useStore } from '@/store'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'
import { useState } from 'react'
import DeleteSessionModal from './DeleteSessionModal'
import useChatActions from '@/hooks/useChatActions'
import { truncateText, cn } from '@/lib/utils'
import { getUserId } from '@/utils/user'

type SessionItemProps = SessionEntry & {
  isSelected: boolean
  currentSessionId: string | null
  onSessionClick: () => void
}

const formatSessionTitle = (session_name: string | null | undefined, created_at?: number): string => {
  // Priority 1: Use LLM-generated session name from Agno backend (via enable_session_summaries)
  // Agno generates these asynchronously, so they may not be available immediately
  if (session_name && session_name.trim() && session_name !== '-') {
    return session_name
  }
  
  // Priority 2: Temporary fallback - show relative date while waiting for LLM-generated title
  // This is only used when the backend hasn't generated a summary yet
  // Once Agno's enable_session_summaries generates the title, it will replace this on next refresh
  if (created_at) {
    const date = new Date(created_at * 1000) // created_at is in seconds
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    // Show relative time for recent sessions
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    // For older sessions, show formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }
  
  // Final fallback
  return 'Untitled'
}

const SessionItem = ({
  session_name: title,
  session_id,
  isSelected,
  currentSessionId,
  created_at,
  onSessionClick
}: SessionItemProps) => {
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [dbId] = useQueryState('db_id')
  const [, setSessionId] = useQueryState('session')
  const authToken = useStore((state) => state.authToken)
  const { getSession } = useSessionLoader()
  const { selectedEndpoint, sessionsData, setSessionsData, mode, agents } = useStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { clearChat } = useChatActions()
  
  // When user_id is present, use agent from store if not in URL
  const userId = typeof window !== 'undefined' ? getUserId() : null
  const effectiveAgentId = agentId || (userId && agents.length > 0 ? (agents[0].id || (agents[0] as any).agent_id) : null)

  const handleGetSession = async () => {
    // When user_id is present, agentId from store is sufficient
    if (!userId && !(effectiveAgentId || teamId || dbId)) return

    onSessionClick()
    await getSession(
      {
        entityType: mode,
        agentId: effectiveAgentId,
        teamId,
        dbId: dbId ?? ''
      },
      session_id
    )
    setSessionId(session_id)
  }

  const handleDeleteSession = async () => {
    // When user_id is present, agentId from store is sufficient
    if (!userId && !(effectiveAgentId || teamId || dbId)) return
    setIsDeleting(true)
    try {
      const response = await deleteSessionAPI(
        selectedEndpoint,
        dbId ?? '',
        session_id,
        authToken,
        effectiveAgentId || undefined // Pass agentId for playground endpoints
      )

      if (response?.ok && sessionsData) {
        setSessionsData(sessionsData.filter((s) => s.session_id !== session_id))
        // If the deleted session was the active one, clear the chat
        if (currentSessionId === session_id) {
          setSessionId(null)
          clearChat()
        }
        toast.success('Sesija ištrinta')
      } else {
        let errorMsg = ''
        try {
          const errorText = await response?.text()
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText)
              errorMsg = errorJson.detail || errorJson.message || errorText
            } catch {
              errorMsg = errorText
            }
          }
        } catch {
          // If we can't read the error, use status text
        }
        
        const statusText = response?.statusText || 'Unknown error'
        const displayError = errorMsg || statusText
        toast.error(`Failed to delete session: ${displayError}`)
      }
    } catch (error) {
      toast.error(
        `Failed to delete session: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsDeleteModalOpen(false)
      setIsDeleting(false)
    }
  }
  return (
    <>
      <div
        className={cn(
          'group flex h-11 w-full items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200',
          isSelected
            ? 'cursor-default bg-primary/10'
            : 'cursor-pointer bg-background-secondary hover:bg-background-secondary/80'
        )}
        onClick={handleGetSession}
      >
        <div className="flex flex-col gap-1">
          <h4
            className={cn('text-sm font-medium', isSelected && 'text-primary')}
          >
            {truncateText(formatSessionTitle(title, created_at), 20)}
          </h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="transform opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteModalOpen(true)
          }}
        >
          <Icon type="trash" size="xs" />
        </Button>
      </div>
      <DeleteSessionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteSession}
        isDeleting={isDeleting}
      />
    </>
  )
}

export default SessionItem
