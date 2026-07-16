import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createLeadSchema } from "@/lib/validation"
import { getUserRole, canModifyLead, unauthorized, forbidden } from "@/lib/authorization"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    const role = getUserRole(session)

    // ADMIN / MANAGER / VIEWER see all leads; USER sees only own
    const where =
      role === "ADMIN" || role === "MANAGER" || role === "VIEWER"
        ? {}
        : { userId: session.user.id }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        notes: { orderBy: { createdAt: "desc" }, take: 5 },
        followUps: { orderBy: { dueDate: "asc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(leads)
  } catch (error) {
    console.error("Failed to fetch leads:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // VIEWER cannot create leads
    if (!canModifyLead(getUserRole(session))) {
      return forbidden()
    }

    const body = await request.json()
    const result = createLeadSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        ...result.data,
        userId: session.user.id,
      },
    })

    return Response.json(lead, { status: 201 })
  } catch (error) {
    console.error("Failed to create lead:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
