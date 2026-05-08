'use client'

import { FC, useState } from 'react'
import Icon from '@/components/ui/icon/Icon'

interface CodeBlockProps {
  children?: React.ReactNode
  className?: string
  language?: string // Optional: specify the programming language
}

const CodeBlock: FC<CodeBlockProps> = ({ children, className, language }) => {
  const [copied, setCopied] = useState(false)

  const codeContent =
    typeof children === 'string' ? children : String(children || '')
  const langs = language || className?.replace(/language-/, '') || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="border-border bg-background-secondary relative w-full overflow-hidden rounded-lg border">
      {/* Header with language and copy button */}
      <div className="bg-background-secondary/50 border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-muted text-xs font-semibold uppercase">
          {langs || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="hover:bg-background-secondary text-muted hover:text-primary flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-all duration-200"
          title="Copy code"
        >
          {copied ? (
            <>
              <Icon type="check" size="xs" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
              >
                <path
                  d="M13.5 1.5H4.5C3.94772 1.5 3.5 1.94772 3.5 2.5V10.5C3.5 11.0523 3.94772 11.5 4.5 11.5H13.5C14.0523 11.5 14.5 11.0523 14.5 10.5V2.5C14.5 1.94772 14.0523 1.5 13.5 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 14.5H11.5C12.0523 14.5 12.5 14.0523 12.5 13.5V4"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="text-foreground p-4 text-sm leading-relaxed">
          <code className="font-mono">{codeContent}</code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
