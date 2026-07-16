import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Input } from "../input"

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input />)
    const input = screen.getByRole("textbox")
    expect(input).toBeDefined()
  })

  it("renders with placeholder text", () => {
    render(<Input placeholder="Enter name" />)
    expect(screen.getByPlaceholderText("Enter name")).toBeDefined()
  })

  it("applies custom className", () => {
    render(<Input className="custom-class" data-testid="input" />)
    const input = screen.getByTestId("input")
    expect(input.className).toContain("custom-class")
  })

  it("handles value changes", () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "new value" } })
    expect(input.value).toBe("new value")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Input ref={ref} data-testid="input" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("supports different types", () => {
    render(<Input type="email" data-testid="input" />)
    const input = screen.getByTestId("input") as HTMLInputElement
    expect(input.type).toBe("email")
  })

  it("can be disabled", () => {
    render(<Input disabled data-testid="input" />)
    const input = screen.getByTestId("input") as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it("displays displayName", () => {
    expect(Input.displayName).toBe("Input")
  })
})
