import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { parseWorkflowData } from "@/lib/client-workflow";
import { sendWelcomeEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { generateId } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser("clients.manage");
  if (error) return error;
  const { id: clientId } = await params;

  const client = await getPrisma().client.findFirst({
    where: { id: clientId, builderId: user!.builderId },
    include: {
      preferredUnit: {
        include: { project: { select: { id: true, name: true, brochurePath: true } } },
      },
      deals: {
        orderBy: { bookingDate: "desc" },
        take: 1,
        include: {
          unit: {
            include: { project: { select: { id: true, name: true, brochurePath: true } } },
          },
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!["booked", "active_buyer", "completed"].includes(client.stage)) {
    return NextResponse.json(
      { error: "Welcome email is available after the flat is booked" },
      { status: 400 }
    );
  }

  if (!client.email?.trim()) {
    return NextResponse.json(
      { error: "Add an email address on the client profile first" },
      { status: 400 }
    );
  }

  const data = parseWorkflowData(client.workflowData);
  if (data.welcomeEmail?.sentAt) {
    return NextResponse.json(
      { error: "Welcome email was already sent" },
      { status: 409 }
    );
  }

  const deal = client.deals[0];
  const project =
    deal?.unit.project ??
    client.preferredUnit?.project ??
    (client.projectName
      ? await getPrisma().project.findFirst({
          where: {
            builderId: user!.builderId,
            name: { equals: client.projectName, mode: "insensitive" },
          },
          select: { id: true, name: true, brochurePath: true },
        })
      : null);

  if (!project) {
    return NextResponse.json(
      { error: "Link a project to this client before sending welcome email" },
      { status: 400 }
    );
  }

  const builder = await getPrisma().builder.findUnique({
    where: { id: user!.builderId },
    select: { name: true },
  });

  const unitLabel =
    deal?.unit.unitNumber ??
    client.preferredUnit?.unitNumber ??
    client.unit ??
    undefined;

  const result = await sendWelcomeEmail({
    to: client.email.trim(),
    clientName: client.name,
    builderName: builder?.name ?? "Your builder",
    projectName: project.name,
    unitLabel,
    brochurePath: project.brochurePath,
    brochureFileName: `${project.name.replace(/[^a-zA-Z0-9.-]/g, "-")}-brochure.pdf`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  data.welcomeEmail = {
    sentAt: new Date().toISOString(),
    sentTo: client.email.trim(),
    brochureAttached: result.brochureAttached,
    projectName: project.name,
  };

  await getPrisma().client.update({
    where: { id: clientId },
    data: {
      workflowStep: "welcome_kit",
      workflowData: JSON.stringify(data),
    },
  });

  await getPrisma().activityLog.create({
    data: {
      id: generateId("act"),
      builderId: user!.builderId,
      clientId,
      type: "notification.email",
      description: `Welcome email sent to ${client.name} (${client.email})`,
      actor: user!.name,
      metadata: JSON.stringify({
        email: client.email,
        projectName: project.name,
        brochureAttached: result.brochureAttached,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    brochureAttached: result.brochureAttached,
    sentTo: client.email,
  });
}
