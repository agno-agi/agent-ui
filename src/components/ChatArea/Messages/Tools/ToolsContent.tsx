import React, { memo, type FC } from 'react'

import { type ToolsProps } from './type'

import InfoDetails from '@/components/common/InfoDetails/InfoDetails'

// import DetailAction from '@/components/ChatArea/Messages/DetailAction'
import { ToolCallProps } from '@/types/playground'
import DetailsDialog from '@/components/common/InfoDetails/DetailsDialog'
import InfoDetailTool from '@/components/common/InfoDetails/InfoDetailTool'

const isEmpty = (obj: object) => Object.keys(obj).length === 0

export const ToolComponent = memo(({ tools }: ToolCallProps) => (
  <div className="cursor-pointer rounded-sm bg-secondary px-2 py-0.5 text-xs hover:bg-primary/10">
    <DetailsDialog tools={tools} name={tools.tool_name}>
      <div className="flex items-center justify-between gap-x-1">
        <p className="uppercase">{tools.tool_name}</p>
        <InfoDetailTool />
      </div>
    </DetailsDialog>
  </div>
))

ToolComponent.displayName = 'ToolCall'

const ToolsContent: FC<ToolsProps> = ({ tools, hover = true }) => (
  <div className="flex flex-col gap-y-4">
    {tools.tool_name && (
      <InfoDetails
        title="Tool Call Name"
        icon="hammer"
        content={tools.tool_name}
        hover={hover}
      />
    )}
    {tools.tool_args && (
      <InfoDetails
        title="Tool Args"
        icon="pencil"
        content={tools.tool_args}
        hover={hover}
      />
    )}
    {tools.metrics !== undefined &&
      !isEmpty(tools.metrics as unknown as object) && (
        <InfoDetails
          title="Metrics"
          icon="bar-chart-4"
          content={tools.metrics}
          hover={hover}
        />
      )}
    {tools.content && (
      <InfoDetails
        title="Content"
        icon="details"
        content={tools.content}
        hover={hover}
      />
    )}

    {tools.tool_call_id && (
      <InfoDetails
        title="Tool Call ID"
        icon="hammer"
        content={tools.tool_call_id}
        hover={hover}
      />
    )}

    {tools.tool_calls && (
      <InfoDetails
        title="Tool Calls"
        icon="hammer"
        content={tools.tool_calls}
        hover={hover}
      />
    )}

    {/* {tools.role === 'assistant' && <DetailAction copy={false} />} */}
  </div>
)

export default ToolsContent
