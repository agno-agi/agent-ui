import type { ReactNode } from 'react'

type ParagraphSizes =
  | 'xs'
  | 'sm'
  | 'default'
  | 'lg'
  | 'lead'
  | 'title'
  | 'body'
  | 'mono'
  | 'xsmall'

export interface ParagraphProps {
  children: ReactNode
  size?: ParagraphSizes
  className?: string
  id?: string
}

export type ParagraphSizeMap = {
  [key in ParagraphSizes]: string
}
