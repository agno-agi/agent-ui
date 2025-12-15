'use client'

import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { useQueryState } from 'nuqs'
import { useRequiresSessionState } from '@/hooks/useRequiresSessionState'
import { useStore } from '@/store'
import useChatActions from '@/hooks/useChatActions'

const ChatBlankState = () => {
  const { requiresSessionState, entityType } = useRequiresSessionState()
  const { setShowSessionModal } = useStore()
  const { clearChat } = useChatActions()
  const [sessionId] = useQueryState('session')
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [workflowId] = useQueryState('workflow')

  const hasEntitySelected = !!(agentId || teamId || workflowId)
  const showRequirementWarning =
    requiresSessionState && !sessionId && hasEntitySelected

  const handleNewChat = () => {
    clearChat()
    setShowSessionModal(true)
  }

  return (
    <section
      className="flex flex-col items-center text-center font-geist"
      aria-label="Welcome message"
    >
      <div className="flex max-w-3xl flex-col gap-y-8">
        {/* Show warning when schema required but no session */}
        {showRequirementWarning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 flex flex-col items-center gap-4 rounded-2xl border border-warning/30 bg-warning/5 p-8"
          >
            <div className="rounded-full bg-warning/10 p-4">
              <Icon type="alert-circle" size="lg" className="text-warning" />
            </div>
            <h3 className="text-xl font-semibold text-primary">
              Session State Required
            </h3>
            <p className="max-w-md text-center text-sm text-muted">
              This {entityType} requires session state configuration.
            </p>
            <Button
              onClick={handleNewChat}
              size="lg"
              className="mt-2 rounded-xl bg-primary text-sm font-medium text-background hover:bg-primary/80"
            >
              <Icon type="plus-icon" size="xs" className="text-background" />
              New Chat
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default ChatBlankState
