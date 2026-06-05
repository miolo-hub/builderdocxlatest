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

export type ClientRevenueSplit = {
  clientId: string;
  name: string;
  unit: string;
  expected: number;
  collected: number;
  pending: number;
  direct: number;
  advance: number;
  bankLoan: number;
};

export type ProjectRevenueDetail = ProjectRevenueRow & {
  collectedBreakdown: {
    directPayments: number;
    bankLoan: number;
    bookingAdvance: number;
    total: number;
  };
  clientRevenue: ClientRevenueSplit[];
};

function clientLinkedToProject(
  c: {
    projectName: string | null;
    preferredUnit: { projectId: string; unitNumber?: string } | null;
    units: { projectId: string; unitNumber?: string }[];
    unit?: string | null;
  },
  projectId: string,
  projectName: string
) {
  return (
    c.preferredUnit?.projectId === projectId ||
    c.units.some((u) => u.projectId === projectId) ||
    (c.projectName?.toLowerCase() === projectName.toLowerCase() && !!c.projectName)
  );
}

function computeProjectRevenue(
  projectId: string,
  projectName: string,
  units: {
    id: string;
    projectId: string;
    status: string;
    basePrice: number;
    clientId: string | null;
    unitNumber: string;
    finalPrice?: number | null;
  }[],
  deals: {
    id: string;
    clientId: string;
    finalPrice: number;
    unitId: string;
    paymentPlanType: string;
    unit: { projectId: string; status: string; basePrice: number; unitNumber: string };
  }[],
  transactions: { dealId: string; amount: number; mode: string }[],
  clients: {
    id: string;
    name: string;
    unit: string | null;
    workflowData: string | null;
    projectName: string | null;
    preferredUnit: { projectId: string; unitNumber: string } | null;
    units: { projectId: string; unitNumber: string }[];
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
    if (!clientLinkedToProject(c, projectId, projectName)) continue;
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

  const clientRevenue = new Map<string, ClientRevenueSplit>();
  const ensureSplit = (clientId: string) => {
    if (!clientRevenue.has(clientId)) {
      const c = clientsById.get(clientId);
      const unitLabel =
        c?.preferredUnit?.unitNumber ??
        c?.units.find((u) => u.projectId === projectId)?.unitNumber ??
        c?.unit ??
        "—";
      clientRevenue.set(clientId, {
        clientId,
        name: c?.name ?? "Unknown",
        unit: unitLabel,
        expected: 0,
        collected: 0,
        pending: 0,
        direct: 0,
        advance: 0,
        bankLoan: 0,
      });
    }
    return clientRevenue.get(clientId)!;
  };

  for (const d of pDeals) {
    const row = ensureSplit(d.clientId);
    row.expected += d.finalPrice;
    row.unit = d.unit.unitNumber;
  }

  for (const u of pUnits) {
    if (u.status === "sold" && !dealUnitIds.has(u.id) && u.clientId) {
      const row = ensureSplit(u.clientId);
      row.expected += soldUnitExpectedPrice(u, clientsById);
      row.unit = u.unitNumber;
    }
  }

  const dealClientById = new Map(pDeals.map((d) => [d.id, d.clientId]));
  for (const t of pTxns) {
    const clientId = dealClientById.get(t.dealId);
    if (!clientId) continue;
    const row = ensureSplit(clientId);
    if (LOAN_MODES.has(t.mode)) {
      row.bankLoan += t.amount;
    } else {
      row.direct += t.amount;
    }
    row.collected += t.amount;
  }

  for (const c of clients) {
    if (!clientLinkedToProject(c, projectId, projectName)) continue;
    const adv = advanceFromWorkflow(c.workflowData);
    const wf = parseWorkflowData(c.workflowData);
    let extraLoan = 0;
    for (const ld of wf.loanDisbursements ?? []) {
      if (ld.status === "received" && !ld.transactionId) {
        extraLoan += ld.amount;
      }
    }
    if (adv <= 0 && extraLoan <= 0) continue;

    const row = ensureSplit(c.id);
    if (adv > 0) {
      if (c.deals.some((d) => dealIds.has(d.id))) {
        const paidOnDeals = pTxns
          .filter((t) => c.deals.some((d) => d.id === t.dealId))
          .reduce((s, t) => s + t.amount, 0);
        if (paidOnDeals < adv) {
          row.advance += adv;
          row.collected += adv;
        }
      } else {
        row.advance += adv;
        row.collected += adv;
      }
    }
    if (extraLoan > 0) {
      row.bankLoan += extraLoan;
      row.collected += extraLoan;
    }
  }

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
    clientRevenue: [...clientRevenue.values()]
      .map((r) => ({
        ...r,
        pending: Math.max(0, r.expected - r.collected),
      }))
      .filter((r) => r.expected > 0 || r.collected > 0)
      .sort((a, b) => b.expected - a.expected || b.collected - a.collected),
  };
}

export async function getDashboardMetrics(builderId: string, projectId?: string) {
  const prisma = getPrisma();
  const [projects, units, clientsCount, deals, schedules, transactions, agents, clients] =
    await Promise.all([
      prisma.project.findMany({ where: { builderId }, orderBy: { name: "asc" } }),
      prisma.unit.findMany({
        where: { project: { builderId } },
        select: {
          id: true,
          projectId: true,
          status: true,
          basePrice: true,
          finalPrice: true,
          clientId: true,
          unitNumber: true,
        },
      }),
      prisma.client.count({ where: { builderId } }),
      prisma.deal.findMany({
        where: { builderId },
        include: {
          unit: {
            select: {
              projectId: true,
              status: true,
              basePrice: true,
              unitNumber: true,
            },
          },
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
          name: true,
          unit: true,
          workflowData: true,
          projectName: true,
          preferredUnit: { select: { projectId: true, unitNumber: true } },
          units: { select: { projectId: true, unitNumber: true } },
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

  const allClientRevenue = projects
    .flatMap((p) =>
      computeProjectRevenue(p.id, p.name, units, deals, transactions, clients)
        .clientRevenue
    )
    .reduce((acc, row) => {
      const existing = acc.get(row.clientId);
      if (!existing) {
        acc.set(row.clientId, { ...row, pending: Math.max(0, row.expected - row.collected) });
        return acc;
      }
      existing.expected += row.expected;
      existing.collected += row.collected;
      existing.pending += row.pending;
      existing.direct += row.direct;
      existing.advance += row.advance;
      existing.bankLoan += row.bankLoan;
      if (existing.unit === "—" && row.unit !== "—") existing.unit = row.unit;
      return acc;
    }, new Map<string, ClientRevenueSplit>());

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
    clientRevenue: [...allClientRevenue.values()].sort(
      (a, b) => b.expected - a.expected || b.collected - a.collected
    ),
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
