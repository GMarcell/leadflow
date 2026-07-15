"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, TrendingUp, Target, CalendarClock, ArrowRight, Check, Loader2 } from "lucide-react"
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useSWR from "swr"
import { useState } from "react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 30000,
  })
  const [completingId, setCompletingId] = useState<string | null>(null)

  async function handleMarkComplete(fuId: string) {
    setCompletingId(fuId)
    try {
      const res = await fetch(`/api/follow-ups?id=${fuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
      if (!res.ok) throw new Error("Failed to complete follow-up")
      toast.success("Follow-up marked as complete")
      mutate()
    } catch {
      toast.error("Failed to complete follow-up")
    } finally {
      setCompletingId(null)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {session?.user?.name || "User"}
        </h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your pipeline today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.totalLeads ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.newLeads ?? 0} new this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.pipelineValue ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {data?.activeLeads ?? 0} active deals
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.conversionRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Won / Total closed deals
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.wonDeals ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(data?.wonValue ?? 0)} total
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups & Recent Leads */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Follow-ups Due */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Follow-ups Due</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : data?.followUps?.length > 0 ? (
              <div className="space-y-3">
                {data.followUps.slice(0, 5).map((fu: any) => (
                  <div
                    key={fu.id}
                    className="flex items-start justify-between rounded-lg border p-3 group hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{fu.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fu.lead?.name} — {formatDate(fu.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleMarkComplete(fu.id)}
                        disabled={completingId === fu.id}
                        className="h-7 w-7 text-muted-foreground/50 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all"
                        title="Mark as complete"
                      >
                        {completingId === fu.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Badge
                        variant={
                          new Date(fu.dueDate) < new Date()
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {new Date(fu.dueDate) < new Date() ? "Overdue" : "Today"}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/pipeline">
                    View all follow-ups
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No follow-ups due</p>
                <Button variant="link" size="sm" asChild>
                  <Link href="/leads">Add a lead to get started</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : data?.recentLeads?.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeads.slice(0, 5).map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lead.company || "No company"} — {timeAgo(lead.createdAt)}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(lead.status)} className="ml-2 shrink-0">
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/leads">
                    View all leads
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No leads yet</p>
                <Button variant="link" size="sm" asChild>
                  <Link href="/leads">Create your first lead</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getStatusVariant(status: string): "default" | "secondary" | "success" | "warning" | "info" | "destructive" {
  switch (status) {
    case "NEW": return "info"
    case "CONTACTED": return "secondary"
    case "QUALIFIED": return "default"
    case "PROPOSAL_SENT": return "warning"
    case "WON": return "success"
    case "LOST": return "destructive"
    default: return "secondary"
  }
}
