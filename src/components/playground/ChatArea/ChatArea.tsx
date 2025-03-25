"use client";

import ChatInput from "./ChatInput";

const ChatArea = () => {

  return (
    <main className="relative flex flex-col flex-grow bg-background rounded-xl m-1.5">
      <ChatArea />
      <div className="sticky bottom-0 px-4 pb-2 ml-9">
        <ChatInput />
      </div>
    </main>
  );
};

export default ChatArea;
