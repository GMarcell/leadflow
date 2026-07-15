import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  followUp: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  lead: {
    findFirst: vi.fn(),
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
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/follow-ups") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/follow-ups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { GET } = await import("@/app/api/follow-ups/route")
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns empty list when no follow-ups", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/follow-ups/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual([])
  })

  it("returns follow-ups with lead name", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const mockFollowUps = [
      {
        id: "fu-1",
        title: "Call Jane",
        dueDate: "2026-08-01T00:00:00.000Z",
        completed: false,
        lead: { name: "Jane Smith" },
      },
      {
        id: "fu-2",
        title: "Send contract",
        dueDate: "2026-08-05T00:00:00.000Z",
        completed: false,
        lead: { name: "John Doe" },
      },
    ]
    mockPrisma.followUp.findMany.mockResolvedValue(mockFollowUps)

    const { GET } = await import("@/app/api/follow-ups/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toHaveLength(2)
    expect(body[0].title).toBe("Call Jane")
    expect(body[0].lead.name).toBe("Jane Smith")
  })

  it("orders follow-ups by due date ascending", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/follow-ups/route")
    await GET()

    expect(mockPrisma.followUp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { dueDate: "asc" },
      })
    )
  })
})

describe("POST /api/follow-ups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { POST } = await import("@/app/api/follow-ups/route")
    const request = createRequest("POST", {
      title: "Follow up",
      dueDate: "2026-08-01T10:00:00.000Z",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("creates a follow-up with valid data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue({ id: "lead-1", userId: "user-1" })
    const createdFu = {
      id: "fu-new",
      title: "Call about proposal",
      description: null,
      dueDate: new Date("2026-08-01T10:00:00.000Z"),
      completed: false,
      leadId: "lead-1",
      userId: "user-1",
    }
    mockPrisma.followUp.create.mockResolvedValue(createdFu)

    const { POST } = await import("@/app/api/follow-ups/route")
    const request = createRequest("POST", {
      title: "Call about proposal",
      dueDate: "2026-08-01T10:00:00.000Z",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.title).toBe("Call about proposal")
    expect(body.leadId).toBe("lead-1")
  })

  it("returns 404 when lead does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { POST } = await import("@/app/api/follow-ups/route")
    const request = createRequest("POST", {
      title: "Follow up",
      dueDate: "2026-08-01T10:00:00.000Z",
      leadId: "nonexistent",
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it("returns 400 for missing title", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/follow-ups/route")
    const request = createRequest("POST", {
      dueDate: "2026-08-01T10:00:00.000Z",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for empty leadId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/follow-ups/route")
    const request = createRequest("POST", {
      title: "Follow up",
      dueDate: "2026-08-01T10:00:00.000Z",
      leadId: "",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("creates a follow-up with optional description", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue({ id: "lead-1", userId: "user-1" })
    mockPrisma.followUp.create.mockResolvedValue({
      id: "fu-new",
      title: "Send contract",
      description: "Draft the contract first",
      leadId: "lead-1",
    })

    const { POST } = await import("@/app/api/follow-ups/route")
    const request = createRequest("POST", {
      title: "Send contract",
      description: "Draft the contract first",
      dueDate: "2026-08-05T00:00:00.000Z",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.description).toBe("Draft the contract first")
  })
})

describe("PATCH /api/follow-ups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { PATCH } = await import("@/app/api/follow-ups/route")
    const request = createRequest("PATCH", { completed: true }, "http://localhost:3000/api/follow-ups?id=fu-1")
    const response = await PATCH(request)
    expect(response.status).toBe(401)
  })

  it("marks a follow-up as complete", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findFirst.mockResolvedValue({ id: "fu-1", userId: "user-1" })
    const updatedFu = { id: "fu-1", completed: true, userId: "user-1" }
    mockPrisma.followUp.update.mockResolvedValue(updatedFu)

    const { PATCH } = await import("@/app/api/follow-ups/route")
    const request = createRequest("PATCH", { completed: true }, "http://localhost:3000/api/follow-ups?id=fu-1")
    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.completed).toBe(true)
  })

  it("returns 400 when no id provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { PATCH } = await import("@/app/api/follow-ups/route")
    const request = createRequest("PATCH", { completed: true }, "http://localhost:3000/api/follow-ups")
    const response = await PATCH(request)
    expect(response.status).toBe(400)
  })

  it("returns 404 when follow-up not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findFirst.mockResolvedValue(null)

    const { PATCH } = await import("@/app/api/follow-ups/route")
    const request = createRequest("PATCH", { completed: true }, "http://localhost:3000/api/follow-ups?id=nonexistent")
    const response = await PATCH(request)
    expect(response.status).toBe(404)
  })

  it("updates multiple fields at once", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findFirst.mockResolvedValue({ id: "fu-1", userId: "user-1" })
    mockPrisma.followUp.update.mockImplementation(async (args: any) => args.data)

    const { PATCH } = await import("@/app/api/follow-ups/route")
    const request = createRequest(
      "PATCH",
      { title: "Updated title", completed: true },
      "http://localhost:3000/api/follow-ups?id=fu-1"
    )
    const response = await PATCH(request)
    expect(response.status).toBe(200)
  })
})

describe("DELETE /api/follow-ups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { DELETE } = await import("@/app/api/follow-ups/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/follow-ups?id=fu-1")
    const response = await DELETE(request)
    expect(response.status).toBe(401)
  })

  it("deletes an existing follow-up", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findFirst.mockResolvedValue({ id: "fu-1", userId: "user-1" })
    mockPrisma.followUp.delete.mockResolvedValue({ id: "fu-1" })

    const { DELETE } = await import("@/app/api/follow-ups/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/follow-ups?id=fu-1")
    const response = await DELETE(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it("returns 400 when no id provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { DELETE } = await import("@/app/api/follow-ups/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/follow-ups")
    const response = await DELETE(request)
    expect(response.status).toBe(400)
  })

  it("returns 404 when follow-up not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.followUp.findFirst.mockResolvedValue(null)

    const { DELETE } = await import("@/app/api/follow-ups/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/follow-ups?id=nonexistent")
    const response = await DELETE(request)
    expect(response.status).toBe(404)
  })
})
