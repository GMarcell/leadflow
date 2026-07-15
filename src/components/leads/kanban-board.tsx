"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { LeadCard } from "./lead-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Plus } from "lucide-react"

const STAGES = [
  { key: "NEW", label: "New", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { key: "CONTACTED", label: "Contacted", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { key: "QUALIFIED", label: "Qualified", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { key: "WON", label: "Won", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { key: "LOST", label: "Lost", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
]

interface Lead {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  source: string
  tags: string[]
  dealValue?: number | null
  status: string
  notes: any[]
  followUps: any[]
  createdAt: string
  pipelineOrder: number
}

interface KanbanBoardProps {
  leads: Lead[]
  onUpdate: () => void
}

function SortableLeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onUpdate={onUpdate} isDragging={isDragging} />
    </div>
  )
}

export function KanbanBoard({ leads: allLeads, onUpdate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const getLeadsByStage = (stage: string) =>
    allLeads
      .filter((l) => l.status === stage)
      .sort((a, b) => a.pipelineOrder - b.pipelineOrder)

  const getStageValue = (stage: string) =>
    getLeadsByStage(stage).reduce((sum, l) => sum + (l.dealValue || 0), 0)

  const activeLead = activeId ? allLeads.find((l) => l.id === activeId) : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event

      if (!over) return

      // If dropped over a lead, find which column it's in
      const activeLead = allLeads.find((l) => l.id === active.id)
      if (!activeLead) return

      // Determine target stage
      let targetStage = ""
      if (STAGES.some((s) => s.key === over.id)) {
        targetStage = over.id as string
      } else {
        const overLead = allLeads.find((l) => l.id === over.id)
        if (overLead) {
          targetStage = overLead.status
        }
      }

      if (!targetStage || targetStage === activeLead.status) return

      // Optimistic update
      const newOrder = getLeadsByStage(targetStage).length

      try {
        const res = await fetch("/api/pipeline/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: activeLead.id,
            status: targetStage,
            order: newOrder,
          }),
        })

        if (!res.ok) throw new Error("Failed to move lead")
        onUpdate()
      } catch {
        toast.error("Failed to move lead")
        onUpdate()
      }
    },
    [allLeads, onUpdate]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {STAGES.map((stage) => {
          const stageLeads = getLeadsByStage(stage.key)
          const stageValue = getStageValue(stage.key)

          return (
            <div key={stage.key} className="flex-shrink-0 w-72">
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color.split(" ")[0]}`} />
                      <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(stageValue)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2 min-h-[120px]">
                  <SortableContext
                    items={stageLeads.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageLeads.map((lead) => (
                      <SortableLeadCard
                        key={lead.id}
                        lead={lead}
                        onUpdate={onUpdate}
                      />
                    ))}
                  </SortableContext>
                  {stageLeads.length === 0 && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg border-muted-foreground/20">
                      <p className="text-xs text-muted-foreground">Drop leads here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeLead ? (
          <LeadCard lead={activeLead} onUpdate={onUpdate} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
