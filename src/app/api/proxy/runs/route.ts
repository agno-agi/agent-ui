import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const AGENT_OS_ENDPOINT =
    process.env.AGENT_OS_ENDPOINT || 'http://localhost:7777'

export async function POST(request: NextRequest) {
    // Skip auth check in local development
    const isLocalDev = process.env.DISABLE_AUTH === 'true'

    if (!isLocalDev) {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    try {
        const formData = await request.formData()
        const runUrl = request.headers.get('x-run-url')

        if (!runUrl) {
            return NextResponse.json({ error: 'Missing run URL' }, { status: 400 })
        }

        // Construct the internal URL
        // The runUrl from client will be relative path like /agents/agent_id/runs
        const internalUrl = `${AGENT_OS_ENDPOINT}${runUrl}`

        const response = await fetch(internalUrl, {
            method: 'POST',
            headers: {
                // Forward auth token if needed by Agent OS, or just rely on internal network trust
                // 'Authorization': `Bearer ${session.accessToken}`, 
            },
            body: formData,
        })

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json(
                { error: `Agent OS Error: ${response.statusText}`, details: errorText },
                { status: response.status }
            )
        }

        // Stream the response back
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        )
    }
}
