import { INVENTORY_TEMPLATE_CSV } from "@/lib/inventory-import";

export async function GET() {
  return new Response(INVENTORY_TEMPLATE_CSV, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventory-template.csv"',
    },
  });
}
