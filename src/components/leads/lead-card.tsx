"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { LeadForm } from "./lead-form"
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/utils"
import { Pencil, Trash2, MessageSquarePlus, Sparkles, Loader2, CalendarPlus, Lightbulb, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { STAGES } from "@/lib/stages"

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
}

interface LeadCardProps {
  lead: Lead
  onUpdate: () => void
}

export function LeadCard({ lead, onUpdate }: LeadCardProps) {
    const { data: session } = useSession()
    const userRole = (session?.user as any)?.role as string | undefined
    const isViewer = userRole === "VIEWER"

    const [showEdit, setShowEdit] = useState(false)
    const [showNote, setShowNote] = useState(false)
    const [showFollowUp, setShowFollowUp] = useState(false)
    const [noteContent, setNoteContent] = useState("")
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [summary, setSummary] = useState<string | null>(null)
    const [isSavingNote, setIsSavingNote] = useState(false)

    // Follow-up form
    const [fuTitle, setFuTitle] = useState("")
    const [fuDate, setFuDate] = useState("")
    const [fuDesc, setFuDesc] = useState("")
    const [isSavingFu, setIsSavingFu] = useState(false)

    // AI suggestion
    const [showSuggest, setShowSuggest] = useState(false)
    const [isSuggesting, setIsSuggesting] = useState(false)
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [suggestionError, setSuggestionError] = useState<string | null>(null)

    async function handleDelete() {
      if (!confirm("Delete this lead?")) return
      try {
        const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete")
        toast.success("Lead deleted")
        onUpdate()
      } catch {
        toast.error("Failed to delete lead")
      }
    }

    async function handleSummarize() {
      if (!noteContent.trim()) return
      setIsSummarizing(true)
      try {
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: noteContent }),
        })
        if (!res.ok) throw new Error("AI summarization failed")
        const data = await res.json()
        setSummary(data.summary)
      } catch {
        toast.error("AI summarization failed. Check your Groq API key.")
      } finally {
        setIsSummarizing(false)
      }
    }

    async function handleSaveNote() {
      if (!noteContent.trim()) return
      setIsSavingNote(true)
      try {
        const body = summary
          ? { content: noteContent, summary, leadId: lead.id }
          : { content: noteContent, leadId: lead.id }
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Failed to save note")
        toast.success("Note saved")
        setNoteContent("")
        setSummary(null)
        setShowNote(false)
        onUpdate()
      } catch {
        toast.error("Failed to save note")
      } finally {
        setIsSavingNote(false)
      }
    }

    function getDaysSinceLastContact(): number {
      const latestNote = lead.notes?.[0]
      if (!latestNote) return 0
      const lastContact = new Date(latestNote.createdAt)
      const now = new Date()
      return Math.floor((now.getTime() - lastContact.getTime()) / 86400000)
    }

    function getLatestNoteContent(): string {
      const latestNote = lead.notes?.[0]
      return latestNote?.content?.slice(0, 500) || ""
    }

    async function handleGetSuggestion() {
      setIsSuggesting(true)
      setSuggestion(null)
      setSuggestionError(null)
      try {
        const res = await fetch("/api/ai/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadName: lead.name,
            leadStage: lead.status,
            notes: getLatestNoteContent(),
            daysSinceLastContact: getDaysSinceLastContact(),
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "AI suggestion failed")
        }
        const data = await res.json()
        setSuggestion(data.suggestion)
      } catch (err) {
        setSuggestionError(err instanceof Error ? err.message : "Failed to get suggestion")
      } finally {
        setIsSuggesting(false)
      }
    }

    async function handleSaveFollowUp() {
      if (!fuTitle.trim() || !fuDate) return
      setIsSavingFu(true)
      try {
        const res = await fetch("/api/follow-ups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fuTitle,
            description: fuDesc || null,
            dueDate: fuDate,
            leadId: lead.id,
          }),
        })
        if (!res.ok) throw new Error("Failed to create follow-up")
        toast.success("Follow-up created")
        setFuTitle("")
        setFuDate("")
        setFuDesc("")
        setShowFollowUp(false)
        onUpdate()
      } catch {
        toast.error("Failed to create follow-up")
      } finally {
        setIsSavingFu(false)
      }
    }

    const latestNote = lead.notes?.[0]
    const currentStage = STAGES.find((s) => s.key === lead.status)

    async function handleMoveStage(targetStage: string) {
      if (targetStage === lead.status) return
      try {
        const res = await fetch("/api/pipeline/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            status: targetStage,
          }),
        })
        if (!res.ok) throw new Error("Failed to move lead")
        toast.success(`Moved to ${STAGES.find((s) => s.key === targetStage)?.label}`)
        onUpdate()
      } catch {
        toast.error("Failed to move lead")
      }
    }

    const cardContent = (
      <Card className="animate-card-enter hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${currentStage?.color.split(" ")[0] || "bg-gray-400"}`}
                  title={currentStage?.label || lead.status}
                />
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 leading-tight font-medium shrink-0 ${
                    currentStage ? currentStage.color.split(" ").slice(1).join(" ") : ""
                  }`}
                >
                  {currentStage?.label || lead.status}
                </Badge>
                <p className="text-sm font-medium truncate">{lead.name}</p>
              </div>
              {lead.company && (
                <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
              )}
            </div>
            <div className="flex gap-0.5 shrink-0">
              {!isViewer && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowEdit(true)}
                  className="h-6 w-6"
                  title="Edit lead"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {userRole === "ADMIN" || userRole === "MANAGER" ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDelete}
                  className="h-6 w-6 text-destructive"
                  title="Delete lead"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              ) : null}
            </div>
          </div>

          {lead.dealValue && lead.dealValue > 0 && (
            <p className="text-sm font-semibold text-primary">
              {formatCurrency(lead.dealValue)}
            </p>
          )}

          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{lead.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{lead.source.replace("_", " ")}</span>
            <span>·</span>
            <span>{timeAgo(lead.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1 pt-1 border-t">
            {!isViewer && (
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  title="Move to stage"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {STAGES.map((stage) => (
                  <DropdownMenuItem
                    key={stage.key}
                    onClick={() => handleMoveStage(stage.key)}
                    disabled={stage.key === lead.status}
                    className={stage.key === lead.status ? "text-muted-foreground/50" : ""}
                  >
                    <div className={`w-2 h-2 rounded-full ${stage.color.split(" ")[0]}`} />
                    {stage.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isViewer && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={() => setShowNote(true)}
                title="Add note"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
              </Button>
            )}
            {!isViewer && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={() => setShowFollowUp(true)}
                title="Set follow-up"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/10"
              onClick={() => { setShowSuggest(true); handleGetSuggestion() }}
              title="Get AI suggestion"
            >
              <Lightbulb className="h-3.5 w-3.5" />
            </Button>
            {latestNote && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {lead.notes.length} note{lead.notes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )

    return (
      <div>
        {cardContent}

        {/* Edit Dialog */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Update lead details</DialogDescription>
            </DialogHeader>
            <LeadForm
              initialData={lead}
              onSuccess={() => { setShowEdit(false); onUpdate() }}
              onCancel={() => setShowEdit(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Note Dialog */}
        <Dialog open={showNote} onOpenChange={setShowNote}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                {lead.name} — Use AI to summarize raw notes into actionable insights
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                placeholder="Paste your call/meeting notes here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
              />
              {noteContent.trim() && !summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="gap-2"
                >
                  {isSummarizing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  AI Summarize
                </Button>
              )}
              {summary && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{summary}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowNote(false); setSummary(null); setNoteContent("") }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNote} disabled={isSavingNote || !noteContent.trim()}>
                  {isSavingNote && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Suggestion Dialog */}
        <Dialog open={showSuggest} onOpenChange={(open) => { setShowSuggest(open); if (!open) { setSuggestion(null); setSuggestionError(null) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                AI Follow-up Suggestion
              </DialogTitle>
              <DialogDescription>
                Based on {lead.name}&apos;s stage ({lead.status.replace("_", " ")}) and recent activity
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-[120px]">
              {isSuggesting ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing lead data and generating suggestion...
                  </p>
                </div>
              ) : suggestionError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive font-medium mb-1">Unable to generate suggestion</p>
                  <p className="text-xs text-muted-foreground">{suggestionError}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Set your <code className="bg-muted px-1 rounded text-[10px]">GROQ_API_KEY</code> in .env to enable AI features.
                  </p>
                </div>
              ) : suggestion ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Suggested Action</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{suggestion}</p>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              {suggestionError && (
                <Button variant="outline" size="sm" onClick={handleGetSuggestion} className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Try Again
                </Button>
              )}
              <Button size="sm" onClick={() => { setShowSuggest(false); setSuggestion(null); setSuggestionError(null) }}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Follow-up Dialog */}
        <Dialog open={showFollowUp} onOpenChange={setShowFollowUp}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Follow-up</DialogTitle>
              <DialogDescription>
                Schedule a reminder for {lead.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="fu-title">Title *</Label>
                <Input
                  id="fu-title"
                  value={fuTitle}
                  onChange={(e) => setFuTitle(e.target.value)}
                  placeholder="e.g., Call to discuss proposal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fu-date">Due Date *</Label>
                <Input
                  id="fu-date"
                  type="datetime-local"
                  value={fuDate}
                  onChange={(e) => setFuDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fu-desc">Description</Label>
                <Textarea
                  id="fu-desc"
                  value={fuDesc}
                  onChange={(e) => setFuDesc(e.target.value)}
                  placeholder="Optional details..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFollowUp(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveFollowUp} disabled={isSavingFu || !fuTitle || !fuDate}>
                  {isSavingFu && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Follow-up
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
