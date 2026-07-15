"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const SOURCES = [
  { value: "REFERRAL", label: "Referral" },
  { value: "WEBSITE", label: "Website" },
  { value: "COLD_OUTREACH", label: "Cold Outreach" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "EMAIL_CAMPAIGN", label: "Email Campaign" },
  { value: "EVENT", label: "Event" },
  { value: "PARTNER", label: "Partner" },
  { value: "OTHER", label: "Other" },
]

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
]

interface LeadFormProps {
  initialData?: {
    id?: string
    name: string
    company?: string | null
    email?: string | null
    phone?: string | null
    source: string
    tags: string[]
    dealValue?: number | null
    status: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function LeadForm({ initialData, onSuccess, onCancel }: LeadFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData?.id

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    company: initialData?.company || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    source: initialData?.source || "OTHER",
    tags: initialData?.tags?.join(", ") || "",
    dealValue: initialData?.dealValue?.toString() || "",
    status: initialData?.status || "NEW",
  })

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const body = {
        name: formData.name,
        company: formData.company || null,
        email: formData.email || null,
        phone: formData.phone || null,
        source: formData.source,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        dealValue: formData.dealValue ? parseFloat(formData.dealValue) : null,
        status: formData.status,
      }

      const url = isEditing ? `/api/leads/${initialData.id}` : "/api/leads"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save lead")
      }

      toast.success(isEditing ? "Lead updated" : "Lead created")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Lead name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select
            value={formData.source}
            onValueChange={(v) => handleChange("source", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealValue">Deal Value ($)</Label>
          <Input
            id="dealValue"
            type="number"
            min="0"
            step="0.01"
            value={formData.dealValue}
            onChange={(e) => handleChange("dealValue", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Stage</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => handleChange("status", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            placeholder="hot, vip, enterprise"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Update Lead" : "Create Lead"}
        </Button>
      </div>
    </form>
  )
}
