import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    })

    return Response.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
