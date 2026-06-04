import { getPrisma } from "./prisma";

export async function getDashboardMetrics(builderId: string) {
  const prisma = getPrisma();
  const [projects, units, clients, deals, schedules, transactions, agents] =
    await Promise.all([
      prisma.project.findMany({ where: { builderId } }),
      prisma.unit.findMany({ where: { project: { builderId } } }),
      prisma.client.count({ where: { builderId } }),
      prisma.deal.findMany({ where: { builderId } }),
      prisma.paymentScheduleItem.findMany({
        where: { deal: { builderId } },
      }),
      prisma.paymentTransaction.findMany({
        where: { deal: { builderId } },
      }),
      prisma.agent.findMany({ where: { builderId } }),
    ]);

  const sold = units.filter((u) => u.status === "sold").length;
  const reserved = units.filter((u) => u.status === "reserved").length;
  const available = units.filter((u) => u.status === "available").length;

  const revenueTarget = units.reduce((s, u) => s + u.basePrice, 0);
  const revenueCollected = transactions.reduce((s, t) => s + t.amount, 0);
  const revenuePending = deals.reduce((s, d) => {
    const paid = transactions
      .filter((t) => t.dealId === d.id)
      .reduce((a, t) => a + t.amount, 0);
    return s + Math.max(0, d.finalPrice - paid);
  }, 0);

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const dueThisWeek = schedules.filter(
    (s) =>
      s.status !== "paid" &&
      s.dueDate >= now &&
      s.dueDate <= weekAhead
  );
  const overdue = schedules.filter(
    (s) => s.status === "overdue" || (s.status !== "paid" && s.dueDate < now)
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCollections = transactions
    .filter((t) => t.paidAt >= todayStart)
    .reduce((s, t) => s + t.amount, 0);

  const agentDeals = await prisma.deal.groupBy({
    by: ["agentId"],
    where: { builderId, agentId: { not: null } },
    _count: { id: true },
  });

  const leaderboard = agents
    .map((a) => ({
      id: a.id,
      name: a.name,
      deals: agentDeals.find((g) => g.agentId === a.id)?._count.id ?? 0,
    }))
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 5);

  return {
    projects: projects.length,
    units: { total: units.length, sold, reserved, available },
    clients,
    dealsToday: deals.filter(
      (d) => d.bookingDate >= todayStart
    ).length,
    revenue: {
      target: revenueTarget,
      collected: revenueCollected,
      pending: revenuePending,
    },
    payments: {
      todayCollections,
      dueThisWeek: dueThisWeek.length,
      dueThisWeekAmount: dueThisWeek.reduce((s, i) => s + i.amount, 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
    },
    leaderboard,
    projectCards: projects.map((p) => {
      const pUnits = units.filter((u) => u.projectId === p.id);
      const pSold = pUnits.filter((u) => u.status === "sold").length;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        constructionPct: p.constructionPct,
        soldPct: pUnits.length ? Math.round((pSold / pUnits.length) * 100) : 0,
        totalUnits: pUnits.length,
        sold: pSold,
      };
    }),
  };
}
