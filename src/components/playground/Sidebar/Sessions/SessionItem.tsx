import { useQueryState } from 'nuqs'
import { SessionEntry } from '@/types/playground'
import { Button } from '../../../ui/button'
import useSessionLoader from '@/hooks/useSessionLoader'
import Icon from '@/components/ui/icon'
import { useState } from 'react'
import DeleteSessionModal from './DeleteSessionModal'
import { truncateText, cn } from '@/lib/utils'

type SessionItemProps = SessionEntry & {
  isSelected: boolean
  onSessionClick: () => void
}
const SessionItem = ({
  title,
  session_id,
  isSelected,
  onSessionClick
}: SessionItemProps) => {
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [workflowId] = useQueryState('workflow')
  const { getSession } = useSessionLoader()
  const [, setSessionId] = useQueryState('session')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleGetSession = async () => {
    if (agentId || teamId || workflowId) {
      onSessionClick()
      await getSession(session_id, agentId, teamId, workflowId)
      setSessionId(session_id)
    }
  }

  const handleDeleteSession = async () => {
    // if (agentId || teamId || workflowId) {
    //   try {
    //     let response;
    //     if (workflowId) {
    //       response = await deletePlaygroundWorkflowSessionAPI(
    //         selectedEndpoint,
    //         workflowId,
    //         session_id
    //       );
    //     } else if (teamId) {
    //       // Assuming there's a team session delete API
    //       toast.error('Team session deletion not implemented');
    //       setIsDeleteModalOpen(false);
    //       return;
    //     } else if (agentId) {
    //       response = await deletePlaygroundSessionAPI(
    //         selectedEndpoint,
    //         agentId,
    //         session_id
    //       );
    //     }
    //     if (response && response.status === 200 && sessionsData) {
    //       setSessionsData(
    //         sessionsData.filter((session) => session.session_id !== session_id)
    //       )
    //       clearChat()
    //       toast.success('Session deleted')
    //     } else {
    //       toast.error('Failed to delete session')
    //     }
    //   } catch {
    //     toast.error('Failed to delete session')
    //   } finally {
    //     setIsDeleteModalOpen(false)
    //   }
    // }
  }
  return (
    <>
      <div
        className={cn(
          'group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200',
          isSelected
            ? 'bg-primary/10 cursor-default'
            : 'bg-background-secondary hover:bg-background-secondary/80'
        )}
        onClick={handleGetSession}
      >
        <div className="flex flex-col gap-1">
          <h4
            className={cn('text-sm font-medium', isSelected && 'text-primary')}
          >
            {truncateText(title, 20)}
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
        isDeleting={false}
      />
    </>
  )
}

export default SessionItem
