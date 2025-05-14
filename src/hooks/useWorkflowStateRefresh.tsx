import { useEffect, useRef } from 'react'
import { PlaygroundStore, usePlaygroundStore } from '../store'
import { getWorkflowSessionStateAPI } from '@/api/playground'
import { useQueryState } from 'nuqs'

const REFRESH_INTERVAL = 5000 // 5 seconds in milliseconds

/**
 * Custom hook to refresh workflow state periodically
 * Will refresh the state every 5 seconds if a workflow session is active
 */
const useWorkflowStateRefresh = () => {
  const [workflowId] = useQueryState('workflow')
  const [sessionId] = useQueryState('session')
  const selectedEndpoint = usePlaygroundStore(
    (state: PlaygroundStore) => state.selectedEndpoint
  )
  const setWorkflowSessionState = usePlaygroundStore(
    (state: PlaygroundStore) => state.setWorkflowSessionState
  )

  // Use a ref to track the last refresh time
  const lastRefreshTimeRef = useRef<number>(0)

  useEffect(() => {
    // Only set up the interval if we have a workflow and session
    if (!workflowId || !sessionId || !selectedEndpoint) {
      return
    }

    // Function to refresh the workflow state
    const refreshWorkflowState = async () => {
      const currentTime = Date.now()

      // Only refresh if it's been more than 5 seconds since the last refresh
      if (currentTime - lastRefreshTimeRef.current >= REFRESH_INTERVAL) {
        try {
          console.log('🔄 Refreshing workflow session state')
          const stateResponse = await getWorkflowSessionStateAPI(
            selectedEndpoint,
            workflowId,
            sessionId
          )
          console.log('📦 Updated workflow session state:', stateResponse)
          setWorkflowSessionState(stateResponse)

          // Update the last refresh time
          lastRefreshTimeRef.current = currentTime
        } catch (error) {
          console.error('Error refreshing workflow session state:', error)
        }
      }
    }

    // Set up the interval to check and potentially refresh the state
    const intervalId = setInterval(refreshWorkflowState, REFRESH_INTERVAL)

    // Initial refresh
    refreshWorkflowState()

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId)
    }
  }, [workflowId, sessionId, selectedEndpoint, setWorkflowSessionState])
}

export default useWorkflowStateRefresh
