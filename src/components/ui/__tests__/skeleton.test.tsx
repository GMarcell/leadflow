import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Skeleton } from "../skeleton"

describe("Skeleton", () => {
  it("renders a div element", () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector("div")).toBeDefined()
  })

  it("applies default skeleton classes", () => {
    const { container } = render(<Skeleton />)
    const div = container.querySelector("div")
    expect(div?.className).toContain("animate-pulse")
    expect(div?.className).toContain("rounded-md")
    expect(div?.className).toContain("bg-muted")
  })

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="h-10 w-20" />)
    const div = container.querySelector("div")
    expect(div?.className).toContain("h-10")
    expect(div?.className).toContain("w-20")
  })

  it("forwards additional HTML attributes", () => {
    const { container } = render(<Skeleton data-testid="skeleton" />)
    expect(container.querySelector("[data-testid='skeleton']")).toBeDefined()
  })
})
