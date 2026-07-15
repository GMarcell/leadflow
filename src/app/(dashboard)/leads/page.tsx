"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { LeadForm } from "@/components/leads/lead-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Search, Users, ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_VARIANTS: Record<string, "info" | "secondary" | "default" | "warning" | "success" | "destructive"> = {
  NEW: "info",
  CONTACTED: "secondary",
  QUALIFIED: "default",
  PROPOSAL_SENT: "warning",
  WON: "success",
  LOST: "destructive",
}

export default function LeadsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState<"newest" | "name" | "value">("newest")

  const { data: leads, error, isLoading, mutate } = useSWR("/api/leads", fetcher, {
    refreshInterval: 10000,
  })

  const filteredLeads = (leads || [])
    ?.filter((l: any) => {
      const matchesSearch =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.company?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || l.status === statusFilter
      return matchesSearch && matchesStatus
    })
    ?.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name)
        case "value": return (b.dealValue || 0) - (a.dealValue || 0)
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load leads</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage your contacts and prospects
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stages</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="value">Deal Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            {filteredLeads?.length || 0} Lead{(filteredLeads?.length || 0) !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredLeads?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase">
                    <th className="text-left font-medium p-4">Name</th>
                    <th className="text-left font-medium p-4 hidden sm:table-cell">Company</th>
                    <th className="text-left font-medium p-4 hidden md:table-cell">Email</th>
                    <th className="text-left font-medium p-4 hidden lg:table-cell">Source</th>
                    <th className="text-left font-medium p-4">Stage</th>
                    <th className="text-right font-medium p-4">Value</th>
                    <th className="text-left font-medium p-4 hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{lead.name}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">
                        {lead.company || "—"}
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        {lead.email || "—"}
                      </td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">
                        {lead.source.replace("_", " ")}
                      </td>
                      <td className="p-4">
                        <Badge variant={STATUS_VARIANTS[lead.status] || "secondary"}>
                          {lead.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {lead.dealValue ? formatCurrency(lead.dealValue) : "—"}
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-medium mb-1">No leads found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first lead"}
              </p>
              {!search && statusFilter === "ALL" && (
                <Button onClick={() => setShowCreate(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Lead
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the details of your new lead or prospect
            </DialogDescription>
          </DialogHeader>
          <LeadForm
            onSuccess={() => { setShowCreate(false); mutate() }}
            onCancel={() => setShowCreate(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
