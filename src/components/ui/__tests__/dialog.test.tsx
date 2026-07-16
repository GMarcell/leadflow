import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../dialog"

describe("Dialog", () => {
  it("renders trigger and shows content when open", () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <div>Content</div>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText("Title")).toBeDefined()
    expect(screen.getByText("Description")).toBeDefined()
    expect(screen.getByText("Content")).toBeDefined()
  })

  it("does not render content when closed", () => {
    render(
      <Dialog open={false}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <div>Hidden Content</div>
        </DialogContent>
      </Dialog>
    )
    expect(screen.queryByText("Hidden Content")).toBeNull()
  })

  it("renders close button in content", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    const closeButton = screen.getByRole("button", { name: /close/i })
    expect(closeButton).toBeDefined()
  })

  it("DialogTitle forwards additional HTML attributes", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle data-testid="dialog-title">Test Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByTestId("dialog-title")).toBeDefined()
  })

  it("DialogHeader has displayName", () => {
    expect(DialogHeader.displayName).toBe("DialogHeader")
  })

  it("DialogFooter has displayName", () => {
    expect(DialogFooter.displayName).toBe("DialogFooter")
  })

  it("DialogClose has displayName", () => {
    expect(DialogClose.displayName).toBeDefined()
  })
})
