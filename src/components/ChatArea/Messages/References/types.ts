export interface ReferencesMetaData {
    search_type: 'hybrid'
    chunk_size: 1649
    chunk: 1
    file_name?: string
    page: 4
  }
  
  export interface ReferencesDocsData {
    content: string
    name: string
    meta_data: ReferencesMetaData
  }
  
  export interface ReferencesData {
    query: string
    references: ReferencesDocsData[]
    time: number
  }