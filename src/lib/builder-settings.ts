import {
  DEFAULT_PRICE_BREAKUP_FIELDS,
  parseFieldConfig,
  serializeFieldConfig,
  type PriceBreakupFieldDef,
} from "./price-breakup-fields";
import { getPrisma } from "./prisma";

export async function getPriceBreakupFields(builderId: string): Promise<PriceBreakupFieldDef[]> {
  const builder = await getPrisma().builder.findUnique({
    where: { id: builderId },
    select: { priceBreakupFieldConfig: true },
  });
  return parseFieldConfig(builder?.priceBreakupFieldConfig);
}

export async function savePriceBreakupFields(
  builderId: string,
  fields: PriceBreakupFieldDef[]
): Promise<PriceBreakupFieldDef[]> {
  const normalized = fields.length > 0 ? fields : DEFAULT_PRICE_BREAKUP_FIELDS;
  await getPrisma().builder.update({
    where: { id: builderId },
    data: { priceBreakupFieldConfig: serializeFieldConfig(normalized) },
  });
  return parseFieldConfig(serializeFieldConfig(normalized));
}
