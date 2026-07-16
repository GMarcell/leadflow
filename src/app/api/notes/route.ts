import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNoteSchema } from "@/lib/validation"
import { getUserRole, canModifyLead, unauthorized, forbidden } from "@/lib/authorization"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // VIEWER cannot create notes
    if (!canModifyLead(getUserRole(session))) {
      return forbidden()
    }

    const body = await request.json()
    const result = createNoteSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    // Verify lead belongs to user (or accessible by role)
    const role = getUserRole(session)
    const lead = await prisma.lead.findFirst({
      where: role === "ADMIN" || role === "MANAGER"
        ? { id: result.data.leadId }
        : { id: result.data.leadId, userId: session.user.id },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }

    const note = await prisma.note.create({
      data: {
        content: result.data.content,
        leadId: result.data.leadId,
        userId: session.user.id,
        summary: result.data.summary,
      },
    })

    return Response.json(note, { status: 201 })
  } catch (error) {
    console.error("Failed to create note:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
