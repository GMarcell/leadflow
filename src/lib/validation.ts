import { z } from "zod"

// ─── Auth ────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
})

// ─── Leads ────────────────────────────────────

export const leadSourceEnum = z.enum([
  "REFERRAL", "WEBSITE", "COLD_OUTREACH", "SOCIAL_MEDIA",
  "EMAIL_CAMPAIGN", "EVENT", "PARTNER", "OTHER",
])

export const leadStatusEnum = z.enum([
  "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST",
])

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().max(50).optional().nullable(),
  source: leadSourceEnum.default("OTHER"),
  tags: z.array(z.string()).default([]),
  dealValue: z.number().nonnegative().optional().nullable(),
  status: leadStatusEnum.default("NEW"),
})

export const updateLeadSchema = createLeadSchema.partial()

// ─── Notes ────────────────────────────────────

export const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(10000),
  leadId: z.string().min(1),
  summary: z.string().optional(),
})

export const summarizeNoteSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
})

export const suggestFollowUpSchema = z.object({
  leadName: z.string().min(1),
  leadStage: z.string().min(1),
  notes: z.string().optional(),
  daysSinceLastContact: z.number().nonnegative(),
})

// ─── Follow Ups ───────────────────────────────

export const createFollowUpSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  leadId: z.string().min(1),
})

export const updateFollowUpSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
})

// ─── Pipeline ─────────────────────────────────

export const moveLeadSchema = z.object({
  leadId: z.string().min(1),
  status: leadStatusEnum,
  order: z.number().nonnegative().optional(),
})

// ─── Helpers ─────────────────────────────────────

export async function safeParseBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: Response }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return {
        error: Response.json(
          {
            error: firstIssue?.message ?? "Validation failed",
            details: result.error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    return { data: result.data }
  } catch {
    return {
      error: Response.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    }
  }
}
