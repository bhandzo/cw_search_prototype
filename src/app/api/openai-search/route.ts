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
          content: `You are an expert at breaking down job search queries into relevant keywords.

Your task is to analyze a natural language job search query and return a comma-separated list of relevant keywords that would help find matching candidates. Include variations of job titles, skills, and locations that would be relevant.

For example:
"senior software engineer in Seattle with React experience"
Would return:
software engineer, senior developer, react, frontend, web development, seattle, bellevue, redmond, puget sound

Keep the keywords simple and avoid special characters or operators. Each keyword should be a single word or simple phrase.

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
