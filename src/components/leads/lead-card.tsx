"use client"

import { forwardRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { LeadForm } from "./lead-form"
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/utils"
import { Pencil, Trash2, MessageSquarePlus, Sparkles, Loader2, CalendarPlus } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export const LeadCard = forwardRef<HTMLDivElement, LeadCardProps & { style?: React.CSSProperties; isDragging?: boolean }>(
  function LeadCard({ lead, onUpdate, style, isDragging, ...props }, ref) {
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

    const latestNote = lead.notes?.[lead.notes.length - 1]

    return (
      <>
        <Card
          ref={ref}
          style={style}
          className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? "opacity-50 shadow-lg" : ""}`}
          {...props}
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{lead.name}</p>
                {lead.company && (
                  <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                )}
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowEdit(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDelete}
                  className="h-6 w-6 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {lead.dealValue && lead.dealValue > 0 && (
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(lead.dealValue)}
              </p>
            )}

            {lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lead.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
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
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={() => setShowNote(true)}
                title="Add note"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={() => setShowFollowUp(true)}
                title="Set follow-up"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
              </Button>
              {latestNote && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {lead.notes.length} note{lead.notes.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

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
      </>
    )
  }
)
