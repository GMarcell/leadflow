import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "../card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card><p>Card content</p></Card>)
    expect(screen.getByText("Card content")).toBeDefined()
  })

  it("applies default card classes", () => {
    render(<Card>Content</Card>)
    const card = screen.getByText("Content").closest("div")
    expect(card?.className).toContain("rounded-xl")
    expect(card?.className).toContain("border")
    expect(card?.className).toContain("bg-card")
  })

  it("applies custom className", () => {
    render(<Card className="custom-card">Content</Card>)
    const card = screen.getByText("Content").closest("div")
    expect(card?.className).toContain("custom-card")
  })

  it("has displayName set", () => {
    expect(Card.displayName).toBe("Card")
  })
})

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader><h2>Header</h2></CardHeader>)
    expect(screen.getByText("Header")).toBeDefined()
  })

  it("applies default header classes", () => {
    render(<CardHeader>Header</CardHeader>)
    const header = screen.getByText("Header")
    expect(header.className).toContain("flex")
    expect(header.className).toContain("p-6")
  })

  it("has displayName set", () => {
    expect(CardHeader.displayName).toBe("CardHeader")
  })
})

describe("CardTitle", () => {
  it("renders children", () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText("My Title")).toBeDefined()
  })

  it("applies title classes", () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText("Title")
    expect(title.className).toContain("font-semibold")
    expect(title.className).toContain("tracking-tight")
  })

  it("has displayName set", () => {
    expect(CardTitle.displayName).toBe("CardTitle")
  })
})

describe("CardDescription", () => {
  it("renders children", () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText("Description text")).toBeDefined()
  })

  it("applies description classes", () => {
    render(<CardDescription>Desc</CardDescription>)
    const desc = screen.getByText("Desc")
    expect(desc.className).toContain("text-sm")
    expect(desc.className).toContain("text-muted-foreground")
  })

  it("has displayName set", () => {
    expect(CardDescription.displayName).toBe("CardDescription")
  })
})

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Content body</CardContent>)
    expect(screen.getByText("Content body")).toBeDefined()
  })

  it("applies content classes", () => {
    render(<CardContent>Body</CardContent>)
    const content = screen.getByText("Body")
    expect(content.className).toContain("p-6 pt-0")
  })

  it("has displayName set", () => {
    expect(CardContent.displayName).toBe("CardContent")
  })
})

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter><button>Action</button></CardFooter>)
    expect(screen.getByRole("button", { name: /action/i })).toBeDefined()
  })

  it("applies footer classes", () => {
    render(<CardFooter>Footer</CardFooter>)
    const footer = screen.getByText("Footer")
    expect(footer.className).toContain("flex")
    expect(footer.className).toContain("items-center")
    expect(footer.className).toContain("p-6 pt-0")
  })

  it("has displayName set", () => {
    expect(CardFooter.displayName).toBe("CardFooter")
  })
})

describe("Card composition", () => {
  it("renders a complete card with all subcomponents", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    )

    expect(screen.getByText("Card Title")).toBeDefined()
    expect(screen.getByText("Card description")).toBeDefined()
    expect(screen.getByText("Main content")).toBeDefined()
    expect(screen.getByText("Footer content")).toBeDefined()
  })
})
