import { getPrisma } from "./prisma";

export async function getBuilderById(id: string) {
  return getPrisma().builder.findUnique({ where: { id } });
}

export async function getBuilderName(id: string): Promise<string | undefined> {
  const b = await getBuilderById(id);
  return b?.name;
}
