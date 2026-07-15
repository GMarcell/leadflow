import { describe, it, expect } from "vitest"
import {
  cn,
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  getErrorMessage,
  getInitials,
  timeAgo,
} from "../utils"

// ─── cn (className merge) ────────────────────

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6")
  })

  it("handles empty inputs", () => {
    expect(cn()).toBe("")
  })

  it("handles undefined values", () => {
    expect(cn("a", undefined, "b")).toBe("a b")
  })
})

// ─── formatCurrency ──────────────────────────

describe("formatCurrency", () => {
  it("formats a positive number", () => {
    expect(formatCurrency(50000)).toBe("$50,000")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0")
  })

  it("formats a small number", () => {
    expect(formatCurrency(49.99)).toBe("$50")
  })

  it("formats a large number", () => {
    expect(formatCurrency(1_234_567)).toBe("$1,234,567")
  })
})

// ─── formatCompactCurrency ───────────────────

describe("formatCompactCurrency", () => {
  it("formats millions", () => {
    expect(formatCompactCurrency(2_500_000)).toBe("$2.5M")
  })

  it("formats thousands", () => {
    expect(formatCompactCurrency(75_000)).toBe("$75K")
  })

  it("formats hundreds (no abbreviation)", () => {
    expect(formatCompactCurrency(500)).toBe("$500")
  })

  it("handles zero", () => {
    expect(formatCompactCurrency(0)).toBe("$0")
  })

  it("handles exactly 1 million", () => {
    expect(formatCompactCurrency(1_000_000)).toBe("$1.0M")
  })
})

// ─── formatPercent ───────────────────────────

describe("formatPercent", () => {
  it("formats a positive percent", () => {
    expect(formatPercent(25)).toBe("+25.0%")
  })

  it("formats a negative percent", () => {
    expect(formatPercent(-10)).toBe("-10.0%")
  })

  it("formats zero percent", () => {
    expect(formatPercent(0)).toBe("+0.0%")
  })

  it("formats with decimal places", () => {
    expect(formatPercent(15.5)).toBe("+15.5%")
  })
})

// ─── formatDate ──────────────────────────────

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-07-15")
    expect(result).toContain("Jul")
    expect(result).toContain("15")
    expect(result).toContain("2026")
  })

  it("formats a Date object", () => {
    const result = formatDate(new Date(2026, 6, 4))
    expect(result).toContain("Jul")
    expect(result).toContain("4")
    expect(result).toContain("2026")
  })

  it("accepts custom options", () => {
    const result = formatDate("2026-07-15", { month: "long" })
    expect(result).toContain("July")
  })

  it("formats without year when specified", () => {
    const result = formatDate("2026-07-15", { year: undefined })
    expect(result).not.toContain("2026")
  })
})

// ─── formatDateTime ──────────────────────────

describe("formatDateTime", () => {
  it("includes time in the output", () => {
    const result = formatDateTime("2026-07-15T14:30:00")
    expect(result).toContain("Jul")
    expect(result).toContain("15")
    expect(result).toContain("2026")
    expect(result).toContain(":")
  })
})

// ─── getErrorMessage ─────────────────────────

describe("getErrorMessage", () => {
  it("returns Error message", () => {
    expect(getErrorMessage(new Error("Something broke"))).toBe("Something broke")
  })

  it("returns fallback for non-Error values", () => {
    expect(getErrorMessage("string error")).toBe("Something went wrong.")
  })

  it("returns custom fallback", () => {
    expect(getErrorMessage(null, "Custom error")).toBe("Custom error")
  })

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("Something went wrong.")
  })

  it("returns fallback for objects", () => {
    expect(getErrorMessage({ code: 500 })).toBe("Something went wrong.")
  })
})

// ─── getInitials ─────────────────────────────

describe("getInitials", () => {
  it("returns initials for a full name", () => {
    expect(getInitials("John Doe")).toBe("JD")
  })

  it("returns single initial for one name", () => {
    expect(getInitials("John")).toBe("J")
  })

  it("converts to uppercase", () => {
    expect(getInitials("john doe")).toBe("JD")
  })

  it("returns first two initials for multiple names", () => {
    expect(getInitials("John Michael Doe")).toBe("JM")
  })

  it("handles empty string", () => {
    expect(getInitials("")).toBe("")
  })
})

// ─── timeAgo ─────────────────────────────────

describe("timeAgo", () => {
  it("returns 'just now' for less than a minute", () => {
    expect(timeAgo(new Date())).toBe("just now")
  })

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000)
    expect(timeAgo(fiveMinAgo)).toBe("5m ago")
  })

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000)
    expect(timeAgo(threeHoursAgo)).toBe("3h ago")
  })

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000)
    expect(timeAgo(twoDaysAgo)).toBe("2d ago")
  })

  it("returns formatted date for more than 7 days", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000)
    const result = timeAgo(tenDaysAgo)
    // Should not contain "ago" — falls back to formatted date
    expect(result).not.toMatch(/^(just now|\\d+[mhd] ago)$/)
    expect(result).toContain("2026")
  })

  it("handles string dates", () => {
    const result = timeAgo(new Date().toISOString())
    expect(result).toBe("just now")
  })
})
