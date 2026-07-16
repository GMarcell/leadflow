import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock auth
const mockAuth = vi.fn()
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}))

// Mock groq-sdk using a class that works with 'new'
const mockCreate = vi.fn()
class MockGroq {
  constructor() {}
  get chat() {
    return {
      completions: {
        create: mockCreate,
      },
    }
  }
}

vi.mock("groq-sdk", () => ({
  default: MockGroq,
}))

// Helper to create a request
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/ai/suggest") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/ai/suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GROQ_API_KEY = "test-groq-key"
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane",
      leadStage: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 500 when GROQ_API_KEY is not configured", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    delete process.env.GROQ_API_KEY

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane",
      leadStage: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toContain("GROQ_API_KEY")
  })

  it("returns 400 when leadName is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadStage: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 when leadStage is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns suggestion from Groq API", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const mockSuggestion = "Send a personalized email discussing next steps"
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockSuggestion,
          },
        },
      ],
    })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane Smith",
      leadStage: "QUALIFIED",
      notes: "Showed interest in premium tier",
      daysSinceLastContact: 3,
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.suggestion).toBe(mockSuggestion)
  })

  it("calls Groq with correct parameters", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Suggestion" } }],
    })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "John",
      leadStage: "NEW",
    })
    await POST(request)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "llama-3.3-70b-versatile",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
        ]),
        temperature: 0.4,
        max_tokens: 300,
      })
    )
  })

  it("includes notes and daysSinceLastContact in prompt when provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Call them" } }],
    })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane",
      leadStage: "QUALIFIED",
      notes: "Interested in enterprise plan",
      daysSinceLastContact: 5,
    })
    await POST(request)

    const callArg = mockCreate.mock.calls[0][0]
    const userMessage = callArg.messages.find((m: any) => m.role === "user")
    expect(userMessage.content).toContain("Jane")
    expect(userMessage.content).toContain("QUALIFIED")
    expect(userMessage.content).toContain("Interested in enterprise plan")
    expect(userMessage.content).toContain("5")
  })

  it("handles empty response from Groq", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockResolvedValue({
      choices: [],
    })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane",
      leadStage: "CONTACTED",
    })
    const response = await POST(request)

    const body = await response.json()
    expect(body.suggestion).toBe("Could not generate suggestion.")
  })

  it("works without optional notes and daysSinceLastContact", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Follow up" } }],
    })

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Bob",
      leadStage: "NEW",
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it("returns 500 when Groq API throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockRejectedValue(new Error("Groq API error"))

    const { POST } = await import("@/app/api/ai/suggest/route")
    const request = createRequest("POST", {
      leadName: "Jane",
      leadStage: "QUALIFIED",
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
