import { type ReactNode } from 'react'

import { type IconType } from '@/components/ui/icon'
import { ToolCall, type Message, type Metrics } from '@/types/Agent'

export interface ToolProps {
  title: string
  content: ReactNode | Metrics | null | ToolCall[]
  icon: IconType
  hover?: boolean
}

export interface ToolsProps {
  tools: Message
  hover?: boolean
}
