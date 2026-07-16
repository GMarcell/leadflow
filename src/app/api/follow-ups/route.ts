import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createFollowUpSchema, updateFollowUpSchema } from "@/lib/validation"
import { getUserRole, canModifyLead, unauthorized, forbidden } from "@/lib/authorization"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    const role = getUserRole(session)
    const where = role === "ADMIN" || role === "MANAGER" || role === "VIEWER"
      ? {}
      : { userId: session.user.id }

    const followUps = await prisma.followUp.findMany({
      where,
      include: { lead: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    })

    return Response.json(followUps)
  } catch (error) {
    console.error("Failed to fetch follow-ups:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // VIEWER cannot create follow-ups
    if (!canModifyLead(getUserRole(session))) {
      return forbidden()
    }

    const body = await request.json()
    const result = createFollowUpSchema.safeParse(body)

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

    const followUp = await prisma.followUp.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        dueDate: new Date(result.data.dueDate),
        leadId: result.data.leadId,
        userId: session.user.id,
      },
    })

    return Response.json(followUp, { status: 201 })
  } catch (error) {
    console.error("Failed to create follow-up:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // VIEWER cannot update follow-ups
    if (!canModifyLead(getUserRole(session))) {
      return forbidden()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Follow-up ID required" }, { status: 400 })
    }

    const body = await request.json()
    const result = updateFollowUpSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const role = getUserRole(session)
    const followUp = await prisma.followUp.findFirst({
      where: role === "ADMIN" || role === "MANAGER"
        ? { id }
        : { id, userId: session.user.id },
    })

    if (!followUp) {
      return Response.json({ error: "Follow-up not found" }, { status: 404 })
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        ...result.data,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Failed to update follow-up:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // Only ADMIN and MANAGER can delete follow-ups
    const role = getUserRole(session)
    if (role !== "ADMIN" && role !== "MANAGER") {
      return forbidden()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Follow-up ID required" }, { status: 400 })
    }

    const followUp = await prisma.followUp.findFirst({
      where: role === "ADMIN" || role === "MANAGER"
        ? { id }
        : { id, userId: session.user.id },
    })

    if (!followUp) {
      return Response.json({ error: "Follow-up not found" }, { status: 404 })
    }

    await prisma.followUp.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete follow-up:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
