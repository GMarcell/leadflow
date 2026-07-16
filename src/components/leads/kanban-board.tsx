"use client";

import { LeadCard } from "./lead-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { STAGES } from "@/lib/stages";

interface Lead {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source: string;
  tags: string[];
  dealValue?: number | null;
  status: string;
  notes: unknown[];
  followUps: unknown[];
  createdAt: string;
  pipelineOrder: number;
}

interface KanbanBoardProps {
  leads: Lead[];
  onUpdate: () => void;
}

function PipelineColumn({
  stage,
  leads,
  stageValue,
  onUpdate,
}: {
  stage: { key: string; label: string; color: string };
  leads: Lead[];
  stageValue: number;
  onUpdate: () => void;
}) {
  return (
    <div className="shrink-0 w-72">
      <Card>
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${stage.color.split(" ")[0]}`}
              />
              <CardTitle className="text-sm font-medium">
                {stage.label}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {leads.length}
            </Badge>
          </div>
          {stageValue > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stageValue)}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-2 space-y-2 min-h-[120px]">
          {leads.map((lead) => (
            <LeadCard key={`${lead.id}-${lead.status}`} lead={lead} onUpdate={onUpdate} />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg border-muted-foreground/20">
              <p className="text-xs text-muted-foreground">No leads</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ leads: allLeads, onUpdate }: KanbanBoardProps) {
  const getLeadsByStage = (stage: string) =>
    allLeads
      .filter((l) => l.status === stage)
      .sort((a, b) => a.pipelineOrder - b.pipelineOrder);

  const getStageValue = (stage: string) =>
    getLeadsByStage(stage).reduce((sum, l) => sum + (l.dealValue || 0), 0);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
      {STAGES.map((stage) => {
        const stageLeads = getLeadsByStage(stage.key);
        const stageValue = getStageValue(stage.key);

        return (
          <PipelineColumn
            key={stage.key}
            stage={stage}
            leads={stageLeads}
            stageValue={stageValue}
            onUpdate={onUpdate}
          />
        );
      })}
    </div>
  );
}
