import { getResumeData } from "@/app/lib/notion";
import { enrichSectionsWithNotionTextDates } from "@/app/lib/notion-pdf-dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rawSections = await getResumeData();
  const sections = await enrichSectionsWithNotionTextDates(rawSections);
  const [{ renderToBuffer }, { ResumeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../../lib/pdf-templates"),
  ]);
  const pdfBuffer = await renderToBuffer(ResumeDocument({ sections }));
  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Elijah_Frost_Resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
}

