import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { person, originalQuery, keywords } = body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing candidate information and providing concise summaries.`,
        },
        {
          role: "user",
          content: `This person was returned in a search of people in an ATS using the following user query: "${originalQuery}" and keywords: ${JSON.stringify(
            keywords
          )}

Person information:
${JSON.stringify(person, null, 2)}

Write two summaries:
1. A single sentence explaining why this person was included in the results
2. A paragraph length summary describing how well they meet the search criteria, based on their job history, education, and ATS notes`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Failed to generate summary");
    }

    // Split the content into the two summaries
    const [shortSummary, longSummary] = content.split("\n\n").filter(Boolean);

    return NextResponse.json({
      shortSummary: shortSummary.replace(/^1\.\s*/, ""),
      longSummary: longSummary.replace(/^2\.\s*/, ""),
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
