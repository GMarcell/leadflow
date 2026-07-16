import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { moveLeadSchema } from "@/lib/validation"
import { getUserRole, canModifyLead, unauthorized, forbidden } from "@/lib/authorization"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // VIEWER cannot move leads in pipeline
    if (!canModifyLead(getUserRole(session))) {
      return forbidden()
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

    // Verify lead belongs to user (or accessible by role)
    const role = getUserRole(session)
    const lead = await prisma.lead.findFirst({
      where: role === "ADMIN" || role === "MANAGER"
        ? { id: leadId }
        : { id: leadId, userId: session.user.id },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }

    // If order not provided, place at the end of the target stage
    let pipelineOrder = order
    if (pipelineOrder === undefined) {
      const result = await prisma.lead.aggregate({
        where: { userId: session.user.id, status },
        _max: { pipelineOrder: true },
      })
      pipelineOrder = (result._max.pipelineOrder ?? -1) + 1
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        pipelineOrder,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Failed to move lead:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
