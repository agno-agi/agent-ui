'use client'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import { ChatArea } from '@/components/playground/ChatArea'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'

export default function Home() {
  const [showToolCalls, setShowToolCalls] = useState<boolean>(true);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen bg-background/80">
        <Sidebar showToolCalls={showToolCalls} setShowToolCalls={setShowToolCalls}/>
        <ChatArea />
      </div>
    </Suspense>
  )
}
