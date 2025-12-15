'use client'
import { Button } from '@/components/ui/button'
import { ModeSelector } from '@/components/chat/Sidebar/ModeSelector'
import { EntitySelector } from '@/components/chat/Sidebar/EntitySelector'
import useChatActions from '@/hooks/useChatActions'
import { useStore } from '@/store'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import Sessions from './Sessions'
import { Skeleton } from '@/components/ui/skeleton'
import { useQueryState } from 'nuqs'
import SessionStateModal from './SessionStateModal'
import { useRequiresSessionState } from '@/hooks/useRequiresSessionState'

const SidebarHeader = () => (
  <div className="flex items-center gap-2">
    <Icon type="agno" size="xs" />
    <span className="text-xs font-medium uppercase text-white">Agent UI</span>
  </div>
)

const NewChatButton = ({
  disabled,
  onClick,
  isLoading
}: {
  disabled: boolean
  onClick: () => void
  isLoading?: boolean
}) => (
  <Button
    onClick={onClick}
    disabled={disabled || isLoading}
    size="lg"
    className="h-9 w-full rounded-xl bg-primary text-xs font-medium text-background hover:bg-primary/80"
  >
    <Icon type="plus-icon" size="xs" className="text-background" />
    <span className="uppercase">{isLoading ? 'Creating...' : 'New Chat'}</span>
  </Button>
)

const ModelDisplay = ({ model }: { model: string }) => (
  <div className="flex h-9 w-full items-center gap-3 rounded-xl border border-primary/15 bg-accent p-3 text-xs font-medium uppercase text-muted">
    {(() => {
      const icon = getProviderIcon(model)
      return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
    })()}
    {model}
  </div>
)

const Endpoint = () => {
  const { isEndpointActive } = useStore()
  const { initialize } = useChatActions()
  const [isRotating, setIsRotating] = useState(false)

  const handleRefresh = async () => {
    setIsRotating(true)
    await initialize()
    setTimeout(() => setIsRotating(false), 500)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase text-primary">
          AgentOS Status
        </span>
        <div
          className={`size-2 rounded-full ${isEndpointActive ? 'bg-positive' : 'bg-destructive'}`}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        className="h-6 w-6 hover:cursor-pointer hover:bg-transparent"
      >
        <motion.div
          key={isRotating ? 'rotating' : 'idle'}
          animate={{ rotate: isRotating ? 360 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Icon type="refresh" size="xs" />
        </motion.div>
      </Button>
    </div>
  )
}

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const { clearChat, focusChatInput, initialize, createNewSession } = useChatActions()
  const { schema } = useRequiresSessionState()
  const {
    messages,
    selectedEndpoint,
    isEndpointActive,
    selectedModel,
    hydrated,
    isEndpointLoading,
    mode,
    showSessionModal,
    setShowSessionModal
  } = useStore()
  const [isMounted, setIsMounted] = useState(false)
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')

  useEffect(() => {
    setIsMounted(true)

    if (hydrated) initialize()
  }, [selectedEndpoint, initialize, hydrated, mode])

  const handleNewChat = () => {
    clearChat()
    setShowSessionModal(true)
  }

  const handleCreateSession = async (sessionState: Record<string, string>) => {
    setIsCreatingSession(true)
    setShowSessionModal(false)
    await createNewSession(sessionState)
    setIsCreatingSession(false)
    focusChatInput()
  }

  return (
    <motion.aside
      className="relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3 font-dmmono"
      initial={{ width: '16rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-2 z-10 p-1"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`transform ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        />
      </motion.button>
      <motion.div
        className="w-60 space-y-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          pointerEvents: isCollapsed ? 'none' : 'auto'
        }}
      >
        <SidebarHeader />
        <NewChatButton
          disabled={messages.length === 0}
          onClick={handleNewChat}
          isLoading={isCreatingSession}
        />
        {isMounted && (
          <>
            <Endpoint />
            {isEndpointActive && (
              <>
                <motion.div
                  className="flex w-full flex-col items-start gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <div className="text-xs font-medium uppercase text-primary">
                    Mode
                  </div>
                  {isEndpointLoading ? (
                    <div className="flex w-full flex-col gap-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="h-9 w-full rounded-xl"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <ModeSelector />
                      <EntitySelector />
                      {selectedModel && (agentId || teamId) && (
                        <ModelDisplay model={selectedModel} />
                      )}
                    </>
                  )}
                </motion.div>
                <Sessions />
              </>
            )}
          </>
        )}
      </motion.div>
      <SessionStateModal
        open={showSessionModal}
        onOpenChange={setShowSessionModal}
        onCreateSession={handleCreateSession}
        isCreating={isCreatingSession}
        schema={schema}
      />
    </motion.aside>
  )
}

export default Sidebar
