import { prisma } from "@/lib/prisma"
import { getUserRole, unauthorized, forbidden } from "@/lib/authorization"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    const role = getUserRole(session)
    if (role !== "ADMIN") {
      return forbidden()
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            leads: true,
            notes: true,
            followUps: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
