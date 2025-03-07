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

export async function POST(request: Request) {
  try {
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    const body = await request.json();
    const { person, originalQuery, keywords } = body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing candidate profiles and providing concise, relevant summaries.

Provide two summaries, separated by two newlines:

First summary (1 sentence): Focus on the most relevant qualifications and experience that match the search criteria. Be direct and specific.

Second summary (2-3 sentences): Provide additional context about their background, skills, and achievements that demonstrate their fit for the role.

Keep summaries focused on the candidate's qualifications. Avoid phrases like "This candidate appears in the results because" or "This person was included because".

Example first summary: "Senior Frontend Engineer with 6 years of React experience at major Seattle tech companies."
Example second summary: "Led development teams at Amazon and Microsoft, specializing in large-scale web applications. Strong background in Vue.js and Node.js with a track record of mentoring junior developers."

Return ONLY the two summaries, separated by two newlines, with no labels or numbers.`,
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

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      throw new Error("Failed to generate summary");
    }

    return NextResponse.json(
      {
        shortSummary: summary.split("\n\n")[0],
        longSummary: summary.split("\n\n")[1],
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
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
