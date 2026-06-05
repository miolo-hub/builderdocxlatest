import { getPrisma } from "./prisma";
import { generateId } from "./store";
import {
  parseTemplateFields,
  serializeTemplateFields,
  SYSTEM_TEMPLATE_SEEDS,
  type DocumentTemplateRecord,
  type TemplateCategory,
  type TemplateFieldDef,
} from "./document-templates";

export async function ensureSystemTemplates() {
  const prisma = getPrisma();
  for (const seed of SYSTEM_TEMPLATE_SEEDS) {
    await prisma.documentTemplate.upsert({
      where: { id: seed.id },
      create: {
        id: seed.id,
        builderId: null,
        category: seed.category,
        name: seed.name,
        description: seed.description,
        isSystem: true,
        fieldConfig: seed.fieldConfig,
      },
      update: {
        name: seed.name,
        description: seed.description,
        fieldConfig: seed.fieldConfig,
      },
    });
  }
}

export async function listTemplates(
  builderId: string,
  category?: TemplateCategory
): Promise<DocumentTemplateRecord[]> {
  await ensureSystemTemplates();
  const prisma = getPrisma();
  const rows = await prisma.documentTemplate.findMany({
    where: {
      OR: [{ builderId: null, isSystem: true }, { builderId }],
      ...(category ? { category } : {}),
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
  return rows as DocumentTemplateRecord[];
}

export async function getTemplate(id: string, builderId: string) {
  await ensureSystemTemplates();
  return getPrisma().documentTemplate.findFirst({
    where: {
      id,
      OR: [{ builderId: null, isSystem: true }, { builderId }],
    },
  });
}

export async function createCustomTemplate(
  builderId: string,
  data: {
    category: TemplateCategory;
    name: string;
    description?: string;
    fields?: TemplateFieldDef[];
    cloneFromId?: string;
  }
) {
  let fieldConfig = serializeTemplateFields(data.fields ?? []);
  if (data.cloneFromId) {
    const source = await getTemplate(data.cloneFromId, builderId);
    if (source) fieldConfig = source.fieldConfig;
  }

  return getPrisma().documentTemplate.create({
    data: {
      id: generateId("tmpl"),
      builderId,
      category: data.category,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      isSystem: false,
      fieldConfig,
    },
  });
}

export async function updateCustomTemplate(
  id: string,
  builderId: string,
  data: { name?: string; description?: string; fields?: TemplateFieldDef[] }
) {
  const existing = await getPrisma().documentTemplate.findFirst({
    where: { id, builderId, isSystem: false },
  });
  if (!existing) return null;

  return getPrisma().documentTemplate.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.fields ? { fieldConfig: serializeTemplateFields(data.fields) } : {}),
    },
  });
}

export async function deleteCustomTemplate(id: string, builderId: string) {
  const existing = await getPrisma().documentTemplate.findFirst({
    where: { id, builderId, isSystem: false },
  });
  if (!existing) return false;
  await getPrisma().documentTemplate.delete({ where: { id } });
  return true;
}

export function templateFieldsFromRecord(record: { fieldConfig: string }) {
  return parseTemplateFields(record.fieldConfig);
}
