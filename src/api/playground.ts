import { toast } from 'sonner'

import { APIRoutes } from './routes'

import {
  Agent,
  AgentDetails,
  Sessions,
  Team,
  TeamDetails
} from '@/types/playground'

export const getPlaygroundAgentsAPI = async (
  endpoint: string
): Promise<AgentDetails[]> => {
  const url = APIRoutes.GetPlaygroundAgents(endpoint)
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()

    console.log('Fetched agents:', data) // Debug log
    return data
  } catch {
    toast.error('Error fetching playground agents')
    return []
  }
}

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
  const response = await fetch(APIRoutes.PlaygroundStatus(base), {
    method: 'GET'
  })
  return response.status
}

export const getAllPlaygroundSessionsAPI = async (
  base: string,
  type: "agent" | "team",
  componentId: string,
  dbId: string
): Promise<Sessions> => {
  try {
    const url = new URL(APIRoutes.GetPlaygroundSessions(base))

    // add queries
    url.searchParams.set("type", type)
    url.searchParams.set("component_id", componentId)
    url.searchParams.set("db_id", dbId)

    const response = await fetch(url.toString(), {
      method: "GET",
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    return response.json()
  } catch {
    return null
  }
}


export const getPlaygroundSessionAPI = async (
  base: string,
  type: "agent" | "team",
  sessionId: string,
  dbId?: string
) => {
  // build query string
  const queryParams = new URLSearchParams({ type })
  if (dbId) queryParams.append("db_id", dbId)

  const response = await fetch(
    `${APIRoutes.GetPlaygroundSession(base, sessionId)}?${queryParams.toString()}`,
    {
      method: "GET",
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`)
  }

  return response.json()
}


export const deletePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.DeletePlaygroundSession(base, agentId, sessionId),
    {
      method: 'DELETE'
    }
  )
  return response
}

export const getPlaygroundTeamsAPI = async (
  endpoint: string
): Promise<TeamDetails[]> => {
  const url = APIRoutes.GetPlayGroundTeams(endpoint)
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      toast.error(`Failed to fetch playground teams: ${response.statusText}`)
      return []
    }
    const data = await response.json()

    return data
  } catch {
    toast.error('Error fetching playground teams')
    return []
  }
}

export const getPlaygroundTeamSessionsAPI = async (
  base: string,
  teamId: string
): Promise<Sessions[]> => {
  try {
    const response = await fetch(
      APIRoutes.GetPlaygroundTeamSessions(base, teamId),
      {
        method: 'GET'
      }
    )
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`Failed to fetch team sessions: ${response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching team sessions:', error)
    toast.error('Error fetching team sessions') // Inform user
    return []
  }
}

export const getPlaygroundTeamSessionAPI = async (
  base: string,
  teamId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.GetPlaygroundTeamSession(base, teamId, sessionId),
    {
      method: 'GET'
    }
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch team session: ${response.statusText}`)
  }
  return response.json()
}

export const deletePlaygroundTeamSessionAPI = async (
  base: string,
  teamId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.DeletePlaygroundTeamSession(base, teamId, sessionId),
    {
      method: 'DELETE'
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to delete team session: ${response.statusText}`)
  }
  return response
}
