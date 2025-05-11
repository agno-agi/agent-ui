import { toast } from 'sonner'

import { APIRoutes } from './routes'

import { Agent, ComboboxAgent, SessionEntry } from '@/types/playground'

const USER_ID = '7'

export const getPlaygroundAgentsAPI = async (
  endpoint: string
): Promise<ComboboxAgent[]> => {
  const url = new URL(APIRoutes.GetPlaygroundAgents(endpoint))
  url.searchParams.append('user_id', USER_ID)

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'X-User-ID': USER_ID } })
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    // Transform the API response into the expected shape.
    const agents: ComboboxAgent[] = data.map((item: Agent) => ({
      value: item.agent_id || '',
      label: item.name || '',
      model: item.model || '',
      storage: item.storage || false
    }))
    return agents
  } catch (error) {
    console.error(error)
    toast.error('Error fetching playground agents')
    return []
  }
}

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
  const url = new URL(APIRoutes.PlaygroundStatus(base))
  url.searchParams.append('user_id', USER_ID)

  const response = await fetch(url, {
    method: 'GET'
  })
  return response.status
}

export const getAllPlaygroundSessionsAPI = async (
  base: string,
  agentId: string
): Promise<SessionEntry[]> => {
  try {
    const url = new URL(APIRoutes.GetPlaygroundSessions(base, agentId))
    url.searchParams.append('user_id', USER_ID)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-User-ID': USER_ID,
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array when storage is not enabled
        return []
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    return response.json()
  } catch {
    return []
  }
}

export const getPlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const url = new URL(APIRoutes.GetPlaygroundSession(base, agentId, sessionId))
  url.searchParams.append('user_id', USER_ID)

  const response = await fetch(
    url,
    {
      method: 'GET',
      headers: {
        'X-User-ID': USER_ID,
      },
    }
  )
  return response.json()
}

export const deletePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const url = new URL(APIRoutes.DeletePlaygroundSession(base, agentId, sessionId))
  url.searchParams.append('user_id', USER_ID)

  const response = await fetch(
    url,
    {
      method: 'DELETE',
      headers: {
        'X-User-ID': USER_ID,
      }
    }
  )
  return response
}
