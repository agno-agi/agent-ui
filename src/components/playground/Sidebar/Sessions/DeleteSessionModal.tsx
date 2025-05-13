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

interface DeleteSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => Promise<void>
  isDeleting: boolean
}

const DeleteSessionModal: FC<DeleteSessionModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  isDeleting
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="font-geist">
      <DialogHeader>
        <DialogTitle>Patvirtinti</DialogTitle>
        <DialogDescription>
          Tai visam laikui ištrins šią sesiją.
          <br/>Ar tikrai norite tęsti?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          className="rounded-xl border-border font-geist"
          onClick={onClose}
          disabled={isDeleting}
        >
          ATŠAUKTI
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-xl font-geist"
        >
          IŠTRINTI
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default DeleteSessionModal
