import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

async function getOpenAIKey() {
  // Try environment variable first
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Fall back to credentials cookie
  const credentialsCookie = (await cookies()).get("credentials");
  if (!credentialsCookie) {
    throw new Error("No credentials found");
  }

  const credentials = JSON.parse(decodeURIComponent(credentialsCookie.value));
  if (!credentials.openaiApiKey) {
    throw new Error("No OpenAI API key found in credentials");
  }

  return credentials.openaiApiKey;
}

function isFetchError(error: unknown): error is { response: Response } {
  return (
    error instanceof Error &&
    "response" in error &&
    error.response instanceof Response
  );
}

export async function POST(request: Request) {
  try {
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    const body = await request.json();
    const { userInput } = body;

    console.log("Received user input:", userInput);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are an expert at breaking down job search queries into categorized keywords.

Your task is to analyze a natural language job search query and return a JSON object of keywords organized by category. Only include categories that are explicitly mentioned or strongly implied in the query.

Possible categories (only use what's relevant):
- location: Cities, regions, or work arrangements (e.g., remote). Try to include the most relevant locations (e.g. Santa Monica for Los Angeles, Brooklyn for New York City, etc.).
- title: Job titles and roles (try to "bloom" out the title to include more relevant titles)
- experience: Years or level of experience (without overdoing it, include specific years, so for example 11, 12, 13, etc.)
- industry: Specific sectors or company types
- skills: Technical skills, tools, or competencies

Format the response as a JSON object with category keys and array values:
{
  "title": ["keyword3", "keyword4"],
  "location": ["keyword5", "keyword6"],
  "experience": ["keyword7", "keyword8"],
  "industry": ["keyword9", "keyword10"],
  "skills": ["keyword11", "keyword12"]
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

Return only valid JSON without any extra text or explanations. Ensure the JSON is properly formatted without any syntax errors.`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
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

    return NextResponse.json(
      {
        structuredQuery,
        originalInput: userInput,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
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
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
