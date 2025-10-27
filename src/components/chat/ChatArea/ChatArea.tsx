'use client'

import ChatInput from './ChatInput'
import MessageArea from './MessageArea'
import ReasoningViewer from './ReasoningViewer'
const ChatArea = () => {
  return (
    <main className="relative m-1.5 flex flex-grow overflow-hidden rounded-xl bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <MessageArea />
        <div className="sticky bottom-0 ml-9 px-4 pb-2">
          <ChatInput />
        </div>
      </div>
      <ReasoningViewer />
    </main>
  )
}

export default ChatArea
