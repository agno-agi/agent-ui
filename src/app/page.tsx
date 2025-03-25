'use client'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import { ChatArea, ChatInput } from '@/components/playground/ChatArea'
import { Suspense } from 'react'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen bg-background/80">
        <Sidebar />
        <main className="relative m-1.5 flex flex-grow flex-col rounded-xl bg-background">
          <ChatArea />
          <div className="sticky bottom-0 ml-9 px-4 pb-2">
            <ChatInput />
          </div>
        </main>
      </div>
    </Suspense>
  )
}
