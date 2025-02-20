import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput } = body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a search query builder. Convert natural language queries into Elasticsearch-style boolean queries. Only return the query string, nothing else."
        },
        {
          role: "user",
          content: userInput
        }
      ],
      temperature: 0.1,
    });

    const structuredQuery = completion.choices[0].message.content;

    return NextResponse.json({
      structuredQuery,
      originalInput: userInput
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
