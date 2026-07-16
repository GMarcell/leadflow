import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LeadForm } from "../lead-form"

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock next-themes (needed for child components)
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "dark", setTheme: vi.fn() })),
}))

describe("LeadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "new-lead" }),
    })
  })

  it("renders form fields", () => {
    render(<LeadForm />)
    expect(screen.getByLabelText(/name/i)).toBeDefined()
    expect(screen.getByLabelText(/company/i)).toBeDefined()
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/phone/i)).toBeDefined()
    expect(screen.getByText(/stage/i)).toBeDefined()
  })

  it("shows create button when no initial data", () => {
    render(<LeadForm />)
    expect(screen.getByRole("button", { name: /create lead/i })).toBeDefined()
  })

  it("shows update button when editing", () => {
    render(
      <LeadForm
        initialData={{
          id: "lead-1",
          name: "Existing",
          source: "WEBSITE",
          status: "QUALIFIED",
          tags: [],
        }}
      />
    )
    expect(screen.getByRole("button", { name: /update lead/i })).toBeDefined()
  })

  it("pre-fills form when editing", () => {
    render(
      <LeadForm
        initialData={{
          id: "lead-1",
          name: "Jane Smith",
          company: "Acme Corp",
          source: "REFERRAL",
          status: "QUALIFIED",
          tags: [],
        }}
      />
    )
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    expect(nameInput.value).toBe("Jane Smith")

    const companyInput = screen.getByLabelText(/company/i) as HTMLInputElement
    expect(companyInput.value).toBe("Acme Corp")
  })

  it("pre-fills tags as comma-separated when editing", () => {
    render(
      <LeadForm
        initialData={{
          id: "lead-1",
          name: "Test",
          source: "OTHER",
          status: "NEW",
          tags: ["hot", "vip"],
        }}
      />
    )
    const tagsInput = screen.getByLabelText(/tags/i) as HTMLInputElement
    expect(tagsInput.value).toBe("hot, vip")
  })

  it("calls onSuccess after creating a lead", async () => {
    const onSuccess = vi.fn()
    render(<LeadForm onSuccess={onSuccess} />)

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.type(nameInput, "New Lead")

    const submitButton = screen.getByRole("button", { name: /create lead/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it("calls onSuccess after updating a lead", async () => {
    const onSuccess = vi.fn()
    render(
      <LeadForm
        initialData={{
          id: "lead-1",
          name: "Existing",
          source: "WEBSITE",
          status: "NEW",
          tags: [],
        }}
        onSuccess={onSuccess}
      />
    )

    const submitButton = screen.getByRole("button", { name: /update lead/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it("renders cancel button when onCancel is provided", () => {
    render(<LeadForm onCancel={vi.fn()} />)
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined()
  })

  it("does not render cancel button when onCancel is not provided", () => {
    render(<LeadForm />)
    expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull()
  })

  it("submits form data to correct endpoint for new lead", async () => {
    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.type(nameInput, "Brand New Lead")

    const submitButton = screen.getByRole("button", { name: /create lead/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/leads",
        expect.objectContaining({
          method: "POST",
        })
      )
    })
  })

  it("submits form data to correct endpoint for existing lead", async () => {
    render(
      <LeadForm
        initialData={{
          id: "lead-42",
          name: "Update Me",
          source: "EMAIL_CAMPAIGN",
          status: "CONTACTED",
          tags: [],
        }}
      />
    )

    const submitButton = screen.getByRole("button", { name: /update lead/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/leads/lead-42",
        expect.objectContaining({
          method: "PATCH",
        })
      )
    })
  })

  it("shows validation error for empty name on submit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Name is required" }),
    })
    render(<LeadForm />)

    // Clear the name field and submit
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    await userEvent.clear(nameInput)

    const submitButton = screen.getByRole("button", { name: /create lead/i })
    fireEvent.click(submitButton)
  })
})
