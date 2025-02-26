import { type ReactNode } from 'react'

import ToolsContent from '@/components/common/Chat/Tools'
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
  type Message
} from '@/types/Agent'

import ReferencesDialogContent from '../References/ReferencesDialogContent'

interface DetailsDialogProps {
  tools?: Message
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
