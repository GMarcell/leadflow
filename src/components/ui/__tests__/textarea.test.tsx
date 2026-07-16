import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Textarea } from "../textarea"

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeDefined()
  })

  it("renders with placeholder text", () => {
    render(<Textarea placeholder="Enter notes" />)
    expect(screen.getByPlaceholderText("Enter notes")).toBeDefined()
  })

  it("applies custom className", () => {
    render(<Textarea className="custom-class" data-testid="textarea" />)
    const textarea = screen.getByTestId("textarea")
    expect(textarea.className).toContain("custom-class")
  })

  it("handles value changes", () => {
    render(<Textarea data-testid="textarea" />)
    const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: "new content" } })
    expect(textarea.value).toBe("new content")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Textarea ref={ref} data-testid="textarea" />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it("can be disabled", () => {
    render(<Textarea disabled data-testid="textarea" />)
    const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement
    expect(textarea.disabled).toBe(true)
  })

  it("displays displayName", () => {
    expect(Textarea.displayName).toBe("Textarea")
  })
})
