import { toast } from 'sonner'

import { APIRoutes } from './routes'

import { AgentDetails, Sessions, TeamDetails, SessionEntry } from '@/types/os'
import { getUserId } from '@/utils/user'
import { useStore } from '@/store'

// Helper function to create headers with optional auth token and user_id
const createHeaders = (authToken?: string): HeadersInit => {
  const userId = getUserId()
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  if (userId) {
    headers['X-User-ID'] = userId
  }

  return headers
}

export const getAgentsAPI = async (
  endpoint: string,
  authToken?: string
): Promise<AgentDetails[]> => {
  const userId = getUserId()
  
  // Use playground endpoint when user_id is present (playground backend)
  const agentsUrl = userId 
    ? `${endpoint}/v1/playground/agents`
    : APIRoutes.GetAgents(endpoint)
  
  const url = new URL(agentsUrl)
  if (userId) {
    url.searchParams.append('user_id', userId)
  }
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: createHeaders(authToken)
    })
    if (!response.ok) {
      toast.error(`Failed to fetch  agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    return data
  } catch {
    toast.error('Error fetching  agents')
    return []
  }
}

export const getStatusAPI = async (
  base: string,
  authToken?: string
): Promise<number> => {
  const userId = getUserId()
  
  // For playground with user_id, use agents endpoint as health check
  // The middleware requires user_id for all requests, and /health doesn't exist
  // Using /v1/playground/agents with user_id as a proxy for health
  if (userId) {
    try {
      const url = new URL(`${base}/v1/playground/agents`)
      url.searchParams.append('user_id', userId)
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: createHeaders(authToken)
      })
      // Return 200 if agents endpoint works (even if empty), else return the status
      return response.ok ? 200 : response.status
    } catch {
      // Return 503 on network error
      return 503
    }
  }
  
  // For standard AgentOS, use the health endpoint
  try {
    const url = new URL(APIRoutes.Status(base))
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: createHeaders(authToken)
    })
    return response.status
  } catch {
    // Return 503 on network error
    return 503
  }
}

export const getAllSessionsAPI = async (
  base: string,
  type: 'agent' | 'team',
  componentId: string,
  dbId: string,
  authToken?: string
): Promise<Sessions | { data: [] }> => {
  try {
    const userId = getUserId()
    
    // Use playground sessions endpoint when user_id is present
    let url: URL
    if (userId && type === 'agent') {
      // Playground uses /v1/playground/agents/{agentId}/sessions
      url = new URL(`${base}/v1/playground/agents/${componentId}/sessions`)
    } else {
      url = new URL(APIRoutes.GetSessions(base))
      url.searchParams.set('type', type)
      url.searchParams.set('component_id', componentId)
      if (dbId) {
        url.searchParams.set('db_id', dbId)
      }
    }
    
    if (userId) {
      url.searchParams.append('user_id', userId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: createHeaders(authToken)
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [] }
      }
      console.error(`Failed to fetch sessions: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Debug logging to understand the actual structure of session data
    const sampleSession = Array.isArray(data) && data.length > 0 
      ? data[0] 
      : (data?.data?.[0] || null)
    const sessionKeys = sampleSession ? Object.keys(sampleSession) : []
    
    
    // Map session data to ensure session_name field exists
    // Agno Playground returns 'title' field, not 'session_name'
    // Check multiple possible field names: title, session_name, summary, name
    const mapSession = (session: any) => ({
      session_id: session.session_id,
      session_name: session.title || session.session_name || session.summary || session.name || '-',
      created_at: session.created_at,
      updated_at: session.updated_at
    })
    
    // Playground returns array directly, standard API returns { data: [...] }
    if (Array.isArray(data)) {
      return { data: data.map(mapSession) } as Sessions
    } else if (data?.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(mapSession)
      } as Sessions
    }
    
    return Array.isArray(data) ? ({ data: data.map(mapSession) } as Sessions) : data
  } catch (error) {
    console.error('Error in getAllSessionsAPI:', error)
    return { data: [] }
  }
}

export const getSessionAPI = async (
  base: string,
  type: 'agent' | 'team',
  sessionId: string,
  dbId?: string,
  authToken?: string,
  agentId?: string
) => {
  const userId = getUserId()
  
  // Use playground session endpoint when user_id is present
  let url: URL
  if (userId && type === 'agent') {
    // Playground endpoint: /v1/playground/agents/{agentId}/sessions/{sessionId}
    // The backend resolves the agent from user_id, but we still need agentId in path
    // If agentId not provided, try to use a placeholder or fetch it first
    if (agentId) {
      url = new URL(`${base}/v1/playground/agents/${agentId}/sessions/${sessionId}`)
      url.searchParams.append('user_id', userId)
    } else {
      // Fallback to standard endpoint if no agentId (shouldn't happen with our fixes)
      url = new URL(APIRoutes.GetSession(base, sessionId))
      const queryParams = new URLSearchParams({ type })
      if (dbId) queryParams.append('db_id', dbId)
      queryParams.append('user_id', userId)
      url.search = queryParams.toString()
    }
  } else {
    // Standard AgentOS endpoint
    url = new URL(APIRoutes.GetSession(base, sessionId))
    const queryParams = new URLSearchParams({ type })
    if (dbId) queryParams.append('db_id', dbId)
    if (userId) queryParams.append('user_id', userId)
    url.search = queryParams.toString()
  }

  const response = await fetch(
    url.toString(),
    {
      method: 'GET',
      headers: createHeaders(authToken) // Already includes X-User-ID if userId exists
    }
  )

  if (!response.ok) {
    let errorText = ''
    try {
      const text = await response.text()
      if (text && text.trim()) {
        // Try to parse as JSON first
        try {
          const errorJson = JSON.parse(text)
          errorText = errorJson.detail || errorJson.message || JSON.stringify(errorJson)
        } catch {
          // Not JSON, use as-is (might be plain text like "Session not found.")
          errorText = text.trim()
        }
      } else {
        // Empty response body, use status text
        errorText = response.statusText || (response.status === 404 ? 'Not Found' : 'Unknown error')
      }
    } catch (e) {
      // Failed to read response, use status text
      errorText = response.statusText || 'Unknown error'
    }
    
    // Create user-friendly error message
    let errorMessage = ''
    if (response.status === 404) {
      errorMessage = errorText || 'Session not found'
    } else {
      errorMessage = errorText || response.statusText || 'Unknown error'
    }
    
    const fullErrorMessage = `Failed to fetch session: ${response.status} ${errorMessage}`
    
    // Check if we're streaming - if so, don't log as error (it's expected for new sessions)
    // Use getState() directly to avoid hook issues in non-React context
    let isStreaming = false
    try {
      isStreaming = useStore.getState().isStreaming
    } catch {
      // If store not available, continue normally
    }
    
    // For 404 errors, don't log as error - they're handled gracefully by the UI
    // (session not found is a common, expected scenario when loading from URL)
    if (response.status === 404) {
      // Silently handle 404s - they're expected when sessions don't exist
      // The error will still be thrown for proper error handling flow
    } else if (!(isStreaming && response.status === 404)) {
      // Only log as error for non-404 errors (or if not streaming)
      console.error(fullErrorMessage, {
        url: url.toString(),
        status: response.status,
        statusText: response.statusText,
        error: errorText || 'Empty response'
      })
    }
    
    throw new Error(fullErrorMessage)
  }

  const data = await response.json()
  return data
}

export const deleteSessionAPI = async (
  base: string,
  dbId: string,
  sessionId: string,
  authToken?: string,
  agentId?: string
) => {
  const userId = getUserId()
  
  // Use playground session endpoint when user_id is present
  let url: URL
  if (userId && agentId) {
    // Playground endpoint: /v1/playground/agents/{agentId}/sessions/{sessionId}
    url = new URL(`${base}/v1/playground/agents/${agentId}/sessions/${sessionId}`)
    url.searchParams.append('user_id', userId)
  } else {
    // Standard AgentOS endpoint
    url = new URL(APIRoutes.DeleteSession(base, sessionId))
    const queryParams = new URLSearchParams()
    if (dbId) queryParams.append('db_id', dbId)
    if (userId) queryParams.append('user_id', userId)
    url.search = queryParams.toString()
  }

  const response = await fetch(
    url.toString(),
    {
      method: 'DELETE',
      headers: createHeaders(authToken)
    }
  )
  return response
}

export const getTeamsAPI = async (
  endpoint: string,
  authToken?: string
): Promise<TeamDetails[]> => {
  const userId = getUserId()
  
  // Playground doesn't support teams, return empty array silently
  if (userId) {
    return []
  }
  
  const url = new URL(APIRoutes.GetTeams(endpoint))
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: createHeaders(authToken)
    })
    if (!response.ok) {
      toast.error(`Failed to fetch teams: ${response.statusText}`)
      return []
    }
    const data = await response.json()

    return data
  } catch {
    toast.error('Error fetching teams')
    return []
  }
}

export const deleteTeamSessionAPI = async (
  base: string,
  teamId: string,
  sessionId: string,
  authToken?: string
) => {
  const userId = getUserId()
  const url = new URL(APIRoutes.DeleteTeamSession(base, teamId, sessionId))
  if (userId) {
    url.searchParams.append('user_id', userId)
  }
  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: createHeaders(authToken)
  })

  if (!response.ok) {
    throw new Error(`Failed to delete team session: ${response.statusText}`)
  }
  return response
}
