import { useQueryState } from 'nuqs'
import { useStore } from '@/store'
import {
  getSessionStateSchema,
  requiresSessionState
} from '@/config/sessionStateSchemas'

/**
 * Hook to check if the current entity requires session state configuration
 * @returns Object containing schema requirement info
 */
export function useRequiresSessionState() {
  const mode = useStore((state) => state.mode)
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [workflowId] = useQueryState('workflow')

  // Get current entity ID based on mode
  const entityId =
    mode === 'workflow'
      ? workflowId
      : mode === 'team'
        ? teamId
        : mode === 'agent'
          ? agentId
          : null

  const schema = getSessionStateSchema(mode, entityId)
  const required = requiresSessionState(mode, entityId)

  return {
    requiresSessionState: required,
    schema,
    entityType: mode,
    entityId
  }
}
