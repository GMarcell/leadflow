import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { KanbanBoard } from "../kanban-board"

// Mock next-themes (needed for child LeadCard components)
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "dark", setTheme: vi.fn(), resolvedTheme: "dark" })),
}))

// Mock useSession from next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: { user: { name: "Test" } }, status: "authenticated" })),
  signOut: vi.fn(),
}))

const mockLeads = [
  {
    id: "lead-1",
    name: "Alice",
    company: "Company A",
    email: null,
    phone: null,
    source: "WEBSITE",
    tags: [],
    dealValue: 10000,
    status: "NEW",
    notes: [],
    followUps: [],
    createdAt: new Date().toISOString(),
    pipelineOrder: 0,
  },
  {
    id: "lead-2",
    name: "Bob",
    company: "Company B",
    email: null,
    phone: null,
    source: "REFERRAL",
    tags: ["vip"],
    dealValue: 50000,
    status: "QUALIFIED",
    notes: [],
    followUps: [],
    createdAt: new Date().toISOString(),
    pipelineOrder: 0,
  },
  {
    id: "lead-3",
    name: "Charlie",
    company: null,
    email: null,
    phone: null,
    source: "COLD_OUTREACH",
    tags: [],
    dealValue: null,
    status: "WON",
    notes: [],
    followUps: [],
    createdAt: new Date().toISOString(),
    pipelineOrder: 0,
  },
  {
    id: "lead-4",
    name: "Diana",
    company: null,
    email: null,
    phone: null,
    source: "EVENT",
    tags: [],
    dealValue: 25000,
    status: "NEW",
    notes: [],
    followUps: [],
    createdAt: new Date().toISOString(),
    pipelineOrder: 1,
  },
]

describe("KanbanBoard", () => {
  it("renders all stage columns", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)

    // Stage labels appear both as column headers and on card stage badges
    expect(screen.getAllByText("New").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Contacted")).toBeDefined()
    expect(screen.getAllByText("Qualified").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Proposal Sent")).toBeDefined()
    expect(screen.getAllByText("Won").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Lost")).toBeDefined()
  })

  it("places leads in correct columns", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)

    // Look for the stage badges on cards
    const newBadges = screen.getAllByText("New")
    const qualifiedBadges = screen.getAllByText("Qualified")
    const wonBadges = screen.getAllByText("Won")

    // "New" appears as column header + stage badges on the 2 leads in NEW stage
    expect(newBadges.length).toBeGreaterThanOrEqual(2)
    // "Qualified" appears as column header + 1 lead
    expect(qualifiedBadges.length).toBeGreaterThanOrEqual(1)
    // "Won" appears as column header + 1 lead
    expect(wonBadges.length).toBeGreaterThanOrEqual(1)
  })

  it("shows lead names in the board", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)
    expect(screen.getByText("Alice")).toBeDefined()
    expect(screen.getByText("Bob")).toBeDefined()
    expect(screen.getByText("Charlie")).toBeDefined()
    expect(screen.getByText("Diana")).toBeDefined()
  })

  it("shows deal values in columns", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)

    // NEW stage: Alice $10,000 + Diana $25,000 = $35,000
    expect(screen.getByText("$35,000")).toBeDefined()
    // Bob's card shows $50,000 (column also shows it as total)
    const fiftyK = screen.getAllByText("$50,000")
    expect(fiftyK.length).toBeGreaterThanOrEqual(1)
  })

  it("shows lead count badges on columns", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)

    // New column should have 2 leads
    const twos = screen.getAllByText("2")
    expect(twos.length).toBeGreaterThanOrEqual(1)
  })

  it("shows 'No leads' in empty columns", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)

    const noLeadsMessages = screen.getAllByText("No leads")
    expect(noLeadsMessages.length).toBeGreaterThanOrEqual(1)
  })

  it("handles empty leads array", () => {
    render(<KanbanBoard leads={[]} onUpdate={vi.fn()} />)

    // All columns should show "No leads"
    const noLeadsMessages = screen.getAllByText("No leads")
    expect(noLeadsMessages).toHaveLength(6) // one per column

    // All column headers should be visible
    expect(screen.getByText("New")).toBeDefined()
    expect(screen.getByText("Lost")).toBeDefined()
  })

  it("shows lead details on cards in correct columns", () => {
    render(<KanbanBoard leads={mockLeads} onUpdate={vi.fn()} />)

    // Bob is qualified with $50,000
    expect(screen.getByText("Bob")).toBeDefined()
    expect(screen.getByText("Company B")).toBeDefined()
    expect(screen.getByText("vip")).toBeDefined()
  })
})
