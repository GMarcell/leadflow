import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "../button"

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeDefined()
    expect(button.className).toContain("bg-primary")
    expect(button.className).toContain("h-9")
  })

  it("renders children text", () => {
    render(<Button>Submit</Button>)
    expect(screen.getByText("Submit")).toBeDefined()
  })

  it("renders as a button element by default", () => {
    render(<Button>Test</Button>)
    const button = screen.getByRole("button")
    expect(button.tagName).toBe("BUTTON")
  })

  it("applies custom className", () => {
    render(<Button className="my-custom-class">Custom</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("my-custom-class")
  })

  it("handles click events", () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it("does not fire click when disabled", () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    fireEvent.click(screen.getByRole("button"))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("applies disabled styles", () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("disabled:opacity-50")
    expect(button.className).toContain("disabled:pointer-events-none")
  })

  describe("variants", () => {
    it("renders default variant", () => {
      render(<Button variant="default">Default</Button>)
      expect(screen.getByRole("button").className).toContain("bg-primary")
    })

    it("renders destructive variant", () => {
      render(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole("button").className).toContain("bg-destructive")
    })

    it("renders outline variant", () => {
      render(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole("button").className).toContain("border-input")
    })

    it("renders secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole("button").className).toContain("bg-secondary")
    })

    it("renders ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole("button").className).toContain("hover:bg-accent")
    })

    it("renders link variant", () => {
      render(<Button variant="link">Link</Button>)
      expect(screen.getByRole("button").className).toContain("hover:underline")
    })
  })

  describe("sizes", () => {
    it("renders default size", () => {
      render(<Button size="default">Default</Button>)
      expect(screen.getByRole("button").className).toContain("h-9")
    })

    it("renders sm size", () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole("button")
      expect(button.className).toContain("h-8")
      expect(button.className).toContain("text-xs")
    })

    it("renders lg size", () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByRole("button").className).toContain("h-10")
    })

    it("renders icon size", () => {
      render(<Button size="icon">Icon</Button>)
      expect(screen.getByRole("button").className).toContain("h-9 w-9")
    })

    it("renders icon-sm size", () => {
      render(<Button size="icon-sm">Small Icon</Button>)
      expect(screen.getByRole("button").className).toContain("h-8 w-8")
    })
  })

  it("forwards additional HTML attributes", () => {
    render(<Button type="submit" aria-label="submit-btn">Submit</Button>)
    const button = screen.getByRole("button")
    expect(button.getAttribute("type")).toBe("submit")
    expect(button.getAttribute("aria-label")).toBe("submit-btn")
  })

  it("renders with an icon child", () => {
    render(<Button><span data-testid="icon">⭐</span> Star</Button>)
    expect(screen.getByTestId("icon")).toBeDefined()
    expect(screen.getByText("Star")).toBeDefined()
  })

  it("has displayName set", () => {
    expect(Button.displayName).toBe("Button")
  })
})
