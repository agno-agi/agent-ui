'use client'
import { Button } from '@/components/ui/button'
import { AgentSelector } from '@/components/playground/Sidebar/AgentSelector'
import { TeamSelector } from '@/components/playground/Sidebar/TeamSelector'
import { WorkflowSelector } from '@/components/playground/Sidebar/WorkflowSelector'
import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import Sessions from './Sessions'
import Documents from './Documents'
import { isValidUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { truncateText } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
const ENDPOINT_PLACEHOLDER = 'NO ENDPOINT ADDED'
const SidebarHeader = () => (
  <div className="flex items-center gap-2">
    <Icon type="agno" size="xs" />
    <span className="text-xs font-medium uppercase text-white">Agent UI</span>
  </div>
)

const NewChatButton = ({
  disabled,
  onClick
}: {
  disabled: boolean
  onClick: () => void
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="bg-primary text-background hover:bg-primary/80 h-9 w-full rounded-xl text-xs font-medium"
  >
    <Icon type="plus-icon" size="xs" className="text-background" />
    <span className="uppercase">New Chat</span>
  </Button>
)

const ModelDisplay = ({ model }: { model: string }) => (
  <div className="border-primary/15 bg-accent text-muted flex h-9 w-full items-center gap-3 rounded-xl border p-3 text-xs font-medium uppercase">
    {(() => {
      const icon = getProviderIcon(model)
      return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
    })()}
    {model}
  </div>
)

const Endpoint = () => {
  const {
    selectedEndpoint,
    isEndpointActive,
    setSelectedEndpoint,
    setAgents,
    setSessionsData,
    setMessages
  } = usePlaygroundStore()
  const { initializePlayground } = useChatActions()
  const [isEditing, setIsEditing] = useState(false)
  const [endpointValue, setEndpointValue] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  useEffect(() => {
    setEndpointValue(selectedEndpoint)
    setIsMounted(true)
  }, [selectedEndpoint])

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-positive' : 'bg-destructive'

  const handleSave = async () => {
    if (!isValidUrl(endpointValue)) {
      toast.error('Please enter a valid URL')
      return
    }
    const cleanEndpoint = endpointValue.replace(/\/$/, '').trim()
    setSelectedEndpoint(cleanEndpoint)
    setAgentId(null)
    setSessionId(null)
    setIsEditing(false)
    setIsHovering(false)
    setAgents([])
    setSessionsData([])
    setMessages([])
  }

  const handleCancel = () => {
    setEndpointValue(selectedEndpoint)
    setIsEditing(false)
    setIsHovering(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleRefresh = async () => {
    setIsRotating(true)
    await initializePlayground()
    setTimeout(() => setIsRotating(false), 500)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-primary text-xs font-medium uppercase">Endpoint</div>
      {isEditing ? (
        <div className="flex w-full items-center gap-1">
          <input
            type="text"
            value={endpointValue}
            onChange={(e) => setEndpointValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-primary/15 bg-accent text-muted flex h-9 w-full items-center text-ellipsis rounded-xl border p-3 text-xs font-medium"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:cursor-pointer hover:bg-transparent"
          >
            <Icon type="save" size="xs" />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1">
          <motion.div
            className="border-primary/15 bg-accent relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border p-3 uppercase"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsEditing(true)}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <AnimatePresence mode="wait">
              {isHovering ? (
                <motion.div
                  key="endpoint-display-hover"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-primary flex items-center gap-2 whitespace-nowrap text-xs font-medium">
                    <Icon type="edit" size="xxs" /> EDIT ENDPOINT
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="endpoint-display"
                  className="absolute inset-0 flex items-center justify-between px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-muted text-xs font-medium">
                    {isMounted
                      ? truncateText(selectedEndpoint, 21) ||
                        ENDPOINT_PLACEHOLDER
                      : 'http://localhost:7777'}
                  </p>
                  <div
                    className={`size-2 shrink-0 rounded-full ${getStatusColor(isEndpointActive)}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="hover:cursor-pointer hover:bg-transparent"
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
      )}
    </div>
  )
}

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { clearChat, focusChatInput, initializePlayground } = useChatActions()
  const {
    messages,
    selectedEndpoint,
    isEndpointActive,
    selectedModel,
    hydrated,
    isEndpointLoading
  } = usePlaygroundStore()
  const [isMounted, setIsMounted] = useState(false)
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')

  useEffect(() => {
    setIsMounted(true)
    if (hydrated) initializePlayground()
  }, [selectedEndpoint, initializePlayground, hydrated])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isMobileOpen && !target.closest('.sidebar-container')) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileOpen])

  const handleNewChat = () => {
    clearChat()
    focusChatInput()
  }

  return (
    <>
      {/* Mobile Hamburger Menu - Only visible on small screens */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-background/80 fixed left-3 top-3 z-50 rounded-md p-2 md:hidden"
          aria-label="Toggle mobile menu"
        >
          <Icon type="sheet" size="xs" />
        </button>
      )}

      {/* Mobile overlay backdrop when sidebar is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <motion.aside
        className="sidebar-container font-dmmono bg-background/95 fixed z-40 flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3 shadow-lg md:relative md:bg-transparent md:shadow-none"
        initial={{ width: '16rem', x: '-100%' }}
        animate={{
          width: isCollapsed ? '2.5rem' : '16rem',
          x: isMobileOpen
            ? '0%'
            : typeof window !== 'undefined' && window.innerWidth < 768
              ? '-100%'
              : '0%'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.button
          onClick={() => {
            setIsCollapsed(!isCollapsed)
            setIsMobileOpen(false)
          }}
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
                    <div className="text-primary text-xs font-medium uppercase">
                      Agent
                    </div>
                    {isEndpointLoading ? (
                      <div className="flex w-full flex-col gap-2">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className="h-9 w-full rounded-xl"
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <AgentSelector />
                        {selectedModel && agentId && !teamId && (
                          <ModelDisplay model={selectedModel} />
                        )}
                      </>
                    )}
                  </motion.div>
                  <motion.div
                    className="flex w-full flex-col items-start gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <div className="text-primary text-xs font-medium uppercase">
                      Team
                    </div>
                    {isEndpointLoading ? (
                      <div className="flex w-full flex-col gap-2">
                        {Array.from({ length: 1 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className="h-9 w-full rounded-xl"
                          />
                        ))}
                      </div>
                    ) : (
                      <TeamSelector />
                    )}
                  </motion.div>
                  <motion.div
                    className="flex w-full flex-col items-start gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <div className="text-primary text-xs font-medium uppercase">
                      Workflow
                    </div>
                    {isEndpointLoading ? (
                      <div className="flex w-full flex-col gap-2">
                        {Array.from({ length: 1 }).map((_, index) => (
                          <Skeleton
                            key={index}
                            className="h-9 w-full rounded-xl"
                          />
                        ))}
                      </div>
                    ) : (
                      <WorkflowSelector />
                    )}
                  </motion.div>
                  <Sessions />
                  <Documents />
                </>
              )}
            </>
          )}
        </motion.div>
      </motion.aside>
    </>
  )
}

export default Sidebar
