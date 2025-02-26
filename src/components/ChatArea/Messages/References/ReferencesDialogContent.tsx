import React from 'react'
import { type ReferencesDocsData } from './types'
import { isEmpty } from '@/utils/object'
import InfoDetails from '../InfoDetails/InfoDetails'

const ContextDialogContent = ({ doc }: { doc: ReferencesDocsData }) => (
  <div className="flex flex-col gap-y-4">
    {doc.content && (
      <InfoDetails title="Content" icon="details" content={doc.content} />
    )}
    {doc.meta_data.search_type && (
      <InfoDetails
        title="Search Type"
        icon="search"
        content={doc.meta_data.search_type}
      />
    )}
    {!isEmpty(doc.meta_data) && (
      <InfoDetails
        title="Meta Data"
        icon="info"
        content={doc.meta_data as object}
      />
    )}
  </div>
)

export default ContextDialogContent
