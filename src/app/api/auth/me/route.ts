import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const store = readStore();
  const builder = store.builders.find((b) => b.id === user.builderId);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      builderId: user.builderId,
      builderName: builder?.name,
    },
  });
}
