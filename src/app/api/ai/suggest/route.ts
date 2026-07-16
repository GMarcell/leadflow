import { auth } from "@/lib/auth"
import { getUserRole, forbidden } from "@/lib/authorization"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // VIEWER cannot use AI features (saves API credits)
    if (getUserRole(session) === "VIEWER") {
      return forbidden()
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { leadName, leadStage, notes, daysSinceLastContact } = body

    if (!leadName || !leadStage) {
      return Response.json(
        { error: "Lead name and stage are required" },
        { status: 400 }
      )
    }

    const prompt = `Lead: ${leadName}
Stage: ${leadStage.replace("_", " ")}
Days since last contact: ${daysSinceLastContact || "Unknown"}
${notes ? `Recent notes: ${notes}` : ""}

Based on this information, suggest a specific follow-up action. Include:
1. What to say/do
2. The best channel (email, phone, in-person)
3. A specific talking point or question to ask

Keep it concise and actionable (2-3 sentences).`

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a sales coach. Give actionable follow-up advice based on the lead's stage and history. Be specific and practical.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 300,
    })

    const suggestion = completion.choices[0]?.message?.content || "Could not generate suggestion."

    return Response.json({ suggestion })
  } catch (error) {
    console.error("AI suggestion error:", error)
    return Response.json(
      { error: "AI suggestion failed. Check your Groq API key and try again." },
      { status: 500 }
    )
  }
}
