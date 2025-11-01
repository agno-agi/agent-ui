'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-background-secondary border border-border shadow-lg text-secondary',
          title: 'text-secondary font-medium',
          description: 'text-muted',
          actionButton:
            'bg-primary text-primaryAccent',
          cancelButton:
            'bg-muted text-secondary'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
