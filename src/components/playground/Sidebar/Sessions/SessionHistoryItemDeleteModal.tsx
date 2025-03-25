import { type FC } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface SessionHistoryItemDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => Promise<void>
  isDeleting: boolean
}

const SessionHistoryItemDeleteModal: FC<SessionHistoryItemDeleteModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  isDeleting
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="font-geist">
      <DialogHeader>
        <DialogTitle>Confirm delete session</DialogTitle>
        <DialogDescription>
          You are permanently deleting this session. This action is
          irreversible.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          className=" rounded-xl border-border font-geist"
          onClick={onClose}
          disabled={isDeleting}
        >
          CANCEL
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-xl font-geist"
        >
          DELETE
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default SessionHistoryItemDeleteModal
