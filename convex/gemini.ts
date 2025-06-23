"use node";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { action } from "./_generated/server";
import { v } from "convex/values";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const systemPrompt = `
  You are a helpful fitness assistant. Your job is to collect and validate the following fields:
  - Age 
  - Height (in cm or feet)
  - Weight (in kg or lbs)
  - Fitness goal (e.g., lose fat, build muscle)
  - Workout days (e.g., monday, wednesday, friday, etc.)
  - Fitness level (e.g.,beginner, intermediate, advanced)
  - Injuries (e.g., tearing ACL, wrist injuries, etc.)
  - Diet preference (e.g., vegetarian, keto, none)

  Ask one question at a time. If the answer is missing, irrelevant, or invalid, ask again.
  Once all valid values are collected, lastly confirm the information listing the values down one by one, and after confirmation say: "Thank you for the information, kindly click Generate Program!"
`;

export const generate = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("model")),
        parts: v.string(),
      })
    ),
  },
  async handler(ctx, { messages }) {
    // Filter out invalid leading model message
    let filtered = messages[0]?.role === "model" ? messages.slice(1) : messages;

    // Insert systemPrompt as first user message
    filtered = [
      { role: "user", parts: systemPrompt },
      ...filtered,
    ];

    const model = genAi.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        temperature: 0.7,
      },
    });

    const chat = model.startChat({
      history: filtered.map((m) => ({
        role: m.role,
        parts: [{ text: m.parts }],
      })),
    });

    const result = await chat.sendMessage("Continue");
    const response = result.response;
    const text = await response.text();
    return text;
  },
});
