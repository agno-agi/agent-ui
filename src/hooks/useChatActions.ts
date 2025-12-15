import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { useStore } from '../store'

import { AgentDetails, TeamDetails, WorkflowDetails, type ChatMessage } from '@/types/os'
import {
  getAgentsAction,
  getStatusAction,
  getTeamsAction,
  getWorkflowsAction,
  createSessionAction
} from '@/actions/agent-os'
import { useQueryState } from 'nuqs'

const useChatActions = () => {
  const { chatInputRef } = useStore()
  const { data: authSession } = useSession()
  const [, setSessionId] = useQueryState('session')
  const setMessages = useStore((state) => state.setMessages)
  const setIsEndpointActive = useStore((state) => state.setIsEndpointActive)
  const setIsEndpointLoading = useStore((state) => state.setIsEndpointLoading)
  const setAgents = useStore((state) => state.setAgents)
  const setTeams = useStore((state) => state.setTeams)
  const setWorkflows = useStore((state) => state.setWorkflows)
  const setSelectedModel = useStore((state) => state.setSelectedModel)
  const setMode = useStore((state) => state.setMode)
  const [agentId, setAgentId] = useQueryState('agent')
  const [teamId, setTeamId] = useQueryState('team')
  const [workflowId, setWorkflowId] = useQueryState('workflow')
  const [, setDbId] = useQueryState('db_id')

  const getStatus = useCallback(async () => {
    try {
      const status = await getStatusAction()
      return status
    } catch {
      return 503
    }
  }, [])

  const getAgents = useCallback(async () => {
    try {
      const agents = await getAgentsAction()
      return agents
    } catch {
      toast.error('Error fetching agents')
      return []
    }
  }, [])

  const getTeams = useCallback(async () => {
    try {
      const teams = await getTeamsAction()
      return teams
    } catch {
      toast.error('Error fetching teams')
      return []
    }
  }, [])

  const getWorkflows = useCallback(async () => {
    try {
      const workflows = await getWorkflowsAction()
      return workflows
    } catch {
      toast.error('Error fetching workflows')
      return []
    }
  }, [])

  const createNewSession = useCallback(async (sessionState?: Record<string, unknown>) => {
    const mode = useStore.getState().mode

    // Determine component ID and db_id based on mode
    let componentId = ''
    let dbIdValue = ''

    if (mode === 'agent' && agentId) {
      const agent = useStore.getState().agents.find(a => a.id === agentId)
      componentId = agentId
      dbIdValue = agent?.db_id || ''
    } else if (mode === 'team' && teamId) {
      const team = useStore.getState().teams.find(t => t.id === teamId)
      componentId = teamId
      dbIdValue = team?.db_id || ''
    } else if (mode === 'workflow' && workflowId) {
      const workflow = useStore.getState().workflows.find(w => w.id === workflowId)
      componentId = workflowId
      dbIdValue = workflow?.db_id || ''
    }

    if (!componentId || !dbIdValue) {
      console.warn('Cannot create session: missing component ID or db_id')
      return null
    }

    // Generate session ID with custom prefix
    const uuid = crypto.randomUUID()
    const newSessionId = `agno-os-ui-${uuid}`

    // Create session with user-provided state (or empty if not provided)
    const userId = authSession?.user?.email || undefined
    const session = await createSessionAction(
      mode,
      componentId,
      dbIdValue,
      newSessionId,
      userId,
      `New Chat - ${new Date().toLocaleString()}`,
      sessionState
    )

    if (session?.session_id) {
      setSessionId(session.session_id)
      setDbId(dbIdValue)
      // Trigger sessions list refresh
      useStore.getState().triggerSessionsRefresh()
      return session.session_id
    }

    toast.error('Failed to create new session')
    return null
  }, [authSession, agentId, teamId, workflowId, setSessionId, setDbId])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message])
    },
    [setMessages]
  )

  const initialize = useCallback(async () => {
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: AgentDetails[] = []
      let teams: TeamDetails[] = []
      let workflows: WorkflowDetails[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        teams = await getTeams()
        agents = await getAgents()
        workflows = await getWorkflows()

        if (!agentId && !teamId && !workflowId) {
          const currentMode = useStore.getState().mode

          if (currentMode === 'workflow' && workflows.length > 0) {
            const firstWorkflow = workflows[0]
            setWorkflowId(firstWorkflow.id)
            setDbId(firstWorkflow.db_id || '')
            setAgentId(null)
            setTeamId(null)
            setWorkflows(workflows)
          } else if (currentMode === 'team' && teams.length > 0) {
            const firstTeam = teams[0]
            setTeamId(firstTeam.id)
            setSelectedModel(firstTeam.model?.provider || '')
            setDbId(firstTeam.db_id || '')
            setAgentId(null)
            setWorkflowId(null)
            setTeams(teams)
          } else if (currentMode === 'agent' && agents.length > 0) {
            const firstAgent = agents[0]
            setMode('agent')
            setAgentId(firstAgent.id)
            setSelectedModel(firstAgent.model?.model || '')
            setDbId(firstAgent.db_id || '')
            setWorkflowId(null)
            setAgents(agents)
          }
        } else {
          setAgents(agents)
          setTeams(teams)
          setWorkflows(workflows)
          if (workflowId) {
            const workflow = workflows.find((w) => w.id === workflowId)
            if (workflow) {
              setMode('workflow')
              setDbId(workflow.db_id || '')
              setAgentId(null)
              setTeamId(null)
            } else if (workflows.length > 0) {
              const firstWorkflow = workflows[0]
              setMode('workflow')
              setWorkflowId(firstWorkflow.id)
              setDbId(firstWorkflow.db_id || '')
              setAgentId(null)
              setTeamId(null)
            }
          } else if (agentId) {
            const agent = agents.find((a) => a.id === agentId)
            if (agent) {
              setMode('agent')
              setSelectedModel(agent.model?.model || '')
              setDbId(agent.db_id || '')
              setTeamId(null)
              setWorkflowId(null)
            } else if (agents.length > 0) {
              const firstAgent = agents[0]
              setMode('agent')
              setAgentId(firstAgent.id)
              setSelectedModel(firstAgent.model?.model || '')
              setDbId(firstAgent.db_id || '')
              setTeamId(null)
              setWorkflowId(null)
            }
          } else if (teamId) {
            const team = teams.find((t) => t.id === teamId)
            if (team) {
              setMode('team')
              setSelectedModel(team.model?.provider || '')
              setDbId(team.db_id || '')
              setAgentId(null)
              setWorkflowId(null)
            } else if (teams.length > 0) {
              const firstTeam = teams[0]
              setMode('team')
              setTeamId(firstTeam.id)
              setSelectedModel(firstTeam.model?.provider || '')
              setDbId(firstTeam.db_id || '')
              setAgentId(null)
              setWorkflowId(null)
            }
          }
        }
      } else {
        setIsEndpointActive(false)
        setMode('workflow')
        setSelectedModel('')
        setAgentId(null)
        setTeamId(null)
        setWorkflowId(null)
      }
      return { agents, teams, workflows }
    } catch (error) {
      console.error('Error initializing :', error)
      setIsEndpointActive(false)
      setMode('workflow')
      setSelectedModel('')
      setAgentId(null)
      setTeamId(null)
      setWorkflowId(null)
      setAgents([])
      setTeams([])
      setWorkflows([])
    } finally {
      setIsEndpointLoading(false)
    }
  }, [
    getStatus,
    getAgents,
    getTeams,
    getWorkflows,
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    setTeams,
    setWorkflows,
    setAgentId,
    setSelectedModel,
    setMode,
    setTeamId,
    setWorkflowId,
    setDbId,
    agentId,
    teamId,
    workflowId
  ])

  return {
    clearChat,
    addMessage,
    getAgents,
    getTeams,
    getWorkflows,
    createNewSession,
    focusChatInput,
    initialize
  }
}

export default useChatActions
