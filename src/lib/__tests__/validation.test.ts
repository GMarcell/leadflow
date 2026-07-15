import { describe, it, expect } from "vitest"
import {
  registerSchema,
  createLeadSchema,
  updateLeadSchema,
  createNoteSchema,
  summarizeNoteSchema,
  suggestFollowUpSchema,
  createFollowUpSchema,
  updateFollowUpSchema,
  moveLeadSchema,
  safeParseBody,
} from "../validation"
import { z } from "zod"

// ─── registerSchema ──────────────────────────

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "secure123",
      name: "John Doe",
    })
    expect(result.success).toBe(true)
  })

  it("accepts registration without name", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "secure123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "secure123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects short password (< 6 characters)", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty email", () => {
    const result = registerSchema.safeParse({ email: "", password: "secure123" })
    expect(result.success).toBe(false)
  })

  it("rejects empty password", () => {
    const result = registerSchema.safeParse({ email: "user@example.com", password: "" })
    expect(result.success).toBe(false)
  })

  it("rejects password over 128 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "x".repeat(129),
    })
    expect(result.success).toBe(false)
  })

  it("rejects name over 100 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "secure123",
      name: "x".repeat(101),
    })
    expect(result.success).toBe(false)
  })
})

// ─── createLeadSchema ────────────────────────

describe("createLeadSchema", () => {
  it("accepts a valid lead with minimal fields", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane Smith",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.source).toBe("OTHER")
      expect(result.data.status).toBe("NEW")
      expect(result.data.tags).toEqual([])
    }
  })

  it("accepts a lead with all fields", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane Smith",
      company: "Acme Corp",
      email: "jane@acme.com",
      phone: "+1 555-0000",
      source: "REFERRAL",
      tags: ["vip", "enterprise"],
      dealValue: 50000,
      status: "QUALIFIED",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a lead with empty email string", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane Smith",
      email: "",
    })
    expect(result.success).toBe(true)
  })

  it("accepts nullable fields", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane Smith",
      company: null,
      email: null,
      phone: null,
      dealValue: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createLeadSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane",
      email: "bad-email",
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative deal value", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane",
      dealValue: -100,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid source enum", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane",
      source: "INVALID_SOURCE",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status enum", () => {
    const result = createLeadSchema.safeParse({
      name: "Jane",
      status: "CLOSED",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name over 200 characters", () => {
    const result = createLeadSchema.safeParse({
      name: "x".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it("accepts name at exactly 200 characters", () => {
    const result = createLeadSchema.safeParse({
      name: "x".repeat(200),
    })
    expect(result.success).toBe(true)
  })

  it("rejects company over 200 characters", () => {
    const result = createLeadSchema.safeParse({
      name: "Lead",
      company: "x".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it("accepts company at exactly 200 characters", () => {
    const result = createLeadSchema.safeParse({
      name: "Lead",
      company: "x".repeat(200),
    })
    expect(result.success).toBe(true)
  })

  it("accepts company as undefined", () => {
    const result = createLeadSchema.safeParse({
      name: "Lead",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBeUndefined()
    }
  })

  it("rejects phone over 50 characters", () => {
    const result = createLeadSchema.safeParse({
      name: "Lead",
      phone: "x".repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it("accepts phone at exactly 50 characters", () => {
    const result = createLeadSchema.safeParse({
      name: "Lead",
      phone: "1".repeat(50),
    })
    expect(result.success).toBe(true)
  })

  it("accepts phone as undefined", () => {
    const result = createLeadSchema.safeParse({
      name: "Lead",
    })
    expect(result.success).toBe(true)
  })

  it("accepts all valid lead sources", () => {
    const sources = ["REFERRAL", "WEBSITE", "COLD_OUTREACH", "SOCIAL_MEDIA", "EMAIL_CAMPAIGN", "EVENT", "PARTNER", "OTHER"]
    for (const source of sources) {
      const result = createLeadSchema.safeParse({ name: "Test", source })
      expect(result.success).toBe(true)
    }
  })

  it("accepts all valid lead statuses", () => {
    const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"]
    for (const status of statuses) {
      const result = createLeadSchema.safeParse({ name: "Test", status })
      expect(result.success).toBe(true)
    }
  })
})

// ─── updateLeadSchema ────────────────────────

describe("updateLeadSchema", () => {
  it("accepts partial update with just name", () => {
    const result = updateLeadSchema.safeParse({ name: "Updated Name" })
    expect(result.success).toBe(true)
  })

  it("accepts partial update with just deal value", () => {
    const result = updateLeadSchema.safeParse({ dealValue: 100000 })
    expect(result.success).toBe(true)
  })

  it("accepts empty object (no fields)", () => {
    const result = updateLeadSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("rejects invalid status in update", () => {
    const result = updateLeadSchema.safeParse({ status: "BAD" })
    expect(result.success).toBe(false)
  })
})

// ─── createNoteSchema ────────────────────────

describe("createNoteSchema", () => {
  it("accepts a valid note", () => {
    const result = createNoteSchema.safeParse({
      content: "Had a great call with the client.",
      leadId: "lead-123",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a note with optional summary", () => {
    const result = createNoteSchema.safeParse({
      content: "Raw notes here",
      leadId: "lead-123",
      summary: "AI generated summary",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty content", () => {
    const result = createNoteSchema.safeParse({
      content: "",
      leadId: "lead-123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty leadId", () => {
    const result = createNoteSchema.safeParse({
      content: "Some notes",
      leadId: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects content over 10000 characters", () => {
    const result = createNoteSchema.safeParse({
      content: "x".repeat(10001),
      leadId: "lead-123",
    })
    expect(result.success).toBe(false)
  })
})

// ─── summarizeNoteSchema ─────────────────────

describe("summarizeNoteSchema", () => {
  it("accepts valid content", () => {
    const result = summarizeNoteSchema.safeParse({ content: "Notes to summarize" })
    expect(result.success).toBe(true)
  })

  it("rejects empty content", () => {
    const result = summarizeNoteSchema.safeParse({ content: "" })
    expect(result.success).toBe(false)
  })

  it("rejects content over 10000 characters", () => {
    const result = summarizeNoteSchema.safeParse({ content: "x".repeat(10001) })
    expect(result.success).toBe(false)
  })
})

// ─── suggestFollowUpSchema ───────────────────

describe("suggestFollowUpSchema", () => {
  it("accepts valid suggestion request", () => {
    const result = suggestFollowUpSchema.safeParse({
      leadName: "Jane",
      leadStage: "QUALIFIED",
      notes: "Discussed pricing",
      daysSinceLastContact: 5,
    })
    expect(result.success).toBe(true)
  })

  it("accepts suggestion request without notes", () => {
    const result = suggestFollowUpSchema.safeParse({
      leadName: "Jane",
      leadStage: "NEW",
      daysSinceLastContact: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty lead name", () => {
    const result = suggestFollowUpSchema.safeParse({
      leadName: "",
      leadStage: "NEW",
      daysSinceLastContact: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty lead stage", () => {
    const result = suggestFollowUpSchema.safeParse({
      leadName: "Jane",
      leadStage: "",
      daysSinceLastContact: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative days", () => {
    const result = suggestFollowUpSchema.safeParse({
      leadName: "Jane",
      leadStage: "NEW",
      daysSinceLastContact: -1,
    })
    expect(result.success).toBe(false)
  })
})

// ─── createFollowUpSchema ────────────────────

describe("createFollowUpSchema", () => {
  it("accepts a valid follow-up", () => {
    const result = createFollowUpSchema.safeParse({
      title: "Call to discuss proposal",
      dueDate: "2026-08-01T10:00:00.000Z",
      leadId: "lead-123",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a follow-up with description", () => {
    const result = createFollowUpSchema.safeParse({
      title: "Send contract",
      description: "Draft and send the contract",
      dueDate: "2026-08-01",
      leadId: "lead-123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createFollowUpSchema.safeParse({
      title: "",
      dueDate: "2026-08-01",
      leadId: "lead-123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty due date", () => {
    const result = createFollowUpSchema.safeParse({
      title: "Follow up",
      dueDate: "",
      leadId: "lead-123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty leadId", () => {
    const result = createFollowUpSchema.safeParse({
      title: "Follow up",
      dueDate: "2026-08-01",
      leadId: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects title over 300 characters", () => {
    const result = createFollowUpSchema.safeParse({
      title: "x".repeat(301),
      dueDate: "2026-08-01",
      leadId: "lead-123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects description over 2000 characters", () => {
    const result = createFollowUpSchema.safeParse({
      title: "Follow up",
      description: "x".repeat(2001),
      dueDate: "2026-08-01",
      leadId: "lead-123",
    })
    expect(result.success).toBe(false)
  })
})

// ─── updateFollowUpSchema ────────────────────

describe("updateFollowUpSchema", () => {
  it("accepts marking as completed", () => {
    const result = updateFollowUpSchema.safeParse({ completed: true })
    expect(result.success).toBe(true)
  })

  it("accepts updating just the title", () => {
    const result = updateFollowUpSchema.safeParse({ title: "Updated title" })
    expect(result.success).toBe(true)
  })

  it("accepts empty object", () => {
    const result = updateFollowUpSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("rejects invalid completed type", () => {
    const result = updateFollowUpSchema.safeParse({ completed: "yes" })
    expect(result.success).toBe(false)
  })
})

// ─── moveLeadSchema ──────────────────────────

describe("moveLeadSchema", () => {
  it("accepts a valid pipeline move", () => {
    const result = moveLeadSchema.safeParse({
      leadId: "lead-123",
      status: "QUALIFIED",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a move with order", () => {
    const result = moveLeadSchema.safeParse({
      leadId: "lead-123",
      status: "WON",
      order: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty leadId", () => {
    const result = moveLeadSchema.safeParse({
      leadId: "",
      status: "WON",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const result = moveLeadSchema.safeParse({
      leadId: "lead-123",
      status: "UNKNOWN",
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative order", () => {
    const result = moveLeadSchema.safeParse({
      leadId: "lead-123",
      status: "WON",
      order: -1,
    })
    expect(result.success).toBe(false)
  })
})

// ─── safeParseBody ───────────────────────────

describe("safeParseBody", () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  })

  it("returns data for valid JSON body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "John", age: 30 }),
      headers: { "Content-Type": "application/json" },
    })
    const result = await safeParseBody(request, testSchema)
    expect("data" in result).toBe(true)
    if ("data" in result) {
      expect(result.data).toEqual({ name: "John", age: 30 })
    }
  })

  it("returns error Response for invalid JSON body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    })
    const result = await safeParseBody(request, testSchema)
    expect("error" in result).toBe(true)
    if ("error" in result) {
      const response = result.error
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe("Invalid JSON body")
    }
  })

  it("returns error Response for validation failure", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "", age: -5 }),
      headers: { "Content-Type": "application/json" },
    })
    const result = await safeParseBody(request, testSchema)
    expect("error" in result).toBe(true)
    if ("error" in result) {
      const response = result.error
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBeTruthy()
      expect(body.details).toBeInstanceOf(Array)
      expect(body.details.length).toBeGreaterThan(0)
      expect(body.details[0]).toHaveProperty("field")
      expect(body.details[0]).toHaveProperty("message")
    }
  })

  it("returns 400 for request with no body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    const result = await safeParseBody(request, testSchema)
    expect("error" in result).toBe(true)
  })

  it("returns correct error field paths for nested schemas", async () => {
    const nestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    })
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ user: { email: "bad" } }),
      headers: { "Content-Type": "application/json" },
    })
    const result = await safeParseBody(request, nestedSchema)
    if ("error" in result) {
      const body = await result.error.json()
      expect(body.details[0].field).toBe("user.email")
    }
  })
})
