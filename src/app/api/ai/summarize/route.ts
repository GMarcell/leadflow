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
        { error: "GROQ_API_KEY not configured. Add it to your .env file." },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string") {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a sales assistant. Summarize the following call/meeting notes into a concise summary (2-3 sentences) followed by a suggested next action. Format as:\n\nSummary: [brief summary]\n\nNext Action: [specific action item]",
        },
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const summary = completion.choices[0]?.message?.content || "Could not generate summary."

    return Response.json({ summary })
  } catch (error) {
    console.error("AI summarization error:", error)
    return Response.json(
      { error: "AI summarization failed. Check your Groq API key and try again." },
      { status: 500 }
    )
  }
}
