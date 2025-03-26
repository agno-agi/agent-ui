import { type FC } from 'react'

import {
  TooltipProvider,
  Tooltip as BaseTooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip/tooltip'

import type { TooltipProps } from '@/components/ui/tooltip/types'

const Tooltip: FC<TooltipProps> = ({
  className,
  children,
  content,
  side,
  delayDuration,
  contentClassName
}) => (
  <TooltipProvider delayDuration={delayDuration}>
    <BaseTooltip>
      <TooltipTrigger className={className}>{children}</TooltipTrigger>
      <TooltipContent side={side} className={contentClassName}>
        {content}
      </TooltipContent>
    </BaseTooltip>
  </TooltipProvider>
)

export default Tooltip
