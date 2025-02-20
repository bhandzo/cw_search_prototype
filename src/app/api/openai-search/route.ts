import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (await (await fetch("/api/credentials")).json()).openaiApiKey,
});

function isFetchError(error: unknown): error is { response: Response } {
  return (
    error instanceof Error &&
    "response" in error &&
    error.response instanceof Response
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput } = body;

    console.log("Received user input:", userInput);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert at breaking down job search queries into categorized keywords.

Your task is to analyze a natural language job search query and return a JSON object of keywords organized by category. Only include categories that are explicitly mentioned or strongly implied in the query.

Possible categories (only use what's relevant):
- location: Cities, regions, or work arrangements (e.g., remote)
- title: Job titles and roles
- experience: Years or level of experience
- industry: Specific sectors or company types
- skills: Technical skills, tools, or competencies

Format the response as a JSON object with category keys and array values:
{
  "location": ["keyword1", "keyword2"],
  "title": ["keyword3", "keyword4"],
  etc...
}

Example query: "senior software engineer in Seattle with 5+ years React experience"
Would return:
{
  "location": ["seattle", "bellevue", "redmond"],
  "title": ["software engineer", "senior developer", "tech lead"],
  "experience": ["5 years", "senior level"],
  "skills": ["react", "javascript", "frontend"]
}

Only include categories that are relevant to the query. Don't make up or infer categories that aren't mentioned.
Keep keywords simple without special characters or operators. Each keyword should be a single word or simple phrase.

Return only valid JSON without any extra text or explanations.`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.1,
    });

    console.log(
      "OpenAI API full response:",
      JSON.stringify(completion, null, 2)
    );

    // Validate response structure
    if (!completion.choices || completion.choices.length === 0) {
      console.error("No choices in completion response");
      throw new Error("Invalid API response structure - no choices");
    }

    const firstChoice = completion.choices[0];
    console.log("First choice:", JSON.stringify(firstChoice, null, 2));

    if (!firstChoice.message) {
      console.error("No message in first choice");
      throw new Error("Invalid API response structure - no message");
    }

    const messageContent = firstChoice.message.content;
    console.log("Message content:", messageContent);

    if (!messageContent) {
      console.error("No content in message");
      throw new Error("Invalid API response structure - no content");
    }

    // Try parsing the content as JSON to validate it's properly formatted
    let structuredQuery;
    try {
      // First trim any whitespace
      const trimmedContent = messageContent.trim();
      // Attempt to parse as JSON to validate format
      JSON.parse(trimmedContent);
      // If parse succeeds, use the trimmed content
      structuredQuery = trimmedContent;
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      console.error("Raw content:", messageContent);
      throw new Error("Invalid JSON in API response");
    }

    if (!structuredQuery) {
      console.error("Structured query is null or undefined");
      console.error("Response structure:", {
        hasChoices: !!completion.choices,
        choicesLength: completion.choices?.length,
        hasFirstChoice: !!firstChoice,
        hasMessage: !!firstChoice?.message,
        hasContent: !!messageContent,
      });
      throw new Error("Failed to generate structured query");
    }

    return NextResponse.json({
      structuredQuery,
      originalInput: userInput,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);

    if (isFetchError(error)) {
      // Log specific error details from OpenAI API response
      console.error("OpenAI API response error:", error.response);
    } else if (error instanceof Error) {
      console.error("Unexpected error:", error.message);
    } else {
      console.error("Unknown error type");
    }

    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
