import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const COMPANY_NAMES = [
  "Acme Corp", "Globex Inc", "Initech", "Hooli", "Stark Industries",
  "Wayne Enterprises", "Oscorp", "Cyberdyne Systems", "Umbrella Corp",
  "Massive Dynamic", "Wonka Industries", "Soylent Corp", "Dunder Mifflin",
  "Pied Piper", "Raviga Capital",
]

const FIRST_NAMES = [
  "Sarah", "James", "Emily", "Michael", "Jessica", "David", "Ashley",
  "Christopher", "Amanda", "Daniel", "Jennifer", "Matthew", "Lauren",
  "Andrew", "Stephanie", "Joshua", "Nicole", "Ryan", "Heather", "Kevin",
]

const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
  "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
]

const SOURCES = [
  "REFERRAL", "WEBSITE", "COLD_OUTREACH", "SOCIAL_MEDIA",
  "EMAIL_CAMPAIGN", "EVENT", "PARTNER", "OTHER",
] as const

const TAGS = [
  "hot", "vip", "enterprise", "startup", "tech", "finance",
  "healthcare", "education", "small-biz", "agency",
]

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"] as const

const NOTE_TEMPLATES = [
  "Had an introductory call with {name}. They're interested in our platform for their {company} team of about {size} people. Main pain point is managing leads manually.",
  "Follow-up call went well. {name} asked about pricing for the enterprise tier. Sent over a proposal. They mentioned wanting to decide by end of quarter.",
  "Product demo with {name} and their team. They were impressed with the AI summarization feature. Concerns about data migration from their current system.",
  "Email exchange - {name} is reviewing the proposal with their stakeholders. They requested a security questionnaire which we've completed and returned.",
  "Great meeting with {name}. They're ready to move forward but need approval from their VP. Set a follow-up for next week to check in.",
  "Check-in call - {name} is still interested but budget approval is pending. Suggested a pilot program to get started faster.",
  "Contract sent to {name}. They had a few questions about terms which we've addressed. Waiting on final signature.",
  "Lost deal - {name} decided to go with a competitor. Cited budget constraints. Worth revisiting in 6 months.",
]

const FOLLOWUP_TITLES = [
  "Follow up on proposal",
  "Schedule product demo",
  "Send pricing information",
  "Check in after meeting",
  "Send contract",
  "Follow up on trial",
  "Quarterly review call",
  "Send case study",
]

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = new Date()
  const startMs = now.getTime() - startDaysAgo * 86400000
  const endMs = now.getTime() - endDaysAgo * 86400000
  return new Date(startMs + Math.random() * (endMs - startMs))
}

async function main() {
  console.log("🌱 Seeding database...")

  // Clean existing data
  await prisma.followUp.deleteMany()
  await prisma.note.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.user.deleteMany()

  // Create demo user
  const password = await hash("demo123456", 12)

  const user = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "demo@leadflow.app",
      password,
    },
  })

  console.log(`✅ Created demo user: demo@leadflow.app / demo123456`)

  // Generate 120 leads with realistic data
  const usedNames = new Set<string>()

  for (let i = 0; i < 120; i++) {
    let firstName: string, lastName: string, fullName: string
    do {
      firstName = randomItem(FIRST_NAMES)
      lastName = randomItem(LAST_NAMES)
      fullName = `${firstName} ${lastName}`
    } while (usedNames.has(fullName))
    usedNames.add(fullName)

    const company = randomItem(COMPANY_NAMES)
    const status = randomItem(STATUSES)
    const createdAt = randomDate(120, 0)
    const leadValue = status === "WON"
      ? randomInt(5000, 100000)
      : status === "LOST"
        ? randomInt(2000, 50000)
        : Math.random() > 0.3
          ? randomInt(500, 75000)
          : null

    const lead = {
      name: fullName,
      company: Math.random() > 0.15 ? company : null,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, "")}.com`,
      phone: Math.random() > 0.3 ? `+1 (${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}` : null,
      source: randomItem(SOURCES),
      tags: randomInt(0, 3) > 0 ? Array.from({ length: randomInt(1, 4) }, () => randomItem(TAGS)) : [],
      dealValue: leadValue,
      status,
      userId: user.id,
      pipelineOrder: randomInt(0, 20),
      createdAt,
    }

    const created = await prisma.lead.create({ data: lead })

    // Add some notes
    const noteCount = randomInt(0, 4)
    for (let n = 0; n < noteCount; n++) {
      const noteDate = new Date(created.createdAt.getTime() + randomInt(1, 14) * 86400000)
      if (noteDate > new Date()) continue

      await prisma.note.create({
        data: {
          content: NOTE_TEMPLATES[randomInt(0, NOTE_TEMPLATES.length - 1)]
            .replace("{name}", created.name)
            .replace("{company}", created.company || "their company")
            .replace("{size}", String(randomInt(5, 200))),
          leadId: created.id,
          userId: user.id,
          createdAt: noteDate,
        },
      })
    }

    // Add follow-ups for active leads
    if (created.status !== "WON" && created.status !== "LOST" && Math.random() > 0.4) {
      const fuDays = randomInt(1, 30)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + fuDays)

      await prisma.followUp.create({
        data: {
          title: randomItem(FOLLOWUP_TITLES),
          description: `Follow up with ${created.name} at ${created.company || "their company"}`,
          dueDate,
          leadId: created.id,
          userId: user.id,
          completed: fuDays < 0 ? Math.random() > 0.5 : false,
        },
      })
    }
  }

  console.log(`✅ Created 120 leads with notes and follow-ups`)
  console.log("✅ Seeding complete!")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
