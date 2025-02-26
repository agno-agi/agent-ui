import { type ReactNode } from 'react'

import ToolsContent from '@/components/ChatArea/Messages/Tools'
import Paragraph from '@/components/ui/typography/Paragraph'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  type ReferencesData,
  type ReferencesDocsData,
} from '@/components/ChatArea/Messages/References/types'

import { type ModelMessage } from '@/types/playground'

import ReferencesDialogContent from '@/components/ChatArea/Messages/References/ReferencesDialogContent'

interface DetailsDialogProps {
  tools?: ModelMessage
  references?: ReferencesData
  referencesDoc?: ReferencesDocsData
  children: ReactNode
  name: string
}

const DetailsDialog = ({
  tools,
  references,
  referencesDoc,
  children,
  name
}: DetailsDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="max-w-[623px] overflow-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:my-4">
      <DialogHeader className="mb-6">
        <DialogTitle>
          <Paragraph size="lead" className="uppercase">
            {name}
          </Paragraph>
        </DialogTitle>
      </DialogHeader>
      {references && referencesDoc?.content && (
        <ReferencesDialogContent doc={referencesDoc} />
      )}
      {tools && <ToolsContent tools={tools} hover={false} />}
    </DialogContent>
  </Dialog>
)

export default DetailsDialog
