"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { Shield, Loader2, Users, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Failed to fetch")
  return r.json()
})

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: {
    leads: number
    notes: number
    followUps: number
  }
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
  MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  VIEWER: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  USER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

const ROLE_ORDER = ["ADMIN", "MANAGER", "USER", "VIEWER"]

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: users, error, isLoading, mutate } = useSWR<User[]>("/api/users", fetcher)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const role = (session?.user as any)?.role

  // Session loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Non-admin users get redirected
  if (role === undefined || role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive/50 mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          Only administrators can access this page.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.replace("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update role")
      }
      toast.success("User role updated")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load users</p>
      </div>
    )
  }

  const sortedUsers = users ? [...users].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  ) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage all users in the system. Only administrators can access this page.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users
          </CardTitle>
          <CardDescription>
            {users?.length || 0} registered user{(users?.length || 0) !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left font-medium px-4 py-3">User</th>
                  <th className="text-left font-medium px-4 py-3">Role</th>
                  <th className="text-center font-medium px-4 py-3">Leads</th>
                  <th className="text-center font-medium px-4 py-3">Notes</th>
                  <th className="text-center font-medium px-4 py-3">Follow-ups</th>
                  <th className="text-left font-medium px-4 py-3">Joined</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] px-2 py-0.5 font-medium ${ROLE_COLORS[user.role] || ""}`}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{user._count.leads}</td>
                    <td className="px-4 py-3 text-center text-sm">{user._count.notes}</td>
                    <td className="px-4 py-3 text-center text-sm">{user._count.followUps}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">                          {updatingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Select
                              value={user.role}
                              onValueChange={(v) => handleRoleChange(user.id, v)}
                            >
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">
                                  <span className="text-red-600 dark:text-red-400">Admin</span>
                                </SelectItem>
                                <SelectItem value="MANAGER">
                                  <span className="text-blue-600 dark:text-blue-400">Manager</span>
                                </SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="VIEWER">
                                  <span className="text-muted-foreground">Viewer</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
