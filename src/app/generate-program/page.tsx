"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

const systemPrompt = `
  You are a helpful fitness assistant. Your job is to collect and validate the following fields:
  - Age (13–100)
  - Height (in cm, 100–250)
  - Weight (in kg or lbs, 30–200kg or 66–440lbs)
  - Fitness goal (e.g., lose fat, build muscle)
  - Workout days (e.g., monday, wednesday, friday, etc.)
  - Fitness level (e.g.,beginner, intermediate, advanced)
  - Injuries (e.g., teating ACL, wrist injuries, etc.)
  - Diet preference (e.g., vegetarian, keto, none)
  Ask one question at a time. If the answer is missing or invalid, ask again.
  Once all valid values are collected, say: "Thank you for the information, kindly click Generate Plan!"
`;  

const GenerateProgramPage = () => {
  const { user } = useUser();
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userFields, setUserFields] = useState({
    age:"",
    weight:"",
    height:"",
    fitness_goal:"",
    workout_days:"",
    fitness_level:"",
    injuries:"",
    dietary_restrictions:"",
  });
  const [completed, setCompleted] = useState(false);


  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
      temperature: 0.4, // lower temperature for more predictable outputs
      topP: 0.9,
      responseMimeType: "application/json",
    },
  });

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
          `Hi ${user ? (user.firstName + " " + (user.lastName || "")).trim() : "User"}! I'm your AI fitness assistant. Lets get started!`,
      },
    ]);
  };

const handleSend = async (userMessage: string) => {
    const convo: ChatMessage[] = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(convo);
    inputRef.current!.value = ""; // Clear box
    setLoading(true);

    try {
      const reply = await sendToGemini(convo);
      if (reply) {
        setMessages([...convo, { role: "assistant" as const, content: reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const sendToGemini = async (conversation: ChatMessage[]) => {
  const chatHistory = conversation.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user", 
    parts: [{ text: msg.content }],
  }));

  try {
    const chat = await model.startChat({
      history: [
        {
          role: "system",
          parts: [{ text: systemPrompt }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(conversation[conversation.length - 1].content);
    const reply = await result.response.text();
    return reply;
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Sorry, I had trouble generating a response.";
  }
};


  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-5xl">
        {/* TITLE */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground">
            Chat with our AI assistant to build your personalized plan
          </p>
        </div>

        {/* VIDEO CALL AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI ASSISTANT CARD */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">

              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">
                <div
                  className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg`}
                />

                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                  <img
                    src="/avatar1.png"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">CodeFlex AI</h2>
              <p className="text-sm text-muted-foreground mt-1">Fitness & Diet Coach</p>

              {/* AI Ready Text */}
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

              {/* User Ready Text */}
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

        {/* TYPE BOX CONTAINER */}
        {started && (
          <div className="flex gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message"
              className="flex-grow border rounded-md px-3 py-2 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputRef.current) {
                  e.preventDefault();
                  const text = inputRef.current.value.trim();
                  if (text) handleSend(text)
                }} 
              }
            />
            <Button onClick={() => {
              if (inputRef.current) {
                const text = inputRef.current.value.trim();
                if (text) handleSend(text)
              }
            }} 
          disabled={loading}>
              Send
            </Button>
          </div>
        )}

        {/* CONVERSATION/ GENERATE BUTTON */}
        <div className="flex justify-center gap-4">
          {!started ? (
            <Button className="w-70 text-xl rounded-3xl" onClick={startConversation}>
              Start Conversation
            </Button>
          ) : (
            <Button
              className="w-70 text-xl rounded-3xl"
              disabled={loading}
            >
              Create Program
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;
