import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn(() => Promise.resolve("hashed-password")),
}))

// Helper to create a request
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/auth/register") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("registers a new user with valid data", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const createdUser = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    }
    mockPrisma.user.create.mockResolvedValue(createdUser)

    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.email).toBe("test@example.com")
    expect(body.name).toBe("Test User")
    expect(body.id).toBe("user-1")
  })

  it("registers a user without optional name", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: "user-2",
      name: null,
      email: "noname@example.com",
    })

    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      email: "noname@example.com",
      password: "password123",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.email).toBe("noname@example.com")
  })

  it("returns 400 for invalid email", async () => {
    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      email: "invalid-email",
      password: "password123",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBeTruthy()
  })

  it("returns 400 for short password", async () => {
    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      email: "test@example.com",
      password: "12345",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for empty email", async () => {
    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      email: "",
      password: "password123",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 409 when email already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
    })

    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      name: "Test",
      email: "test@example.com",
      password: "password123",
    })
    const response = await POST(request)
    expect(response.status).toBe(409)

    const body = await response.json()
    expect(body.error).toContain("already exists")
  })

  it("hashes password with bcrypt", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      name: "Test",
      email: "test@example.com",
    })

    const { hash } = await import("bcryptjs")

    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      name: "Test",
      email: "test@example.com",
      password: "secret123",
    })
    await POST(request)

    expect(hash).toHaveBeenCalledWith("secret123", 12)
  })

  it("returns 500 when database throws", async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"))

    const { POST } = await import("@/app/api/auth/register/route")
    const request = createRequest("POST", {
      email: "test@example.com",
      password: "password123",
    })
    const response = await POST(request)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe("Internal server error")
  })
})
