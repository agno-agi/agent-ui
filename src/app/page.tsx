"use client";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea/ChatArea";
import ChatInput from "@/components/ChatArea/ChatInput/ChatInput";

export default function Home() {
  return (
    <div className="flex h-screen bg-background/80">
      <Sidebar />
      <main className="relative flex flex-col flex-grow bg-background/100 rounded-xl m-1.5">
        <ChatArea />
        <div className="sticky bottom-0 px-4 pb-2 ml-9">
          <ChatInput />
        </div>
      </main>
    </div>
  );
}
