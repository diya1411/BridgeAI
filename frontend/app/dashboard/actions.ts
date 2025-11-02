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
function getSystemPrompt(role: string): string {
  switch (role) {
    case "Developer":
      return `You are a senior software engineer. Your task is to interpret the provided text and generate a summary for a technical audience.
Focus exclusively on the implementation details.
- What are the required code changes?
- Are there any new dependencies, libraries, or packages?
- Are there any database schema changes or data migrations?
- What are the non-obvious technical challenges or trade-offs?
- List any APIs that were changed, added, or removed.
Your summary should be concise, use a technical vocabulary, and be formatted as a bulleted list for clarity. Avoid any mention of business value or user-facing benefits.`;
    case "PM":
      return `You are a product manager. Your task is to interpret the provided text and generate a summary for a business and product-focused audience.
Focus on the "why" and the impact on the user.
- What user problem does this solve?
- What is the core user-facing value or benefit?
- How does this change the user experience or workflow?
- Are there any new features or capabilities the user should know about?
Your summary should be written in clear, non-technical language. Avoid implementation details and code references. Frame it in terms of user value and product goals.`;
    case "Support":
      return `You are a customer support specialist. Your task is to interpret the provided text and generate a summary that will help you assist users.
Focus on what a user needs to know and what might go wrong.
- What are the key user-facing changes?
- What are some potential questions users might ask about this?
- What are the common troubleshooting steps for potential issues?
- Provide talking points or a sample explanation you can give to a customer.
Your summary should be practical, action-oriented, and anticipate customer confusion. Format it as a Q&A or a list of key points.`;
    default:
      return "You are a helpful assistant.";
  }
}

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

      const systemPrompt = getSystemPrompt(role);

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
