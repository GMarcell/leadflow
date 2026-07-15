import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  lead: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/leads") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { GET } = await import("@/app/api/leads/route")
    const response = await GET()
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} })

    const { GET } = await import("@/app/api/leads/route")
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns empty list when user has no leads", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/leads/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual([])
  })

  it("returns leads for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const mockLeads = [
      {
        id: "lead-1",
        name: "Jane Smith",
        company: "Acme Corp",
        status: "NEW",
        notes: [{ id: "n-1", content: "Note 1" }],
        followUps: [],
      },
      {
        id: "lead-2",
        name: "John Doe",
        company: "Globex",
        status: "QUALIFIED",
        notes: [],
        followUps: [{ id: "f-1", title: "Follow up" }],
      },
    ]
    mockPrisma.lead.findMany.mockResolvedValue(mockLeads)

    const { GET } = await import("@/app/api/leads/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toHaveLength(2)
    expect(body[0].name).toBe("Jane Smith")
    expect(body[1].name).toBe("John Doe")
  })

  it("includes notes and follow-ups in response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: "lead-1",
        name: "Jane Smith",
        notes: [{ id: "n-1", content: "Note content" }],
        followUps: [{ id: "f-1", title: "Follow up" }],
      },
    ])

    const { GET } = await import("@/app/api/leads/route")
    const response = await GET()
    const body = await response.json()

    expect(body[0].notes).toHaveLength(1)
    expect(body[0].notes[0].content).toBe("Note content")
    expect(body[0].followUps).toHaveLength(1)
  })

  it("queries leads for the correct user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } })
    mockPrisma.lead.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/leads/route")
    await GET()

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-42" },
      })
    )
  })
})

describe("POST /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { POST } = await import("@/app/api/leads/route")
    const request = createRequest("POST", { name: "New Lead" })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("creates a lead with valid data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const createdLead = {
      id: "lead-new",
      name: "Sarah Connor",
      company: "Cyberdyne",
      source: "REFERRAL",
      status: "NEW",
      tags: [],
      userId: "user-1",
    }
    mockPrisma.lead.create.mockResolvedValue(createdLead)

    const { POST } = await import("@/app/api/leads/route")
    const request = createRequest("POST", {
      name: "Sarah Connor",
      company: "Cyberdyne",
      source: "REFERRAL",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.name).toBe("Sarah Connor")
    expect(body.userId).toBe("user-1")
  })

  it("returns 400 for invalid data (empty name)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/leads/route")
    const request = createRequest("POST", { name: "" })
    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBeTruthy()
  })

  it("returns 400 for invalid source enum", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/leads/route")
    const request = createRequest("POST", { name: "Test", source: "FAKE" })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("sets default values for optional fields", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.create.mockImplementation(async (args: any) => ({
      id: "lead-new",
      ...args.data,
    }))

    const { POST } = await import("@/app/api/leads/route")
    const request = createRequest("POST", { name: "Minimal Lead" })
    const response = await POST(request)
    const body = await response.json()

    expect(body.source).toBe("OTHER")
    expect(body.status).toBe("NEW")
    expect(body.tags).toEqual([])
  })
})

describe("GET /api/leads/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { GET } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("GET", undefined, "http://localhost:3000/api/leads/lead-1")
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(401)
  })

  it("returns 404 when lead not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { GET } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("GET", undefined, "http://localhost:3000/api/leads/nonexistent")
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) })
    expect(response.status).toBe(404)
  })

  it("returns lead with notes and follow-ups", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const mockLead = {
      id: "lead-1",
      name: "Jane Smith",
      company: "Acme Corp",
      status: "QUALIFIED",
      notes: [{ id: "n-1", content: "Note" }],
      followUps: [{ id: "f-1", title: "Follow up" }],
    }
    mockPrisma.lead.findFirst.mockResolvedValue(mockLead)

    const { GET } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("GET", undefined, "http://localhost:3000/api/leads/lead-1")
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.name).toBe("Jane Smith")
    expect(body.notes).toHaveLength(1)
  })

  it("only returns lead if it belongs to the authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null) // not found for this user

    const { GET } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("GET", undefined, "http://localhost:3000/api/leads/others-lead")
    const response = await GET(request, { params: Promise.resolve({ id: "others-lead" }) })
    expect(response.status).toBe(404)
  })
})

describe("PATCH /api/leads/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { PATCH } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("PATCH", { name: "Updated" }, "http://localhost:3000/api/leads/lead-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(401)
  })

  it("updates a lead with valid data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const existingLead = { id: "lead-1", name: "Old Name", userId: "user-1" }
    const updatedLead = { id: "lead-1", name: "New Name", userId: "user-1" }
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead)
    mockPrisma.lead.update.mockResolvedValue(updatedLead)

    const { PATCH } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("PATCH", { name: "New Name" }, "http://localhost:3000/api/leads/lead-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.name).toBe("New Name")
  })

  it("returns 404 when lead not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { PATCH } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("PATCH", { name: "New" }, "http://localhost:3000/api/leads/nonexistent")
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) })
    expect(response.status).toBe(404)
  })

  it("returns 400 for invalid update data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue({ id: "lead-1", userId: "user-1" })

    const { PATCH } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("PATCH", { status: "INVALID" }, "http://localhost:3000/api/leads/lead-1")
    const response = await PATCH(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(400)
  })
})

describe("DELETE /api/leads/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { DELETE } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/leads/lead-1")
    const response = await DELETE(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(401)
  })

  it("deletes an existing lead", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue({ id: "lead-1", userId: "user-1" })
    mockPrisma.lead.delete.mockResolvedValue({ id: "lead-1" })

    const { DELETE } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/leads/lead-1")
    const response = await DELETE(request, { params: Promise.resolve({ id: "lead-1" }) })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it("returns 404 when lead not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { DELETE } = await import("@/app/api/leads/[id]/route")
    const request = createRequest("DELETE", undefined, "http://localhost:3000/api/leads/nonexistent")
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) })
    expect(response.status).toBe(404)
  })
})
