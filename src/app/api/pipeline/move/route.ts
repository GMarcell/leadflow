import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { moveLeadSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = moveLeadSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { leadId, status, order } = result.data

    // Verify lead belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: session.user.id },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        pipelineOrder: order ?? 0,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Failed to move lead:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
