import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Separator } from "../separator"

describe("Separator", () => {
  it("renders a separator element", () => {
    const { container } = render(<Separator />)
    expect(container.querySelector("div")).toBeDefined()
  })

  it("renders horizontal by default", () => {
    const { container } = render(<Separator />)
    const el = container.querySelector("div")
    expect(el?.getAttribute("data-orientation")).toBe("horizontal")
  })

  it("renders vertical when specified", () => {
    const { container } = render(<Separator orientation="vertical" />)
    const el = container.querySelector("div")
    expect(el?.getAttribute("data-orientation")).toBe("vertical")
  })

  it("applies custom className", () => {
    const { container } = render(<Separator className="my-4" />)
    const el = container.querySelector("div")
    expect(el?.className).toContain("my-4")
  })

  it("is decorative by default", () => {
    const { container } = render(<Separator />)
    const el = container.querySelector("div")
    expect(el?.getAttribute("data-orientation")).toBe("horizontal")
  })
})
