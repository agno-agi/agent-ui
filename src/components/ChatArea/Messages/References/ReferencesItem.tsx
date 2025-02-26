import React, { type FC } from 'react'

import Paragraph from '@/components/ui/typography/Paragraph'
import { type ReferencesData } from './types'

import DetailsDialog from '@/components/common/InfoDetails/InfoDetails'
import InfoDetailTool from '@/components/common/InfoDetails/InfoDetailTool'

interface ReferencesItemProps {
  references: ReferencesData
}

const ReferencesItem: FC<ReferencesItemProps> = ({ references }) =>
  references?.references.map((doc) => (
    <div
      key={doc.content}
      className="group h-[63px] w-[190px] shrink-0 cursor-pointer rounded-sm bg-secondary/50 p-2 hover:bg-secondary"
    >
      <DetailsDialog
        references={references}
        referencesDoc={doc}
        name={references.query}
      >
        <div className="flex size-full flex-col gap-2">
          <div className="flex w-full items-center justify-between gap-1">
            <Paragraph
              size="title"
              className="cursor-default truncate text-primary"
            >
              {doc.name}
            </Paragraph>
            <InfoDetailTool color="text-muted/50" />
          </div>

          <Paragraph size="xsmall" className="truncate text-muted/50">
            {doc.content}
          </Paragraph>
        </div>
      </DetailsDialog>
    </div>
  ))
export default ReferencesItem
