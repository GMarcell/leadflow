import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Total leads
    const totalLeads = await prisma.lead.count({ where: { userId } })

    // Leads by status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
      _sum: { dealValue: true },
    })

    // New leads this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newLeadsThisMonth = await prisma.lead.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    })

    // Active leads (not won/lost)
    const activeLeads = await prisma.lead.count({
      where: {
        userId,
        status: { notIn: ["WON", "LOST"] },
      },
    })

    // Pipeline value (active deals)
    const pipelineResult = await prisma.lead.aggregate({
      where: { userId, status: { notIn: ["WON", "LOST"] } },
      _sum: { dealValue: true },
    })

    // Won deals
    const wonDeals = await prisma.lead.count({
      where: { userId, status: "WON" },
    })

    const wonResult = await prisma.lead.aggregate({
      where: { userId, status: "WON" },
      _sum: { dealValue: true },
    })

    // Lost deals (for conversion rate)
    const lostDeals = await prisma.lead.count({
      where: { userId, status: "LOST" },
    })

    const totalClosed = wonDeals + lostDeals
    const conversionRate = totalClosed > 0 ? Math.round((wonDeals / totalClosed) * 100) : 0

    // Stage distribution for charts
    const stageDistribution = leadsByStatus
      .filter((s) => s._count.id > 0)
      .map((s) => ({
        name: s.status.replace("_", " "),
        count: s._count.id,
        value: s._sum.dealValue || 0,
      }))

    // Source distribution for charts
    const sourceDistribution = await prisma.lead.groupBy({
      by: ["source"],
      where: { userId },
      _count: { id: true },
    })

    const sourceChart = sourceDistribution
      .filter((s) => s._count.id > 0)
      .map((s) => ({
        name: s.source.replace("_", " "),
        count: s._count.id,
      }))

    // Lead timeline (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      return d
    }).reverse()

    const leadTimeline = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        const count = await prisma.lead.count({
          where: {
            userId,
            createdAt: { gte: date, lt: nextDay },
          },
        })
        return {
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count,
        }
      })
    )

    // Recent leads
    const recentLeads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Follow-ups due
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const followUpsDue = await prisma.followUp.findMany({
      where: {
        userId,
        completed: false,
        dueDate: { lte: endOfDay },
      },
      include: { lead: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    })

    return Response.json({
      totalLeads,
      newLeads: newLeadsThisMonth,
      activeLeads,
      pipelineValue: pipelineResult._sum.dealValue || 0,
      wonDeals,
      wonValue: wonResult._sum.dealValue || 0,
      conversionRate,
      stageDistribution,
      sourceDistribution: sourceChart,
      leadTimeline,
      recentLeads,
      followUps: followUpsDue,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
