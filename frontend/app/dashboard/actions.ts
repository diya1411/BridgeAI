"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";

export interface SummaryResult {
  role: string;
  stream: ReturnType<typeof createStreamableValue<string>>;
}

/**
 * Generate an embedding for the input text and retrieve relevant context
 */
async function getRelevantContext(text: string): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      console.warn("No API key found, skipping RAG context retrieval");
      return "";
    }

    // Generate embedding for the user's input text
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to generate embedding for context retrieval');
      return "";
    }

    const data = await response.json();
    const embedding = data.embedding.values;

    // Search for similar documents in the vector database
    const supabase = createClient();
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3
    });

    if (error) {
      console.error('Error retrieving context from database:', error);
      return "";
    }

    if (!documents || documents.length === 0) {
      return "";
    }

    // Format the retrieved context
    const contextText = documents
      .map((doc: any, index: number) => `[Context ${index + 1}]: ${doc.content}`)
      .join('\n\n');

    return contextText;
  } catch (error) {
    console.error('Error in getRelevantContext:', error);
    return "";
  }
}

/**
 * Generate a role-specific summary using Gemini 2.0 Flash
 * with streaming for real-time updates
 */
function getSystemPrompt(role: string): string {
  switch (role) {
    case "Developer":
      return `You are a senior software engineer. Your task is to interpret the provided text and generate a summary for a technical audience.

Focus exclusively on the implementation details and format your response as clear, readable paragraphs (NOT bullet points or markdown):

• Code Changes: Describe what code needs to be modified or added
• Dependencies: List any new libraries, packages, or tools required
• Database: Mention any schema changes or migrations
• Technical Challenges: Explain non-obvious challenges or trade-offs
• API Changes: List any APIs that were changed, added, or removed

Write in a conversational but technical tone. Use line breaks between sections for readability. Avoid markdown symbols like asterisks, hyphens, or hash symbols.`;
    case "PM":
      return `You are a product manager. Your task is to interpret the provided text and generate a summary for a business and product-focused audience.

Focus on the "why" and the impact on the user. Format your response as clear, readable paragraphs (NOT bullet points or markdown):

• User Problem: What problem does this solve for users?
• User Value: What is the core benefit users will experience?
• User Experience: How does this change the user workflow?
• New Features: What new capabilities are users getting?

Write in clear, non-technical language. Use line breaks between sections for readability. Avoid implementation details, code references, and markdown symbols.`;
    case "Support":
      return `You are a customer support specialist. Your task is to interpret the provided text and generate a summary that will help you assist users.

Focus on what users need to know and what might go wrong. Format your response as clear, readable paragraphs (NOT bullet points or markdown):

• Key Changes: What are the main user-facing changes?
• Common Questions: What questions might users ask about this?
• Troubleshooting: What are common issues and how to fix them?
• Customer Talking Points: How would you explain this to a customer?

Write in a practical, action-oriented tone. Use line breaks between sections for readability. Avoid technical jargon and markdown symbols.`;
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

      // Retrieve relevant context from the knowledge base
      const relevantContext = await getRelevantContext(text);

      // Augment the prompt with retrieved context
      let augmentedPrompt = text;
      if (relevantContext) {
        augmentedPrompt = `Here is some relevant context from similar projects and pull requests:

${relevantContext}

---

Now, based on the above context and the following text, generate your summary:

${text}`;
      }

      const result = await streamText({
        model: google("gemini-2.0-flash-exp"),
        system: systemPrompt,
        prompt: augmentedPrompt,
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
