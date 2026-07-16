import { prisma } from "@/lib/prisma"
import { getUserRole, unauthorized, forbidden } from "@/lib/authorization"
import { auth } from "@/lib/auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    const role = getUserRole(session)
    if (role !== "ADMIN") {
      return forbidden()
    }

    const { id } = await params
    const body = await request.json()
    const { role: newRole } = body

    if (!newRole || !["ADMIN", "MANAGER", "VIEWER", "USER"].includes(newRole)) {
      return Response.json(
        { error: "Invalid role. Must be one of: ADMIN, MANAGER, VIEWER, USER" },
        { status: 400 }
      )
    }

    // Prevent self-demotion from ADMIN
    if (id === session.user.id && newRole !== "ADMIN") {
      return Response.json(
        { error: "You cannot demote yourself from ADMIN" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Failed to update user:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
