import { parseWorkflowData } from "./client-workflow";
import { getPrisma } from "./prisma";
import { priceFromBreakup, MIN_REAL_FINAL_PRICE, isValidFinalPrice } from "./unit-final-price";

const LOAN_MODES = new Set(["bank_loan", "bank_disbursement", "loan"]);

function advanceFromWorkflow(workflowData: string | null): number {
  const data = parseWorkflowData(workflowData);
  return data.advance?.amount ?? 0;
}

function soldUnitExpectedPrice(
  unit: { basePrice: number; clientId: string | null; finalPrice?: number | null },
  clientsById: Map<string, { workflowData: string | null }>
): number {
  if (isValidFinalPrice(unit.finalPrice)) return unit.finalPrice!;
  if (unit.clientId) {
    const client = clientsById.get(unit.clientId);
    if (client) {
      const fromPb = priceFromBreakup(
        parseWorkflowData(client.workflowData).priceBreakup
      );
      if (fromPb > 0) return fromPb;
    }
  }
  if (unit.basePrice >= MIN_REAL_FINAL_PRICE) return unit.basePrice;
  return 0;
}

function fmtPct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export type ProjectRevenueRow = {
  id: string;
  name: string;
  expectedRevenue: number;
  collected: number;
  yetToCollect: number;
  unitCounts: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    blocked: number;
  };
};

export type ProjectRevenueDetail = ProjectRevenueRow & {
  collectedBreakdown: {
    directPayments: number;
    bankLoan: number;
    bookingAdvance: number;
    total: number;
  };
};

function computeProjectRevenue(
  projectId: string,
  projectName: string,
  units: {
    id: string;
    projectId: string;
    status: string;
    basePrice: number;
    clientId: string | null;
  }[],
  deals: {
    id: string;
    finalPrice: number;
    unitId: string;
    paymentPlanType: string;
    unit: { projectId: string; status: string; basePrice: number };
  }[],
  transactions: { dealId: string; amount: number; mode: string }[],
  clients: {
    id: string;
    workflowData: string | null;
    projectName: string | null;
    preferredUnit: { projectId: string } | null;
    units: { projectId: string }[];
    deals: { id: string }[];
  }[]
): ProjectRevenueDetail {
  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const pUnits = units.filter((u) => u.projectId === projectId);
  const pDeals = deals.filter((d) => d.unit.projectId === projectId);
  const dealUnitIds = new Set(pDeals.map((d) => d.unitId));

  let expectedRevenue = pDeals.reduce((s, d) => s + d.finalPrice, 0);
  for (const u of pUnits) {
    if (u.status === "sold" && !dealUnitIds.has(u.id)) {
      expectedRevenue += soldUnitExpectedPrice(u, clientsById);
    }
  }

  const dealIds = new Set(pDeals.map((d) => d.id));
  const pTxns = transactions.filter((t) => dealIds.has(t.dealId));

  let directPayments = 0;
  let bankLoan = 0;
  for (const t of pTxns) {
    if (LOAN_MODES.has(t.mode)) bankLoan += t.amount;
    else directPayments += t.amount;
  }

  let bookingAdvance = 0;
  for (const c of clients) {
    const linked =
      c.preferredUnit?.projectId === projectId ||
      c.units.some((u) => u.projectId === projectId) ||
      (c.projectName?.toLowerCase() === projectName.toLowerCase() && c.projectName);
    if (!linked) continue;
    const adv = advanceFromWorkflow(c.workflowData);
    if (adv <= 0) continue;
    if (c.deals.some((d) => dealIds.has(d.id))) {
      const paidOnDeals = pTxns
        .filter((t) => c.deals.some((d) => d.id === t.dealId))
        .reduce((s, t) => s + t.amount, 0);
      if (paidOnDeals >= adv) continue;
    }
    bookingAdvance += adv;

    const wf = parseWorkflowData(c.workflowData);
    for (const ld of wf.loanDisbursements ?? []) {
      if (ld.status === "received" && !ld.transactionId) {
        bankLoan += ld.amount;
      }
    }
  }

  const collected = directPayments + bankLoan + bookingAdvance;
  const yetToCollect = Math.max(0, expectedRevenue - collected);

  return {
    id: projectId,
    name: projectName,
    expectedRevenue,
    collected,
    yetToCollect,
    unitCounts: {
      total: pUnits.length,
      available: pUnits.filter((u) => u.status === "available").length,
      reserved: pUnits.filter((u) => u.status === "reserved").length,
      sold: pUnits.filter((u) => u.status === "sold").length,
      blocked: pUnits.filter((u) => u.status === "blocked").length,
    },
    collectedBreakdown: {
      directPayments,
      bankLoan,
      bookingAdvance,
      total: collected,
    },
  };
}

export async function getDashboardMetrics(builderId: string, projectId?: string) {
  const prisma = getPrisma();
  const [projects, units, clientsCount, deals, schedules, transactions, agents, clients] =
    await Promise.all([
      prisma.project.findMany({ where: { builderId }, orderBy: { name: "asc" } }),
      prisma.unit.findMany({
        where: { project: { builderId } },
        select: { id: true, projectId: true, status: true, basePrice: true, finalPrice: true, clientId: true },
      }),
      prisma.client.count({ where: { builderId } }),
      prisma.deal.findMany({
        where: { builderId },
        include: {
          unit: { select: { projectId: true, status: true, basePrice: true } },
        },
      }),
      prisma.paymentScheduleItem.findMany({
        where: { deal: { builderId } },
      }),
      prisma.paymentTransaction.findMany({
        where: { deal: { builderId } },
        select: { dealId: true, amount: true, mode: true, paidAt: true },
      }),
      prisma.agent.findMany({ where: { builderId } }),
      prisma.client.findMany({
        where: { builderId },
        select: {
          id: true,
          workflowData: true,
          projectName: true,
          preferredUnit: { select: { projectId: true } },
          units: { select: { projectId: true } },
          deals: { select: { id: true } },
        },
      }),
    ]);

  const sold = units.filter((u) => u.status === "sold").length;
  const reserved = units.filter((u) => u.status === "reserved").length;
  const available = units.filter((u) => u.status === "available").length;
  const blocked = units.filter((u) => u.status === "blocked").length;

  const revenueByProject: ProjectRevenueRow[] = projects.map((p) => {
    const detail = computeProjectRevenue(
      p.id,
      p.name,
      units,
      deals,
      transactions,
      clients
    );
    return {
      id: detail.id,
      name: detail.name,
      expectedRevenue: detail.expectedRevenue,
      collected: detail.collected,
      yetToCollect: detail.yetToCollect,
      unitCounts: detail.unitCounts,
    };
  });

  const revenueTarget = revenueByProject.reduce((s, r) => s + r.expectedRevenue, 0);
  const revenueCollected = revenueByProject.reduce((s, r) => s + r.collected, 0);
  const revenuePending = revenueByProject.reduce((s, r) => s + r.yetToCollect, 0);

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const dueThisWeek = schedules.filter(
    (s) => s.status !== "paid" && s.dueDate >= now && s.dueDate <= weekAhead
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

  const selectedProject = projectId
    ? projects.find((p) => p.id === projectId)
    : null;
  const projectDetail = selectedProject
    ? computeProjectRevenue(
        selectedProject.id,
        selectedProject.name,
        units,
        deals,
        transactions,
        clients
      )
    : null;

  return {
    projects: projects.length,
    projectList: projects.map((p) => ({ id: p.id, name: p.name })),
    units: { total: units.length, sold, reserved, available, blocked },
    clients: clientsCount,
    dealsToday: deals.filter((d) => d.bookingDate >= todayStart).length,
    revenue: {
      target: revenueTarget,
      collected: revenueCollected,
      pending: revenuePending,
    },
    revenueByProject,
    projectDetail,
    collectionPct: fmtPct(revenueCollected, revenueTarget),
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
      const rev = revenueByProject.find((r) => r.id === p.id);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        constructionPct: p.constructionPct,
        soldPct: pUnits.length ? Math.round((pSold / pUnits.length) * 100) : 0,
        totalUnits: pUnits.length,
        sold: pSold,
        expectedRevenue: rev?.expectedRevenue ?? 0,
        collected: rev?.collected ?? 0,
      };
    }),
  };
}
