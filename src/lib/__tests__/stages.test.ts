import { describe, it, expect } from "vitest"
import { STAGES } from "../stages"

describe("STAGES", () => {
  it("has 6 stages", () => {
    expect(STAGES).toHaveLength(6)
  })

  it("includes all expected stages in order", () => {
    const keys = STAGES.map((s) => s.key)
    expect(keys).toEqual([
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "WON",
      "LOST",
    ])
  })

  it("each stage has a key, label, and color", () => {
    for (const stage of STAGES) {
      expect(stage.key).toBeTruthy()
      expect(stage.label).toBeTruthy()
      expect(stage.color).toMatch(/^(bg-\S+) (.+)$/)
    }
  })

  it("has unique keys", () => {
    const keys = STAGES.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("has human-readable labels", () => {
    const labels = STAGES.map((s) => s.label)
    expect(labels).toContain("New")
    expect(labels).toContain("Proposal Sent")
    expect(labels).toContain("Won")
    expect(labels).toContain("Lost")
  })
})
