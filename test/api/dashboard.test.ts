import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma before any imports
const mockPrisma = {
  lead: {
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  followUp: {
    findMany: vi.fn(),
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

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} })

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns empty dashboard stats when user has no data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    // All counts return 0
    mockPrisma.lead.count.mockResolvedValue(0)
    // groupBy returns empty array
    mockPrisma.lead.groupBy.mockResolvedValue([])
    // aggregate returns null (no leads)
    mockPrisma.lead.aggregate.mockResolvedValue({ _sum: { dealValue: null } })
    // findMany returns empty
    mockPrisma.lead.findMany.mockResolvedValue([])
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.totalLeads).toBe(0)
    expect(body.newLeads).toBe(0)
    expect(body.activeLeads).toBe(0)
    expect(body.pipelineValue).toBe(0)
    expect(body.wonDeals).toBe(0)
    expect(body.wonValue).toBe(0)
    expect(body.conversionRate).toBe(0)
    expect(body.stageDistribution).toEqual([])
    expect(body.sourceDistribution).toEqual([])
    expect(body.leadTimeline).toHaveLength(7)
    expect(body.recentLeads).toEqual([])
    expect(body.followUps).toEqual([])
  })

  it("calculates pipeline stats with mixed leads", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    // Total leads count
    mockPrisma.lead.count
      .mockResolvedValueOnce(10) // totalLeads
      .mockResolvedValueOnce(2)  // newLeadsThisMonth
      .mockResolvedValueOnce(7)  // activeLeads
      .mockResolvedValueOnce(2)  // wonDeals
      .mockResolvedValueOnce(1)  // lostDeals
      .mockResolvedValue(0)      // all other count calls (leadTimeline uses 7 more)

    const mockLeadsByStatus = [
      { status: "NEW", _count: { id: 3 }, _sum: { dealValue: 15000 } },
      { status: "CONTACTED", _count: { id: 2 }, _sum: { dealValue: 25000 } },
      { status: "QUALIFIED", _count: { id: 1 }, _sum: { dealValue: 50000 } },
      { status: "PROPOSAL_SENT", _count: { id: 1 }, _sum: { dealValue: 30000 } },
      { status: "WON", _count: { id: 2 }, _sum: { dealValue: 80000 } },
      { status: "LOST", _count: { id: 1 }, _sum: { dealValue: 10000 } },
    ]

    // First groupBy call: leadsByStatus
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce(mockLeadsByStatus)
      .mockResolvedValueOnce([]) // sourceDistribution

    mockPrisma.lead.aggregate
      .mockResolvedValueOnce({ _sum: { dealValue: 120000 } }) // pipeline value (active)
      .mockResolvedValueOnce({ _sum: { dealValue: 80000 } })  // won value

    mockPrisma.lead.findMany.mockResolvedValue([]) // recentLeads
    mockPrisma.followUp.findMany.mockResolvedValue([]) // followUps

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    // Conversion rate: 2 won / (2 won + 1 lost) = 67%
    expect(body.conversionRate).toBe(67)
    expect(body.wonDeals).toBe(2)
    expect(body.wonValue).toBe(80000)

    // Stage distribution: 6 stages
    expect(body.stageDistribution).toHaveLength(6)
    const proposalSent = body.stageDistribution.find(
      (s: { name: string }) => s.name === "PROPOSAL SENT"
    )
    expect(proposalSent).toBeDefined()
    expect(proposalSent.count).toBe(1)
    expect(proposalSent.value).toBe(30000)

    // Source distribution: empty
    expect(body.sourceDistribution).toEqual([])

    // Timeline: 7 days
    expect(body.leadTimeline).toHaveLength(7)
    body.leadTimeline.forEach((day: { date: string; count: number }) => {
      expect(day.date).toBeTruthy()
      expect(typeof day.count).toBe("number")
    })
  })

  it("calculates conversion rate correctly when no closed deals", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    // Mock counts: total=5, newThisMonth=1, active=5, won=0, lost=0 + 7 timeline counts
    mockPrisma.lead.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)

    // groupBy: no leads with status
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    // aggregate: no leads
    mockPrisma.lead.aggregate
      .mockResolvedValue({ _sum: { dealValue: null } })

    // remainder count calls (timeline)
    mockPrisma.lead.count
      .mockResolvedValue(0)

    mockPrisma.lead.findMany.mockResolvedValue([])
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    const body = await response.json()

    // When no closed deals, conversion rate should be 0
    expect(body.conversionRate).toBe(0)
    expect(body.totalLeads).toBe(5)
    expect(body.newLeads).toBe(1)
    expect(body.activeLeads).toBe(5)
  })

  it("calculates conversion rate with only won deals", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    mockPrisma.lead.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2) // won
      .mockResolvedValueOnce(0) // lost

    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    mockPrisma.lead.aggregate
      .mockResolvedValue({ _sum: { dealValue: null } })

    mockPrisma.lead.count
      .mockResolvedValue(0) // timeline counts

    mockPrisma.lead.findMany.mockResolvedValue([])
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    const body = await response.json()

    // 2 won / 2 total closed = 100%
    expect(body.conversionRate).toBe(100)
    expect(body.wonDeals).toBe(2)
  })

  it("includes recent leads sorted by newest", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const recentLeads = [
      { id: "lead-1", name: "Recent Lead", createdAt: new Date().toISOString() },
      { id: "lead-2", name: "Older Lead", createdAt: new Date(Date.now() - 86400000).toISOString() },
    ]

    mockPrisma.lead.count
      .mockResolvedValue(0)

    mockPrisma.lead.groupBy
      .mockResolvedValue([])
      .mockResolvedValue([])

    mockPrisma.lead.aggregate
      .mockResolvedValue({ _sum: { dealValue: null } })

    mockPrisma.lead.count
      .mockResolvedValue(0) // timeline counts

    mockPrisma.lead.findMany.mockResolvedValue(recentLeads)
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    const body = await response.json()

    expect(body.recentLeads).toHaveLength(2)
    expect(body.recentLeads[0].name).toBe("Recent Lead")
  })

  it("includes follow-ups due today", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    const followUps = [
      {
        id: "fu-1",
        title: "Call John",
        dueDate: new Date(),
        completed: false,
        lead: { name: "John Doe" },
      },
    ]

    mockPrisma.lead.count
      .mockResolvedValue(0)

    mockPrisma.lead.groupBy
      .mockResolvedValue([])
      .mockResolvedValue([])

    mockPrisma.lead.aggregate
      .mockResolvedValue({ _sum: { dealValue: null } })

    mockPrisma.lead.count
      .mockResolvedValue(0) // timeline counts

    mockPrisma.lead.findMany.mockResolvedValue([])
    mockPrisma.followUp.findMany.mockResolvedValue(followUps)

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    const body = await response.json()

    expect(body.followUps).toHaveLength(1)
    expect(body.followUps[0].title).toBe("Call John")
    expect(body.followUps[0].lead.name).toBe("John Doe")
  })

  it("builds stage distribution from grouped data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    mockPrisma.lead.count
      .mockResolvedValue(0)

    const mockGroupBy = [
      { status: "NEW", _count: { id: 3 }, _sum: { dealValue: 15000 } },
      { status: "WON", _count: { id: 2 }, _sum: { dealValue: 100000 } },
    ]
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce(mockGroupBy)
      .mockResolvedValueOnce([]) // sourceDistribution

    mockPrisma.lead.aggregate
      .mockResolvedValue({ _sum: { dealValue: null } })

    mockPrisma.lead.count
      .mockResolvedValue(0) // timeline

    mockPrisma.lead.findMany.mockResolvedValue([])
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    const body = await response.json()

    expect(body.stageDistribution).toHaveLength(2)
    expect(body.stageDistribution[0]).toEqual({
      name: "NEW",
      count: 3,
      value: 15000,
    })
    expect(body.stageDistribution[1]).toEqual({
      name: "WON",
      count: 2,
      value: 100000,
    })
  })

  it("builds source distribution from grouped data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    mockPrisma.lead.count
      .mockResolvedValue(0)

    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([]) // stage
      .mockResolvedValueOnce([   // source
        { source: "REFERRAL", _count: { id: 5 } },
        { source: "WEBSITE", _count: { id: 3 } },
      ])

    mockPrisma.lead.aggregate
      .mockResolvedValue({ _sum: { dealValue: null } })

    mockPrisma.lead.count
      .mockResolvedValue(0) // timeline

    mockPrisma.lead.findMany.mockResolvedValue([])
    mockPrisma.followUp.findMany.mockResolvedValue([])

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    const body = await response.json()

    expect(body.sourceDistribution).toHaveLength(2)
    expect(body.sourceDistribution[0]).toEqual({
      name: "REFERRAL",
      count: 5,
    })
    expect(body.sourceDistribution[1]).toEqual({
      name: "WEBSITE",
      count: 3,
    })
  })

  it("returns 500 when database throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })

    // Make the first count call throw
    mockPrisma.lead.count.mockRejectedValue(new Error("Database connection failed"))

    const { GET } = await import("@/app/api/dashboard/route")
    const response = await GET()
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe("Internal server error")
  })
})
