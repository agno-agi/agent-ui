'use server'

import { AgentDetails, TeamDetails, WorkflowDetails, Sessions } from '@/types/os'
import { auth } from '@/auth'

const AGENT_OS_ENDPOINT =
    process.env.AGENT_OS_ENDPOINT || 'http://localhost:7777'

// Get auth token from server-side env (no NEXT_PUBLIC_ prefix needed)
const OS_SECURITY_KEY = process.env.OS_SECURITY_KEY

// Helper to ensure user is authenticated
async function ensureAuth() {
    // Skip auth check in local development
    const isLocalDev = process.env.DISABLE_AUTH === 'true'

    if (isLocalDev) {
        return null
    }

    const session = await auth()
    if (!session) {
        throw new Error('Unauthorized')
    }
    return session
}

// Helper function to create headers with auth token from server env
const createHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    }

    if (OS_SECURITY_KEY) {
        headers['Authorization'] = `Bearer ${OS_SECURITY_KEY}`
    }

    return headers
}

export async function getAgentsAction(): Promise<AgentDetails[]> {
    await ensureAuth()
    try {
        const response = await fetch(`${AGENT_OS_ENDPOINT}/agents`, {
            method: 'GET',
            headers: createHeaders(),
            cache: 'no-store'
        })

        if (!response.ok) {
            console.error(`Failed to fetch agents: ${response.statusText}`)
            return []
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching agents:', error)
        return []
    }
}

export async function getStatusAction(): Promise<number> {
    await ensureAuth()
    try {
        const response = await fetch(`${AGENT_OS_ENDPOINT}/health`, {
            method: 'GET',
            headers: createHeaders(),
            cache: 'no-store'
        })
        return response.status
    } catch (error) {
        console.error('Error fetching status:', error)
        return 503
    }
}

export async function getTeamsAction(): Promise<TeamDetails[]> {
    await ensureAuth()
    try {
        const response = await fetch(`${AGENT_OS_ENDPOINT}/teams`, {
            method: 'GET',
            headers: createHeaders(),
            cache: 'no-store'
        })

        if (!response.ok) {
            console.error(`Failed to fetch teams: ${response.statusText}`)
            return []
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching teams:', error)
        return []
    }
}

export async function getWorkflowsAction(): Promise<WorkflowDetails[]> {
    await ensureAuth()
    try {
        const response = await fetch(`${AGENT_OS_ENDPOINT}/workflows`, {
            method: 'GET',
            headers: createHeaders(),
            cache: 'no-store'
        })

        if (!response.ok) {
            console.error(`Failed to fetch workflows: ${response.statusText}`)
            return []
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching workflows:', error)
        return []
    }
}

export async function createSessionAction(
    type: 'agent' | 'team' | 'workflow',
    componentId: string,
    dbId: string,
    sessionId: string,
    userId?: string,
    sessionName?: string,
    sessionState?: Record<string, unknown>
): Promise<{ session_id: string } | null> {
    await ensureAuth()
    try {
        const url = new URL(`${AGENT_OS_ENDPOINT}/sessions`)
        url.searchParams.set('type', type)
        url.searchParams.set('db_id', dbId)

        const body: Record<string, unknown> = {
            session_id: sessionId,
        }

        if (userId) {
            body.user_id = userId
        }

        if (sessionName) {
            body.session_name = sessionName
        }

        if (sessionState) {
            body.session_state = sessionState
        }

        // Set component ID based on type
        if (type === 'agent') {
            body.agent_id = componentId
        } else if (type === 'team') {
            body.team_id = componentId
        } else if (type === 'workflow') {
            body.workflow_id = componentId
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: createHeaders(),
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            console.error(`Failed to create session: ${response.statusText}`)
            return null
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error creating session:', error)
        return null
    }
}

export async function getAllSessionsAction(
    type: 'agent' | 'team' | 'workflow',
    componentId: string,
    dbId: string,
    userId?: string
): Promise<Sessions | { data: [] }> {
    await ensureAuth()
    try {
        const url = new URL(`${AGENT_OS_ENDPOINT}/sessions`)
        url.searchParams.set('type', type)
        url.searchParams.set('component_id', componentId)
        url.searchParams.set('db_id', dbId)
        if (userId) {
            url.searchParams.set('user_id', userId)
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: createHeaders(),
            cache: 'no-store'
        })

        if (!response.ok) {
            if (response.status === 404) {
                return { data: [] }
            }
            throw new Error(`Failed to fetch sessions: ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error('Error fetching sessions:', error)
        return { data: [] }
    }
}

export async function getSessionAction(
    type: 'agent' | 'team' | 'workflow',
    sessionId: string,
    dbId?: string
) {
    await ensureAuth()
    try {
        const queryParams = new URLSearchParams({ type })
        if (dbId) queryParams.append('db_id', dbId)

        const response = await fetch(
            `${AGENT_OS_ENDPOINT}/sessions/${sessionId}/runs?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: createHeaders(),
                cache: 'no-store'
            }
        )

        if (!response.ok) {
            throw new Error(`Failed to fetch session: ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error('Error fetching session:', error)
        throw error
    }
}

export async function deleteSessionAction(
    dbId: string,
    sessionId: string
) {
    await ensureAuth()
    try {
        const queryParams = new URLSearchParams()
        if (dbId) queryParams.append('db_id', dbId)

        const response = await fetch(
            `${AGENT_OS_ENDPOINT}/sessions/${sessionId}?${queryParams.toString()}`,
            {
                method: 'DELETE',
                headers: createHeaders()
            }
        )

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            text: async () => await response.text()
        }
    } catch (error) {
        console.error('Error deleting session:', error)
        throw error
    }
}

export async function deleteTeamSessionAction(
    teamId: string,
    sessionId: string
) {
    await ensureAuth()
    try {
        const response = await fetch(
            `${AGENT_OS_ENDPOINT}/v1//teams/${teamId}/sessions/${sessionId}`,
            {
                method: 'DELETE',
                headers: createHeaders()
            }
        )

        if (!response.ok) {
            throw new Error(`Failed to delete team session: ${response.statusText}`)
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        }
    } catch (error) {
        console.error('Error deleting team session:', error)
        throw error
    }
}

// Helper to get the run URL for streaming

