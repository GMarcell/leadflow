"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadForm } from "@/components/leads/lead-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { KanbanSquare, Plus } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PipelinePage() {
  const [showCreate, setShowCreate] = useState(false);
  const {
    data: leads,
    error,
    isLoading,
    mutate,
  } = useSWR("/api/leads", fetcher, {
    refreshInterval: 5000,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load pipeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Click the arrow icon on a lead to move it between stages
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Create Lead
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-72">
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
          <p className="text-sm text-muted-foreground mb-4">
            Add leads to start tracking your sales pipeline
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Lead
          </Button>
        </div>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Lead</DialogTitle>
            <DialogDescription>Add a new lead to the pipeline</DialogDescription>
          </DialogHeader>
          <LeadForm
            onSuccess={() => {
              setShowCreate(false);
              mutate();
            }}
            onCancel={() => setShowCreate(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
