import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { parseWorkflowData, type LoanDisbursementEntry } from "@/lib/client-workflow";
import { getClientById } from "@/lib/clients-db";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id: clientId } = await params;
  const body = await request.json();
  const type = String(body.type ?? "") as "request" | "record";

  if (type !== "request" && type !== "record") {
    return NextResponse.json({ error: "type must be request or record" }, { status: 400 });
  }

  const client = await getClientById(clientId, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const data = parseWorkflowData(client.workflowData);
  if (data.paymentPath !== "loan") {
    return NextResponse.json(
      { error: "Client must be on the bank loan payment path" },
      { status: 400 }
    );
  }

  const amount = parseFloat(String(body.amount ?? "0"));
  if (type === "record" && (Number.isNaN(amount) || amount <= 0)) {
    return NextResponse.json({ error: "Valid disbursement amount required" }, { status: 400 });
  }

  const entry: LoanDisbursementEntry = {
    id: generateId("loan"),
    status: type === "request" ? "requested" : "received",
    amount: type === "request" ? amount || 0 : amount,
    bankName: body.bankName ? String(body.bankName) : undefined,
    reference: body.reference ? String(body.reference) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
    requestedAt: new Date().toISOString(),
    ...(type === "record"
      ? { receivedAt: body.receivedAt ? new Date(body.receivedAt).toISOString() : new Date().toISOString() }
      : {}),
  };

  let transactionId: string | undefined;

  if (type === "record") {
    const deal = await getPrisma().deal.findFirst({
      where: { clientId, builderId: user!.builderId },
      orderBy: { bookingDate: "desc" },
    });

    if (deal) {
      const txn = await getPrisma().$transaction(async (tx) => {
        const t = await tx.paymentTransaction.create({
          data: {
            id: generateId("txn"),
            dealId: deal.id,
            amount,
            mode: "bank_loan",
            reference: entry.reference ?? entry.bankName ?? "Loan disbursement",
            paidAt: new Date(entry.receivedAt ?? Date.now()),
            recordedBy: user!.name,
          },
        });

        if (deal.paymentPlanType !== "bank_loan") {
          await tx.deal.update({
            where: { id: deal.id },
            data: { paymentPlanType: "bank_loan" },
          });
        }

        const dealFull = await tx.deal.findUnique({
          where: { id: deal.id },
          include: { schedule: true, transactions: true },
        });
        if (dealFull) {
          const paid = dealFull.transactions.reduce((s, x) => s + x.amount, 0);
          const status =
            paid >= dealFull.finalPrice
              ? "paid_in_full"
              : dealFull.schedule.some(
                    (s) =>
                      s.status === "overdue" ||
                      (s.status !== "paid" && s.dueDate < new Date())
                  )
                ? "overdue"
                : "on_track";
          await tx.deal.update({
            where: { id: deal.id },
            data: { paymentStatus: status },
          });
        }

        return t;
      });
      transactionId = txn.id;
      entry.transactionId = transactionId;
    }
  }

  data.loanDisbursements = [...(data.loanDisbursements ?? []), entry];

  await getPrisma().client.update({
    where: { id: clientId },
    data: {
      workflowStep: "loan_disbursement",
      workflowData: JSON.stringify(data),
    },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      clientId,
      type: "client.workflow",
      description:
        type === "request"
          ? `Loan disbursement requested for ${client.name}${amount ? ` (Rs. ${amount.toLocaleString("en-IN")})` : ""}`
          : `Loan disbursement recorded: Rs. ${amount.toLocaleString("en-IN")} for ${client.name}`,
      actor: user!.name,
    },
  });

  return NextResponse.json({ entry, workflowData: data });
}
