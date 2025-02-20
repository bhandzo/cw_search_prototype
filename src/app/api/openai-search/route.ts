import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function isFetchError(error: any): error is { response: Response } {
  return error && error.response && error.response instanceof Response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput } = body;

    console.log("Received user input:", userInput);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert at breaking down job search queries into categorized keywords.

Your task is to analyze a natural language job search query and return a structured list of keywords organized by category. Only include categories that are explicitly mentioned or strongly implied in the query.

Possible categories (only use what's relevant):
- Location: Cities, regions, or work arrangements (e.g., remote)
- Title: Job titles and roles
- Experience: Years or level of experience
- Industry: Specific sectors or company types
- Skills: Technical skills, tools, or competencies

Format the response as:
Category: keyword1, keyword2, keyword3

Example query: "senior software engineer in Seattle with 5+ years React experience"
Would return:
Location: seattle, bellevue, redmond
Title: software engineer, senior developer, tech lead
Experience: 5 years, senior level
Skills: react, javascript, frontend

Only include categories that are relevant to the query. Don't make up or infer categories that aren't mentioned.
Keep keywords simple without special characters or operators. Each keyword should be a single word or simple phrase. For each category try to create a fairly comprehensive list of keywords. 

### **User Input**
"${userInput}"

Return only the structured query in plain text without any extra explanations.`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.1,
    });

    console.log("OpenAI API response:", completion);

    const structuredQuery = completion.choices?.[0]?.message?.content?.trim();

    if (!structuredQuery) {
      console.error("Structured query is null or undefined");
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
