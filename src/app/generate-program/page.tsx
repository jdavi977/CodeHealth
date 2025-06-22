"use client"

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

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

  const sendToGemini = async (
    conversation: ChatMessage[]
  ): Promise<string | undefined> => {
    const contents = conversation.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });
    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, something went wrong."
    );
  };

  const handleSend = async () => {
    if (!inputRef.current || !inputRef.current.value.trim()) return;
    const text = inputRef.current.value.trim();
    inputRef.current.value = "";
    const convo = [...messages, { role: "user", content: text }];
    setMessages(convo);
    setLoading(true);
    try {
      const reply = await sendToGemini(convo);
      if (reply) {
        setMessages([...convo, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = () => {
    setStarted(true);
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm your fitness assistant. Let's talk about your goals.",
      },
    ]);
  };

  const createProgram = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CONVEX_URL}/generate-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        }
      );
      const data = await res.json();
      if (data.plan) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.plan },
        ]);
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
    <div className="flex flex-col min-h-screen text-foreground pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground">
            Chat with our AI assistant to build your personalized plan
          </p>
        </div>

        {messages.length > 0 && (
          <div
            ref={messageContainerRef}
            className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-4 h-64 overflow-y-auto"
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

        {started && (
          <div className="flex gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message"
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

        <div className="flex justify-center gap-4">
          {!started ? (
            <Button className="w-40 text-xl rounded-3xl" onClick={startConversation}>
              Start Conversation
            </Button>
          ) : (
            <Button
              className="w-40 text-xl rounded-3xl"
              onClick={createProgram}
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
