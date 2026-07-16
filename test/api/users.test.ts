import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

// Mock auth
const mockAuth = vi.fn()
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}))

// Helper to create a request
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/users") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { GET } = await import("@/app/api/users/route")
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns 403 when user is not ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } })

    const { GET } = await import("@/app/api/users/route")
    const response = await GET()
    expect(response.status).toBe(403)
  })

  it("returns users list for ADMIN user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    const mockUsers = [
      {
        id: "admin-1",
        name: "Admin",
        email: "admin@test.com",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
        _count: { leads: 0, notes: 0, followUps: 0 },
      },
      {
        id: "user-1",
        name: "User",
        email: "user@test.com",
        role: "USER",
        createdAt: new Date().toISOString(),
        _count: { leads: 5, notes: 10, followUps: 3 },
      },
    ]
    mockPrisma.user.findMany.mockResolvedValue(mockUsers)

    const { GET } = await import("@/app/api/users/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toHaveLength(2)
    expect(body[0].email).toBe("admin@test.com")
    expect(body[1]._count.leads).toBe(5)
  })

  it("includes user stats in response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Test User",
        email: "test@test.com",
        role: "VIEWER",
        createdAt: new Date().toISOString(),
        _count: { leads: 3, notes: 7, followUps: 1 },
      },
    ])

    const { GET } = await import("@/app/api/users/route")
    const response = await GET()
    const body = await response.json()

    expect(body[0]._count.leads).toBe(3)
    expect(body[0]._count.notes).toBe(7)
    expect(body[0]._count.followUps).toBe(1)
  })

  it("orders users by newest first", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockPrisma.user.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/users/route")
    await GET()

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      })
    )
  })
})

describe("PATCH /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { PATCH } = await import("@/app/api/users/[id]/route")
    const request = createRequest("PATCH", { role: "MANAGER" }, "http://localhost:3000/api/users/user-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) })
    expect(response.status).toBe(401)
  })

  it("returns 403 when user is not ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "manager-1", role: "MANAGER" } })

    const { PATCH } = await import("@/app/api/users/[id]/route")
    const request = createRequest("PATCH", { role: "USER" }, "http://localhost:3000/api/users/user-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) })
    expect(response.status).toBe(403)
  })

  it("updates a user's role", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "user@test.com" })
    mockPrisma.user.update.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "user@test.com",
      role: "MANAGER",
    })

    const { PATCH } = await import("@/app/api/users/[id]/route")
    const request = createRequest("PATCH", { role: "MANAGER" }, "http://localhost:3000/api/users/user-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.role).toBe("MANAGER")
  })

  it("returns 400 for invalid role", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })

    const { PATCH } = await import("@/app/api/users/[id]/route")
    const request = createRequest("PATCH", { role: "SUPERADMIN" }, "http://localhost:3000/api/users/user-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) })
    expect(response.status).toBe(400)
  })

  it("returns 400 when admin tries to demote self", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })

    const { PATCH } = await import("@/app/api/users/[id]/route")
    const request = createRequest("PATCH", { role: "USER" }, "http://localhost:3000/api/users/admin-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "admin-1" }) })
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toContain("cannot demote yourself")
  })

  it("returns 404 when user not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const { PATCH } = await import("@/app/api/users/[id]/route")
    const request = createRequest("PATCH", { role: "USER" }, "http://localhost:3000/api/users/nonexistent")
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) })
    expect(response.status).toBe(404)
  })
})
