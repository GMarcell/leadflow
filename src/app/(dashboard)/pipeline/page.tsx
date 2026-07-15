"use client"

import { KanbanBoard } from "@/components/leads/kanban-board"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { KanbanSquare } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PipelinePage() {
  const { data: leads, error, isLoading, mutate } = useSWR("/api/leads", fetcher, {
    refreshInterval: 5000,
  })

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load pipeline</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Drag leads between stages to update their status
        </p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : leads?.length > 0 ? (
        <KanbanBoard leads={leads} onUpdate={() => mutate()} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <KanbanSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="font-medium mb-1">No leads in pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Add leads to start tracking your sales pipeline
          </p>
        </div>
      )}
    </div>
  )
}
