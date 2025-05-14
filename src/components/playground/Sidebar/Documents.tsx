'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import AddDocumentModal from './AddDocumentModal'
import ViewDocumentModal from './ViewDocumentModal'
import { usePlaygroundStore, type Document } from '@/store'
import { useDocumentLoader } from '@/hooks/useDocumentLoader'
import { Skeleton } from '@/components/ui/skeleton'

const Documents = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  )

  // Select state slices individually
  const documentsData = usePlaygroundStore((state) => state.documentsData)
  const setDocumentsData = usePlaygroundStore((state) => state.setDocumentsData)
  const isDocumentsLoading = usePlaygroundStore(
    (state) => state.isDocumentsLoading
  )
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)

  const { loadDocuments, addDocument } = useDocumentLoader()

  useEffect((): (() => void) | void => {
    if (selectedEndpoint) {
      loadDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEndpoint])

  const handleAddDocument = async (name: string, content: string) => {
    await addDocument(name, content)
    setIsAddModalOpen(false)
  }

  const handleDeleteDocument = (idToDelete: string) => {
    setDocumentsData(
      documentsData?.filter((doc: Document) => doc.id !== idToDelete) ?? null
    )
  }

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsViewModalOpen(true)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex w-full items-center justify-between">
        <div className="text-xs font-medium uppercase">Documents</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAddModalOpen(true)}
          className="h-6 w-6"
        >
          <Icon type="plus-icon" size="xs" />
        </Button>
      </div>

      {isDocumentsLoading ? (
        <div className="flex w-full flex-col gap-1">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ) : documentsData === null || documentsData.length === 0 ? (
        <div className="text-muted flex h-20 w-full items-center justify-center rounded-lg border border-dashed text-center text-xs">
          <p>No documents found. Click + to add one.</p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-1">
          {documentsData.map((doc: Document) => (
            <div
              key={doc.id}
              className="border-primary/15 bg-accent text-muted hover:bg-accent/80 group relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-medium"
              onClick={() => handleViewDocument(doc)}
            >
              <span className="truncate pr-6 font-medium">{doc.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteDocument(doc.id)
                }}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 group-hover:opacity-100"
              >
                <Icon type="trash" size="xs" className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddDocument}
      />
      <ViewDocumentModal
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        document={selectedDocument}
      />
    </div>
  )
}

export default Documents
