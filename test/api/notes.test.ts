import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  lead: {
    findFirst: vi.fn(),
  },
  note: {
    create: vi.fn(),
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
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/notes") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Note content",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} })

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Note content",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("returns 400 for empty content", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for missing leadId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Note content",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 404 when lead does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Note content",
      leadId: "nonexistent",
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it("creates a note with valid data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
    })
    const createdNote = {
      id: "note-1",
      content: "Meeting notes",
      leadId: "lead-1",
      userId: "user-1",
      summary: null,
    }
    mockPrisma.note.create.mockResolvedValue(createdNote)

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Meeting notes",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.content).toBe("Meeting notes")
    expect(body.leadId).toBe("lead-1")
    expect(body.userId).toBe("user-1")
  })

  it("creates a note with optional summary", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
    })
    const createdNote = {
      id: "note-1",
      content: "Raw call notes",
      summary: "Summarized key points",
      leadId: "lead-1",
      userId: "user-1",
    }
    mockPrisma.note.create.mockResolvedValue(createdNote)

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Raw call notes",
      summary: "Summarized key points",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.summary).toBe("Summarized key points")
  })

  it("verifies lead ownership before creating note", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    // Lead belongs to different user
    mockPrisma.lead.findFirst.mockResolvedValue(null)

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Note",
      leadId: "others-lead",
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it("returns 500 when database throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
    mockPrisma.lead.findFirst.mockRejectedValue(new Error("Database error"))

    const { POST } = await import("@/app/api/notes/route")
    const request = createRequest("POST", {
      content: "Note",
      leadId: "lead-1",
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
