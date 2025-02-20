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
          content: `You are an expert in generating structured search queries for an Elasticsearch-powered candidate database.

The database supports searching across multiple fields, including:
- name, nick_name, first_name, last_name
- primary_position, company_name, website_address
- positions (historical and current job roles)
- biography (keywords from resumes)
- phone_number, email_addresses
- tags, attachments, and firm-specific fields

The search is executed through a query string parameter (q) that supports Boolean logic (AND, OR, NOT), exact phrases ("..."), and range queries (field:[NOW-5y TO NOW] for date ranges).

Your task is to convert natural language job searches into structured query strings optimized for this system. Try to be fairly broad with how you help the user find who they are looking for by using similar job titles, experience descriptions, or geographies (including nearby cities for example)

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
