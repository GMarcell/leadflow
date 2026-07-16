import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Label } from "../label"

describe("Label", () => {
  it("renders with text content", () => {
    render(<Label>Name</Label>)
    expect(screen.getByText("Name")).toBeDefined()
  })

  it("applies custom className", () => {
    render(<Label className="custom-class" data-testid="label">Label</Label>)
    const label = screen.getByTestId("label")
    expect(label.className).toContain("custom-class")
  })

  it("forwards htmlFor attribute", () => {
    render(<Label htmlFor="name-input">Name</Label>)
    const label = screen.getByText("Name") as HTMLLabelElement
    expect(label.htmlFor).toBe("name-input")
  })

  it("displays displayName", () => {
    expect(Label.displayName).toBe("Label")
  })
})
