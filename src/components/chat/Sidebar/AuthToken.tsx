'use client'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/icon'

const AuthToken = ({
  hasEnvToken,
  envToken
}: {
  hasEnvToken?: boolean
  envToken?: string
}) => {
  const { authToken, setAuthToken } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [tokenValue, setTokenValue] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    // Initialize with environment variable if available and no token is set
    if (hasEnvToken && envToken && !authToken) {
      setAuthToken(envToken)
      setTokenValue(envToken)
    } else {
      setTokenValue(authToken)
    }
    setIsMounted(true)
  }, [authToken, setAuthToken, hasEnvToken, envToken])

  const handleSave = () => {
    const cleanToken = tokenValue.trim()
    setAuthToken(cleanToken)
    setIsEditing(false)
    setIsHovering(false)
  }

  const handleCancel = () => {
    setTokenValue(authToken)
    setIsEditing(false)
    setIsHovering(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleClear = () => {
    setAuthToken('')
    setTokenValue('')
  }

  const displayValue = authToken
    ? `${'*'.repeat(Math.min(authToken.length, 20))}${authToken.length > 20 ? '...' : ''}`
    : 'NO TOKEN SET'

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-xs font-medium uppercase text-primary">
        Auth Token
      </div>
      {isEditing ? (
        <div className="flex w-full items-center gap-1">
          <input
            type="password"
            value={tokenValue}
            onChange={(e) => setTokenValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter authentication token..."
            className="flex h-9 w-full items-center text-ellipsis rounded-xl border border-primary/15 bg-accent p-3 text-xs font-medium text-muted placeholder:text-muted/50"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:cursor-pointer hover:bg-transparent"
          >
            <Icon type="save" size="xs" />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1">
          <motion.div
            className="relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border border-primary/15 bg-accent p-3 uppercase"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsEditing(true)}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <AnimatePresence mode="wait">
              {isHovering ? (
                <motion.div
                  key="token-display-hover"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-primary">
                    <Icon type="edit" size="xxs" /> EDIT TOKEN
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="token-display"
                  className="absolute inset-0 flex items-center justify-between px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium text-muted">
                    {isMounted ? displayValue : 'NO TOKEN SET'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          {authToken && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="hover:cursor-pointer hover:bg-transparent"
              title="Clear token"
            >
              <Icon type="x" size="xs" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default AuthToken
