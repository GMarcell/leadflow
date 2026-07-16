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
function createRequest(method: string, body?: unknown, url = "http://localhost:3000/api/ai/summarize") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/ai/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GROQ_API_KEY = "test-groq-key"
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: "Notes to summarize" })
    const response = await POST(request)
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 500 when GROQ_API_KEY is not configured", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    delete process.env.GROQ_API_KEY

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: "Notes to summarize" })
    const response = await POST(request)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toContain("GROQ_API_KEY")
  })

  it("returns 400 when content is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", {})
    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe("Content is required")
  })

  it("returns 400 when content is not a string", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: 123 })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns summary from Groq API", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const mockSummary = "Summary: Key points discussed\n\nNext Action: Follow up"
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: mockSummary,
          },
        },
      ],
    })

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: "Met with client about proposal" })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.summary).toBe(mockSummary)
  })

  it("calls Groq with correct parameters", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Summary" } }],
    })

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: "Call notes" })
    await POST(request)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "llama-3.3-70b-versatile",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user", content: "Call notes" }),
        ]),
        temperature: 0.3,
        max_tokens: 300,
      })
    )
  })

  it("handles empty response from Groq", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockResolvedValue({
      choices: [],
    })

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: "Notes" })
    const response = await POST(request)

    const body = await response.json()
    expect(body.summary).toBe("Could not generate summary.")
  })

  it("returns 500 when Groq API throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockCreate.mockRejectedValue(new Error("Groq API error"))

    const { POST } = await import("@/app/api/ai/summarize/route")
    const request = createRequest("POST", { content: "Notes" })
    const response = await POST(request)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toContain("Groq API key")
  })
})
