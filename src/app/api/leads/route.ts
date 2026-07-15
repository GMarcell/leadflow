import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createLeadSchema } from "@/lib/validation"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
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
      return Response.json({ error: "Unauthorized" }, { status: 401 })
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
