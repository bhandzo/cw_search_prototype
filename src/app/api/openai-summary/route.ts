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
          content: `You are an expert at analyzing candidate profiles and providing concise, relevant summaries.

For each candidate, provide two summaries:
1. shortSummary (1 sentence): Focus on the most relevant qualifications and experience that match the search criteria. Be direct and specific.

2. longSummary (2-3 sentences): Provide additional context about their background, skills, and achievements that demonstrate their fit for the role.

Keep summaries focused on the candidate's qualifications. Avoid phrases like "This candidate appears in the results because" or "This person was included because".

Example shortSummary: "Senior Frontend Engineer with 6 years of React experience at major Seattle tech companies."
Example longSummary: "Led development teams at Amazon and Microsoft, specializing in large-scale web applications. Strong background in Vue.js and Node.js with a track record of mentoring junior developers."`,
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

    // Split the content into the two summaries and clean them
    const [shortSummary, longSummary] = content
      .split("\n\n")
      .filter(Boolean)
      .map(summary => 
        summary
          .replace(/^[12]\.\s*/, "") // Remove numbered labels
          .replace(/^(Short|Long) Summary:\s*/i, "") // Remove any "Short Summary:" or "Long Summary:" labels
      );

    return NextResponse.json({
      shortSummary,
      longSummary,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
