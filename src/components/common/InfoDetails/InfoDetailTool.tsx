import React, { type FC } from 'react'

import Tooltip from '@/components/common/Tooltip'
import { InfoIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface InfoDetailToolProps {
  content?: string
  color?: string
}

const InfoDetailTool: FC<InfoDetailToolProps> = ({ content, color }) => (
  <Tooltip
    content={content ?? 'Click the tool to see more info'}
    delayDuration={0}
    side="bottom"
    contentClassName="max-w-xs"
  >
    <InfoIcon className={cn(color ?? 'text-muted/80')} size={16} />
  </Tooltip>
)

export default InfoDetailTool
