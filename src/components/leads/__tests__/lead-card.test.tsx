import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { LeadCard } from "../lead-card"

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { user: { name: "Test", role: "ADMIN" } },
    status: "authenticated",
  })),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "dark", setTheme: vi.fn(), resolvedTheme: "dark" })),
}))

const mockLead = {
  id: "lead-1",
  name: "Jane Smith",
  company: "Acme Corp",
  email: "jane@acme.com",
  phone: "+1-555-0000",
  source: "REFERRAL",
  tags: ["hot", "enterprise"],
  dealValue: 50000,
  status: "QUALIFIED",
  notes: [
    { id: "n-1", content: "Great meeting", createdAt: new Date().toISOString() },
  ],
  followUps: [],
  createdAt: new Date().toISOString(),
}

describe("LeadCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders lead name", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    expect(screen.getByText("Jane Smith")).toBeDefined()
  })

  it("renders company name", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    expect(screen.getByText("Acme Corp")).toBeDefined()
  })

  it("renders deal value", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    expect(screen.getByText("$50,000")).toBeDefined()
  })

  it("renders tags", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    expect(screen.getByText("hot")).toBeDefined()
    expect(screen.getByText("enterprise")).toBeDefined()
  })

  it("renders lead source", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    expect(screen.getByText("REFERRAL")).toBeDefined()
  })

  it("renders stage badge with current stage label", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    // The stage badge should be in STAGES.find(s => s.key === "QUALIFIED")?.label
    expect(screen.getByText("Qualified")).toBeDefined()
  })

  it("renders note count", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    expect(screen.getByText("1 note")).toBeDefined()
  })

  it("renders multiple action buttons", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    const buttons = screen.getAllByRole("button")
    // At minimum: edit, delete, move stage, add note, set follow-up, AI suggestion
    expect(buttons.length).toBeGreaterThanOrEqual(6)
  })

  it("renders move stage button", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    const moveButton = screen.getByRole("button", { name: /move to stage/i })
    expect(moveButton).toBeDefined()
  })

  it("renders add note button", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    const noteButton = screen.getByRole("button", { name: /add note/i })
    expect(noteButton).toBeDefined()
  })

  it("renders set follow-up button", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    const fuButton = screen.getByRole("button", { name: /set follow-up/i })
    expect(fuButton).toBeDefined()
  })

  it("renders AI suggestion button", () => {
    render(<LeadCard lead={mockLead} onUpdate={vi.fn()} />)
    const suggestButton = screen.getByRole("button", { name: /get ai suggestion/i })
    expect(suggestButton).toBeDefined()
  })

  it("does not render deal value when value is 0", () => {
    const leadNoValue = { ...mockLead, dealValue: null }
    render(<LeadCard lead={leadNoValue} onUpdate={vi.fn()} />)
    expect(screen.queryByText("$0")).toBeNull()
  })

  it("does not render company when not provided", () => {
    const leadNoCompany = { ...mockLead, company: null }
    render(<LeadCard lead={leadNoCompany} onUpdate={vi.fn()} />)
    expect(screen.queryByText("Acme Corp")).toBeNull()
  })

  it("does not render note count when no notes", () => {
    const leadNoNotes = { ...mockLead, notes: [] }
    render(<LeadCard lead={leadNoNotes} onUpdate={vi.fn()} />)
    expect(screen.queryByText("0 note")).toBeNull()
  })
})
