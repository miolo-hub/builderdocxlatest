import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import {
  getActiveWorkflowStep,
  parseWorkflowData,
  type ClientWorkflowData,
} from "@/lib/client-workflow";
import { getClientById, updateClientStage } from "@/lib/clients-db";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const client = await getClientById(id, user!.builderId);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = parseWorkflowData(client.workflowData);
  return NextResponse.json({
    workflowStep: client.workflowStep,
    workflowData: data,
    activeStep: getActiveWorkflowStep(client.workflowStep, data),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const action = String(body.action ?? "");

  const client = await getPrisma().client.findFirst({
    where: { id, builderId: user!.builderId },
  });
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = parseWorkflowData(client.workflowData);
  let workflowStep = client.workflowStep;
  let stageUpdate: string | null = null;

  switch (action) {
    case "decision": {
      const decision = body.decision as "proceed" | "cancelled";
      if (decision !== "proceed" && decision !== "cancelled") {
        return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
      }
      data.decision = decision;
      workflowStep = "awaiting_decision";
      if (decision === "cancelled") {
        stageUpdate = "cancelled";
      } else {
        stageUpdate = "negotiating";
      }
      break;
    }
    case "advance_refund": {
      if (data.decision !== "cancelled") {
        return NextResponse.json({ error: "Only for cancelled path" }, { status: 400 });
      }
      data.advanceRefunded = body.refunded === true;
      workflowStep = "closed";
      break;
    }
    case "payment_path": {
      if (data.decision !== "proceed") {
        return NextResponse.json({ error: "Select proceed first" }, { status: 400 });
      }
      const path = body.paymentPath as "loan" | "direct";
      if (path !== "loan" && path !== "direct") {
        return NextResponse.json({ error: "Invalid payment path" }, { status: 400 });
      }
      data.paymentPath = path;
      workflowStep = "closed";
      stageUpdate = path === "loan" ? "negotiating" : "interested";
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const updated = await getPrisma().client.update({
    where: { id },
    data: {
      workflowStep,
      workflowData: JSON.stringify(data),
    },
  });

  if (stageUpdate) {
    await updateClientStage(id, user!.builderId, stageUpdate, {
      unitId: client.preferredUnitId ?? undefined,
    });
  }

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      clientId: id,
      type: "client.workflow",
      description: `Workflow: ${action} for ${client.name}`,
      actor: user!.name,
      metadata: JSON.stringify({ action, data }),
    },
  });

  const fresh = await getClientById(id, user!.builderId);
  const freshData = parseWorkflowData(fresh?.workflowData);
  return NextResponse.json({
    client: fresh,
    workflowStep: updated.workflowStep,
    workflowData: freshData,
    activeStep: getActiveWorkflowStep(updated.workflowStep, freshData),
  });
}
