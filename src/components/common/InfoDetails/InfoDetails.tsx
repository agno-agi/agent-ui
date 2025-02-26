import React, { type FC } from 'react'

import Icon from '@/components/ui/icon'
import Paragraph from '@/components/ui/typography/Paragraph'
import { cn } from '@/utils/cn'

import Code from '../../Code'
import { type ToolProps } from '../Tools/type'

const InfoDetails: FC<ToolProps> = ({ content, icon, title, hover }) => (
  <div className="flex w-full flex-col gap-y-2">
    <div className="flex gap-2 pl-1">
      <Icon size="xs" type={icon} className="text-muted" />
      <Paragraph size="xs" className="text-muted">
        {title}
      </Paragraph>
    </div>

    <Code
      useBackground
      formatAsNestedObject
      copyButton
      classNameCodeBlock="font-dmmono"
      className={cn(
        hover && 'group-hover:bg-accent/50',
        'overflow-auto font-dmmono'
      )}
    >
      {content}
    </Code>
  </div>
)

export default InfoDetails
