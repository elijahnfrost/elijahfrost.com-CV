import { getCVData } from "@/app/lib/notion";
import { enrichSectionsWithNotionTextDates } from "@/app/lib/notion-pdf-dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rawSections = await getCVData();
  const sections = await enrichSectionsWithNotionTextDates(rawSections);
  const [{ renderToBuffer }, { CVDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../../lib/pdf-templates"),
  ]);
  const pdfBuffer = await renderToBuffer(CVDocument({ sections }));
  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Elijah_Frost_CV.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
