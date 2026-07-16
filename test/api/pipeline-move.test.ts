import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  lead: {
    findFirst: vi.fn(),
    aggregate: vi.fn(),
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
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/pipeline/move") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/pipeline/move", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} })

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("returns 400 for invalid status enum", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "INVALID_STATUS",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for missing leadId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      status: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 404 when lead not found or does not belong to user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "nonexistent",
      status: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it("moves a lead to a new stage with provided order", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
      status: "NEW",
    })
    const updatedLead = {
      id: "lead-1",
      name: "Test Lead",
      status: "QUALIFIED",
      pipelineOrder: 3,
    }
    mockPrisma.lead.update.mockResolvedValue(updatedLead)

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "QUALIFIED",
      order: 3,
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.status).toBe("QUALIFIED")
    expect(body.pipelineOrder).toBe(3)
  })

  it("computes next order when order is not provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
      status: "NEW",
    })
    // Simulate max pipelineOrder of 5 in the target stage
    mockPrisma.lead.aggregate.mockResolvedValue({
      _max: { pipelineOrder: 5 },
    })
    mockPrisma.lead.update.mockImplementation(async (_args: any) => ({
      id: "lead-1",
      status: "CONTACTED",
      pipelineOrder: 6,
    }))

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "CONTACTED",
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.pipelineOrder).toBe(6)
  })

  it("computes order 0 when target stage is empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
      status: "NEW",
    })
    // No leads in target stage
    mockPrisma.lead.aggregate.mockResolvedValue({
      _max: { pipelineOrder: null },
    })
    mockPrisma.lead.update.mockImplementation(async (_args: any) => ({
      id: "lead-1",
      status: "WON",
      pipelineOrder: 0,
    }))

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "WON",
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.pipelineOrder).toBe(0)
  })

  it("verifies lead ownership before moving", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    // Lead belongs to a different user
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "others-lead",
      status: "WON",
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it("returns 500 when database throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockRejectedValue(new Error("Database error"))

    const { POST } = await import("@/app/api/pipeline/move/route")
    const request = createRequest("POST", {
      leadId: "lead-1",
      status: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
