'use client'

import { FC, useState, useEffect } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

import type {
  UnorderedListProps,
  OrderedListProps,
  EmphasizedTextProps,
  ItalicTextProps,
  StrongTextProps,
  BoldTextProps,
  DeletedTextProps,
  UnderlinedTextProps,
  HorizontalRuleProps,
  BlockquoteProps,
  AnchorLinkProps,
  HeadingProps,
  ImgProps,
  ParagraphProps,
  TableHeaderCellProps,
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  PreparedTextProps
} from './types'

import { HEADING_SIZES } from '../Heading/constants'
import { PARAGRAPH_SIZES } from '../Paragraph/constants'

const filterProps = (props: object) => {
  const newProps = { ...props }

  if ('node' in newProps) {
    delete newProps.node
  }

  return newProps
}

const UnorderedList = ({ className, ...props }: UnorderedListProps) => (
  <ul
    className={cn(
      className,
      PARAGRAPH_SIZES.body,
      'flex list-disc flex-col pl-10'
    )}
    {...filterProps(props)}
  />
)

const OrderedList = ({ className, ...props }: OrderedListProps) => (
  <ol
    className={cn(
      className,
      PARAGRAPH_SIZES.body,
      'flex list-decimal flex-col pl-10'
    )}
    {...filterProps(props)}
  />
)

const Paragraph = ({ className, ...props }: ParagraphProps) => (
  <div
    className={cn(className, PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const EmphasizedText = ({ className, ...props }: EmphasizedTextProps) => (
  <em
    className={cn(className, 'text-sm font-semibold')}
    {...filterProps(props)}
  />
)

const ItalicText = ({ className, ...props }: ItalicTextProps) => (
  <i
    className={cn(className, 'italic', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const StrongText = ({ className, ...props }: StrongTextProps) => (
  <strong
    className={cn(className, 'text-sm font-semibold')}
    {...filterProps(props)}
  />
)

const BoldText = ({ className, ...props }: BoldTextProps) => (
  <b
    className={cn(className, 'text-sm font-semibold')}
    {...filterProps(props)}
  />
)

const UnderlinedText = ({ className, ...props }: UnderlinedTextProps) => (
  <u
    className={cn(className, 'underline', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const DeletedText = ({ className, ...props }: DeletedTextProps) => (
  <del
    className={cn(className, 'text-muted line-through', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const HorizontalRule = ({ className, ...props }: HorizontalRuleProps) => (
  <hr
    className={cn(className, 'mx-auto w-48 border-b border-border')}
    {...filterProps(props)}
  />
)

const InlineCode: FC<PreparedTextProps> = ({ children }) => {
  return (
    <code className="relative whitespace-pre-wrap rounded-sm bg-background-secondary/50 p-1">
      {children}
    </code>
  )
}

const Blockquote = ({ className, ...props }: BlockquoteProps) => (
  <blockquote
    className={cn(className, 'italic', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const AnchorLink = ({ className, ...props }: AnchorLinkProps) => (
  <a
    className={cn(className, 'cursor-pointer text-xs underline')}
    target="_blank"
    rel="noopener noreferrer"
    {...filterProps(props)}
  />
)

const Heading1 = ({ className, ...props }: HeadingProps) => (
  <h1 className={cn(className, HEADING_SIZES[3])} {...filterProps(props)} />
)

const Heading2 = ({ className, ...props }: HeadingProps) => (
  <h2 className={cn(className, HEADING_SIZES[3])} {...filterProps(props)} />
)

const Heading3 = ({ className, ...props }: HeadingProps) => (
  <h3 className={cn(className, PARAGRAPH_SIZES.lead)} {...filterProps(props)} />
)

const Heading4 = ({ className, ...props }: HeadingProps) => (
  <h4 className={cn(className, PARAGRAPH_SIZES.lead)} {...filterProps(props)} />
)

const Heading5 = ({ className, ...props }: HeadingProps) => (
  <h5
    className={cn(className, PARAGRAPH_SIZES.title)}
    {...filterProps(props)}
  />
)

const Heading6 = ({ className, ...props }: HeadingProps) => (
  <h6
    className={cn(className, PARAGRAPH_SIZES.title)}
    {...filterProps(props)}
  />
)

const Img = ({ src, alt }: ImgProps) => {
  const [error, setError] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | undefined>();

  // Convert Blob to object URL if needed
  // Only run when src changes
  useEffect(() => {
    if (src instanceof Blob) {
      const url = URL.createObjectURL(src);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(undefined);
    }
  }, [src]);

  if (!src) return null;

  // Use objectUrl if src is a Blob, otherwise use src directly
  const imageSrc = src instanceof Blob ? objectUrl : src;

  return (
    <div className="w-full max-w-xl">
      {error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md bg-secondary/50 text-muted">
          <Paragraph className="text-primary">Image unavailable</Paragraph>
          <Link
            href={typeof src === "string" ? src : ""}
            target="_blank"
            className="max-w-md truncate underline"
          >
            {typeof src === "string" ? src : "Blob"}
          </Link>
        </div>
      ) : (
        imageSrc && (
          <Image
            src={imageSrc}
            width={1280}
            height={720}
            alt={alt ?? "Rendered image"}
            className="size-full rounded-md object-cover"
            onError={() => setError(true)}
            unoptimized
          />
        )
      )}
    </div>
  );
}

const Table = ({ className, ...props }: TableProps) => (
  <div className="w-full max-w-[560px] overflow-hidden rounded-md border border-border">
    <div className="w-full overflow-x-auto">
      <table className={cn(className, 'w-full')} {...filterProps(props)} />
    </div>
  </div>
)

const TableHead = ({ className, ...props }: TableHeaderProps) => (
  <thead
    className={cn(
      className,
      'rounded-md border-b border-border bg-transparent p-2 text-left text-sm font-[600]'
    )}
    {...filterProps(props)}
  />
)

const TableHeadCell = ({ className, ...props }: TableHeaderCellProps) => (
  <th
    className={cn(className, 'p-2 text-sm font-[600]')}
    {...filterProps(props)}
  />
)

const TableBody = ({ className, ...props }: TableBodyProps) => (
  <tbody className={cn(className, 'text-xs')} {...filterProps(props)} />
)

const TableRow = ({ className, ...props }: TableRowProps) => (
  <tr
    className={cn(className, 'border-b border-border last:border-b-0')}
    {...filterProps(props)}
  />
)

const TableCell = ({ className, ...props }: TableCellProps) => (
  <td
    className={cn(className, 'whitespace-nowrap p-2 font-[400]')}
    {...filterProps(props)}
  />
)

export const components = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  ul: UnorderedList,
  ol: OrderedList,
  em: EmphasizedText,
  i: ItalicText,
  strong: StrongText,
  b: BoldText,
  u: UnderlinedText,
  del: DeletedText,
  hr: HorizontalRule,
  blockquote: Blockquote,
  code: InlineCode,
  a: AnchorLink,
  img: Img,
  p: Paragraph,
  table: Table,
  thead: TableHead,
  th: TableHeadCell,
  tbody: TableBody,
  tr: TableRow,
  td: TableCell
}
