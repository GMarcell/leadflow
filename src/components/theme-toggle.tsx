"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className="h-9 w-9 rounded-full border-border/50 bg-background/80 backdrop-blur-sm"
        disabled
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  function toggle() {
    // If currently using "system", resolve the next state based on actual appearance
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark")
    } else {
      setTheme(isDark ? "light" : "dark")
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggle}
      className="h-9 w-9 rounded-full border-border/50 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all duration-300" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-all duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
