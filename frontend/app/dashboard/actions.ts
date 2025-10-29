"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface SummaryResult {
  role: string;
  stream: ReturnType<typeof createStreamableValue<string>>;
}

/**
 * Generate a role-specific summary using Gemini 2.0 Flash
 * with streaming for real-time updates
 */
export async function generateRoleSummary(text: string, role: string) {
  const stream = createStreamableValue("");

  // Run streaming in background
  (async () => {
    try {
      // Use the correct environment variable name for AI SDK
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      if (!apiKey || apiKey === 'your_google_api_key_here') {
        stream.error(new Error("Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local"));
        return;
      }

      // Create Google AI instance with API key
      const google = createGoogleGenerativeAI({ apiKey });

      const systemPrompt = `You are a technical translator. Your job is to explain technical content clearly for ${role} teams.

${role === "Developer" ? "Focus on: What changed in the code, technical decisions made, implementation approach, and any technical debt or future considerations." : ""}${role === "PM" ? "Focus on: What shipped, why it matters to users, timeline impact, and what this enables for the product." : ""}${role === "Support" ? "Focus on: What users will notice, potential issues to watch for, and how to explain changes to customers." : ""}

Write 2-3 short paragraphs. Be direct. Avoid fluff.`;

      const result = await streamText({
        model: google("gemini-2.0-flash-exp"),
        system: systemPrompt,
        prompt: text,
        temperature: 0.3, // Lower temperature for more consistent, focused summaries
      });

      // Stream each text chunk as it arrives
      for await (const textPart of result.textStream) {
        stream.update(textPart);
      }

      stream.done();
    } catch (error) {
      console.error(`Error generating ${role} summary:`, error);
      stream.error(error);
    }
  })();

  return stream.value;
}

/**
 * Generate all three role summaries in parallel for maximum speed
 */
export async function generateAllSummaries(text: string) {
  const roles = ["Developer", "PM", "Support"] as const;

  // Start all three streams in parallel
  const summaryPromises = roles.map(async (role) => ({
    role,
    stream: await generateRoleSummary(text, role),
  }));

  return Promise.all(summaryPromises);
}
