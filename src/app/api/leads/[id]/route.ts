import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateLeadSchema } from "@/lib/validation"
import { getUserRole, canModifyLead, canDeleteLead, unauthorized, forbidden } from "@/lib/authorization"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    const { id } = await params
    const role = getUserRole(session)

    // ADMIN / MANAGER / VIEWER can access any lead; USER only own
    const lead = await prisma.lead.findFirst({
      where: role === "ADMIN" || role === "MANAGER" || role === "VIEWER"
        ? { id }
        : { id, userId: session.user.id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        followUps: { orderBy: { dueDate: "asc" } },
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }

    return Response.json(lead)
  } catch (error) {
    console.error("Failed to fetch lead:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // VIEWER cannot update leads
    if (!canModifyLead(getUserRole(session))) {
      return forbidden()
    }

    const { id } = await params
    const body = await request.json()
    const result = updateLeadSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const role = getUserRole(session)
    const lead = await prisma.lead.findFirst({
      where: role === "ADMIN" || role === "MANAGER"
        ? { id }
        : { id, userId: session.user.id },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: result.data,
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Failed to update lead:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // Only ADMIN and MANAGER can delete leads
    if (!canDeleteLead(getUserRole(session))) {
      return forbidden()
    }

    const { id } = await params
    const role = getUserRole(session)
    const lead = await prisma.lead.findFirst({
      where: role === "ADMIN" || role === "MANAGER"
        ? { id }
        : { id, userId: session.user.id },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 })
    }

    await prisma.lead.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete lead:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
