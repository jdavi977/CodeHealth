"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";


interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

const GenerateProgramPage = () => {
  const { user } = useUser();
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const generateFromGemini = useAction(api.gemini.generate);


  {/* AUTO SCROLL */}
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = () => {
    setStarted(true);
    setMessages([
      {
        role: "assistant",
        content:
        `Hi ${user ? (user.firstName + " " + (user.lastName || "")).trim() : "Guest"}! I'm CodeHealth AI your personal fitness assistant. Ready to get started?`,
      },
    ]);
  };

const handleSend = async () => {
  if (!input.trim()) return;

  const userMessage: ChatMessage = { role: "user", content: input };
  const newMessages: ChatMessage[] = [...messages, userMessage];
  setMessages(newMessages);
  setInput("");
  setLoading(true);

  const geminiMessages = newMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" as const : "user" as const,
    parts: msg.content,
  }));

  try {
    const responseText = await generateFromGemini({ messages: geminiMessages });

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: responseText,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch (err) {
    console.error("Gemini API error:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex flex-col min-h-screen text-foreground pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-3xl">
        {/* TITLE */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground">
            Chat with our AI assistant to build your personalized plan!
          </p>
        </div>

        {/* VIDEO CALL AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI ASSISTANT CARD */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">

              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">

                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                  <img
                    src="/avatar1.png"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">CodeHealth AI</h2>
              <p className="text-sm text-muted-foreground mt-1">Fitness & Diet Coach</p>
              {/* Ready Text */}
              <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border`}>
                <div className={`w-2 h-2 rounded-full bg-muted`} />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
          </Card>

          {/* USER CARD */}
          <Card className={`bg-card/90 backdrop-blur-sm border overflow-hidden relative`}>
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* User Image */}
              <div className="relative size-32 mb-4">
                <img
                  src={user?.imageUrl}
                  alt="User"
                  // ADD THIS "size-full" class to make it rounded on all images
                  className="size-full object-cover rounded-full"
                />
              </div>

              <h2 className="text-xl font-bold text-foreground">You</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user ? (user.firstName + " " + (user.lastName || "")).trim() : "Guest"}
              </p>

              {/* Ready Text */}
              <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border`}>
                <div className={`w-2 h-2 rounded-full bg-muted`} />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
          </Card>
        </div>

        {/* MESSAGE CONTAINER */}
        {messages.length > 0 && (
          <div
            ref={messageContainerRef}
            className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-4 h-70 overflow-y-auto"
          >
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className="animate-fadeIn">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    {msg.role === "assistant" ? "CodeHealth AI" : "You"}:
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEXT BOX CONTAINER */}
        {started && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={input}
              placeholder="Type your message"
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow border rounded-md px-3 py-2 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={loading}>
              Send
            </Button>
          </div>
        )}

        {/* CONVERSATION BUTTON */}
        <div className="flex justify-center gap-4 pb-30">
          {!started ? (
            <Button className="w-70 text-xl rounded-3xl" onClick={startConversation}>
              Start Conversation
            </Button>
          ) : (
            <Button
              className="w-70 text-xl rounded-3xl"
              disabled={loading}
            >
              Generate Program
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;
