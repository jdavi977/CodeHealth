import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const chatHistory = (messages as { role: string; content: string }[]).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = await model.startChat({
      history: [
        {
          role: "system",
          parts: [{ text: systemPrompt }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const reply = await result.response.text();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini Error:", error);
    return new NextResponse("Gemini request failed", { status: 500 });
  }
}
