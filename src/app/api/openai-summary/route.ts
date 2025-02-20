import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  // Get OpenAI API key
  let apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fall back to credentials cookie
    const credentialsCookie = (await cookies()).get("credentials");
    if (!credentialsCookie) {
      throw new Error("No OpenAI API key found - please configure in settings");
    }
    
    const credentials = JSON.parse(decodeURIComponent(credentialsCookie.value));
    if (!credentials.openaiApiKey) {
      throw new Error("No OpenAI API key found - please configure in settings");
    }
    
    apiKey = credentials.openaiApiKey;
  }

  const openai = new OpenAI({ apiKey });
  try {
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

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Failed to generate summary");
    }

    // Split the content into the two summaries
    const [shortSummary, longSummary] = content
      .split("\n\n")
      .filter(Boolean)
      .map(summary => summary.trim());

    return NextResponse.json({
      shortSummary,
      longSummary,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
