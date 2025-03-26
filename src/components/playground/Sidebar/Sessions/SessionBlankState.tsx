import React from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import Link from 'next/link'

const HistoryBlankStateIcon = () => (
  <svg
    width="90"
    height="89"
    viewBox="0 0 90 89"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M60.0192 18.2484L75.7339 21.2565C80.9549 22.2558 84.3771 27.2984 83.3777 32.5194L80.3697 48.2341C79.3703 53.455 74.3277 56.8773 69.1067 55.8779L53.3921 52.8698C48.1711 51.8704 44.7489 46.8278 45.7482 41.6069L48.7563 25.8922C49.7557 20.6712 54.7983 17.249 60.0192 18.2484Z"
      stroke="white"
      strokeOpacity="0.15"
      strokeWidth="0.75"
    />
    <path
      d="M52.6787 34.7885C53.9351 28.225 60.2744 23.9228 66.8378 25.1792V25.1792C73.4013 26.4355 77.7036 32.7748 76.4472 39.3383V39.3383C75.1908 45.9017 68.8516 50.204 62.2881 48.9476V48.9476C55.7246 47.6913 51.4224 41.352 52.6787 34.7885V34.7885Z"
      fill="#FF4017"
    />
    <g clipPath="url(#clip1_9008_17675)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.8503 32.7422C59.5795 32.6962 59.3962 32.4446 59.4409 32.1802C59.6051 31.2079 60.0017 30.4826 60.7415 30.1543C61.4471 29.8413 62.3116 29.9643 63.221 30.2791C63.4804 30.3689 63.6182 30.6467 63.5286 30.8995C63.4391 31.1524 63.1562 31.2846 62.8968 31.1948C62.0492 30.9014 61.5019 30.8876 61.1589 31.0398C60.8501 31.1768 60.5613 31.519 60.4215 32.3469C60.3768 32.6112 60.1211 32.7882 59.8503 32.7422Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M70.6365 34.8074C70.9052 34.8646 71.1684 34.6985 71.2246 34.4363C71.431 33.4721 71.3304 32.6517 70.7641 32.0734C70.224 31.5218 69.3752 31.3169 68.4138 31.2736C68.1395 31.2612 67.909 31.4685 67.8988 31.7365C67.8886 32.0046 68.1026 32.2319 68.3769 32.2443C69.2729 32.2847 69.7866 32.474 70.0492 32.7421C70.2855 32.9835 70.4276 33.4081 70.2518 34.2291C70.1956 34.4912 70.3679 34.7502 70.6365 34.8074Z"
        fill="white"
      />
      <path
        d="M63.6581 36.939C63.5614 37.4443 63.0733 37.7755 62.5681 37.6787C62.0628 37.582 61.7316 37.094 61.8283 36.5887C61.925 36.0834 62.413 35.7522 62.9183 35.849C63.4236 35.9457 63.7548 36.4337 63.6581 36.939Z"
        fill="white"
      />
      <path
        d="M67.318 37.6392C67.2213 38.1444 66.7332 38.4756 66.228 38.3789C65.7227 38.2822 65.3915 37.7942 65.4882 37.2889C65.5849 36.7836 66.0729 36.4524 66.5782 36.5492C67.0835 36.6459 67.4147 37.1339 67.318 37.6392Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M69.4411 41.0527C69.7119 41.0986 69.8945 41.3539 69.8489 41.6229C69.6814 42.6122 69.2823 43.351 68.5409 43.6873C67.8339 44.0079 66.9693 43.8856 66.0603 43.5684C65.801 43.478 65.6641 43.1959 65.7545 42.9385C65.8449 42.6811 66.1284 42.5457 66.3877 42.6362C67.2348 42.9318 67.7825 42.944 68.1262 42.7881C68.4356 42.6478 68.7257 42.2989 68.8683 41.4566C68.9138 41.1876 69.1703 41.0068 69.4411 41.0527Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M58.6548 38.9885C58.3862 38.9312 58.1223 39.101 58.0652 39.3678C57.8555 40.349 57.9536 41.183 58.5184 41.7692C59.057 42.3283 59.9057 42.534 60.8675 42.5749C61.1419 42.5866 61.3733 42.3751 61.3844 42.1025C61.3954 41.8298 61.182 41.5994 60.9076 41.5877C60.0112 41.5495 59.4977 41.3586 59.2359 41.0868C59.0002 40.8422 58.8594 40.4108 59.038 39.5754C59.095 39.3086 58.9234 39.0458 58.6548 38.9885Z"
        fill="white"
      />
    </g>
    <path
      d="M4.32008 49.0567C3.54981 43.797 7.18916 38.9088 12.4488 38.1386L28.2799 35.8201C33.5396 35.0498 38.4278 38.6892 39.198 43.9488L41.5165 59.7799C42.2868 65.0396 38.6474 69.9278 33.3878 70.698L17.5567 73.0165C12.297 73.7868 7.40882 70.1474 6.63855 64.8878L4.32008 49.0567Z"
      stroke="white"
      strokeOpacity="0.15"
      strokeWidth="0.75"
    />
    <path
      d="M11.0451 56.1568C10.085 49.5994 14.6225 43.5051 21.18 42.545C27.7375 41.5848 33.8318 46.1224 34.7919 52.6799C35.7521 59.2374 31.2145 65.3316 24.657 66.2918C18.0995 67.2519 12.0053 62.7143 11.0451 56.1568Z"
      fill="white"
    />
    <g clipPath="url(#clip0_7378_12246)">
      <path
        d="M29.1447 55.5281C29.1959 55.878 29.1061 56.2339 28.8949 56.5175C28.6837 56.8011 28.3685 56.9893 28.0186 57.0405L20.103 58.1995L17.8508 61.2244L16.3055 50.6702C16.2542 50.3203 16.3441 49.9644 16.5553 49.6808C16.7665 49.3971 17.0817 49.209 17.4316 49.1578L26.6664 47.8056C27.0163 47.7544 27.3722 47.8443 27.6559 48.0554C27.9395 48.2666 28.1276 48.5818 28.1789 48.9317L29.1447 55.5281Z"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_7378_12246">
        <rect
          width="16"
          height="16"
          fill="white"
          transform="translate(13.8438 47.6617) rotate(-8.33)"
        />
      </clipPath>
    </defs>
  </svg>
)

const SessionBlankState = () => {
  const { selectedEndpoint, isEndpointActive, hasStorage } =
    usePlaygroundStore()
  const [agentId] = useQueryState('agent')

  const errorMessage = (() => {
    switch (true) {
      case !isEndpointActive:
        return 'Endpoint is not connected. Please connect the endpoint to see the history.'
      case !selectedEndpoint:
        return 'Select an endpoint to see the history.'
      case !agentId:
        return 'Select an agent to see the history.'
      case !hasStorage:
        return (
          <>
            Connect{' '}
            <Link
              className="underline"
              href={'https://docs.agno.com/storage'}
              target="_blank"
            >
              storage
            </Link>{' '}
            to your agent to see sessions.{' '}
          </>
        )
      default:
        return 'No session records yet. Start a conversation to create one.'
    }
  })()

  return (
    <div className="mt-1 flex items-center justify-center rounded-lg bg-background-secondary/50 pb-6 pt-4">
      <div className="flex flex-col items-center gap-1">
        <HistoryBlankStateIcon />
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-medium text-primary">No Session found</h3>
          <p className="max-w-[210px] text-center text-sm text-muted">
            {errorMessage}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SessionBlankState
