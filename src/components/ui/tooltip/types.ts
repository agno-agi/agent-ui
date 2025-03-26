import type { ReactNode } from 'react'

export interface TooltipProps {
  children: ReactNode
  content: ReactNode
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left' | undefined
  delayDuration?: number
  contentClassName?: string
}
