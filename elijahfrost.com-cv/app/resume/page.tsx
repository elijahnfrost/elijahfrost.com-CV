import { notFound } from "next/navigation";
import { getResumeData } from "@/app/lib/notion";
import { applyResumeOverrides, type SectionMap } from "@/app/lib/cv-dynamic";
import { CVSite } from "@/app/page";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const resumeSections = (await getResumeData()) as SectionMap;
  if (Object.keys(resumeSections).length === 0) {
    notFound();
  }

  return <CVSite sectionMap={applyResumeOverrides(resumeSections)} />;
}

