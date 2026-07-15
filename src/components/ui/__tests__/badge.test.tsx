import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Badge } from "../badge"

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText("New")).toBeDefined()
  })

  it("renders with default variant styles", () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText("Default")
    expect(badge.className).toContain("bg-primary")
    expect(badge.className).toContain("rounded-full")
    expect(badge.className).toContain("text-xs")
  })

  it("applies custom className", () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    const badge = screen.getByText("Custom")
    expect(badge.className).toContain("custom-badge")
  })

  describe("variants", () => {
    it("renders default variant", () => {
      render(<Badge variant="default">Default</Badge>)
      expect(screen.getByText("Default").className).toContain("bg-primary")
    })

    it("renders secondary variant", () => {
      render(<Badge variant="secondary">Secondary</Badge>)
      expect(screen.getByText("Secondary").className).toContain("bg-secondary")
    })

    it("renders destructive variant", () => {
      render(<Badge variant="destructive">Destructive</Badge>)
      expect(screen.getByText("Destructive").className).toContain("bg-destructive")
    })

    it("renders outline variant", () => {
      render(<Badge variant="outline">Outline</Badge>)
      expect(screen.getByText("Outline").className).toContain("text-foreground")
    })

    it("renders success variant", () => {
      render(<Badge variant="success">Success</Badge>)
      const badge = screen.getByText("Success")
      expect(badge.className).toContain("bg-emerald-500/10")
      expect(badge.className).toContain("dark:bg-emerald-500/15")
    })

    it("renders warning variant", () => {
      render(<Badge variant="warning">Warning</Badge>)
      const badge = screen.getByText("Warning")
      expect(badge.className).toContain("bg-amber-500/10")
      expect(badge.className).toContain("dark:bg-amber-500/15")
    })

    it("renders info variant", () => {
      render(<Badge variant="info">Info</Badge>)
      const badge = screen.getByText("Info")
      expect(badge.className).toContain("bg-sky-500/10")
      expect(badge.className).toContain("dark:bg-sky-500/15")
    })
  })

  it("renders with an icon child", () => {
    render(<Badge><span data-testid="icon">✓</span> Done</Badge>)
    expect(screen.getByTestId("icon")).toBeDefined()
    expect(screen.getByText("Done")).toBeDefined()
  })

  it("forwards additional HTML attributes", () => {
    render(<Badge data-testid="badge-el" aria-label="status">Active</Badge>)
    const badge = screen.getByTestId("badge-el")
    expect(badge.getAttribute("aria-label")).toBe("status")
  })
})
