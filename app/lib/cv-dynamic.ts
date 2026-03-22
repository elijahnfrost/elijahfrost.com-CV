import type { CVEntry } from "@/app/lib/notion";

export type SectionMap = Record<string, CVEntry[]>;

type ContactInfo = {
  address: string;
  phone: string;
  email: string;
  website: string;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function normalizeName(value: string | null | undefined): string {
  return normalizeText(value).toLowerCase().replace(/\s+/g, " ");
}

function isContactInformationEntry(entry: CVEntry): boolean {
  return normalizeName(entry.name) === "contact information";
}

function isAcademicOverviewEntry(entry: CVEntry): boolean {
  return normalizeName(entry.name) === "academic overview";
}

function sectionValues(sections: SectionMap): Array<[string, CVEntry[]]> {
  return Object.entries(sections).filter(
    ([name, entries]) => normalizeText(name) && Array.isArray(entries)
  );
}

export function sectionId(sectionName: string): string {
  return sectionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BODY_EXCLUDED_SECTIONS = new Set(["Contact"]);

function sectionOrderFromEntry(entry: CVEntry): number | null {
  const unknownEntry = entry as CVEntry & Record<string, unknown>;
  const direct = unknownEntry.sectionOrder;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;

  const spaced = unknownEntry["Section Order"];
  if (typeof spaced === "number" && Number.isFinite(spaced)) return spaced;

  return null;
}

function sectionOrderFromEntries(entries: CVEntry[]): number | null {
  const values = entries
    .map((entry) => sectionOrderFromEntry(entry))
    .filter((value): value is number => value != null);
  if (!values.length) return null;
  return Math.min(...values);
}

export function orderedSectionNames(sections: SectionMap): string[] {
  const rows = sectionValues(sections).map(([name, entries]) => {
    const sectionOrder = sectionOrderFromEntries(entries);
    return {
      name,
      sectionOrder,
    };
  });

  rows.sort((a, b) => {
    const aHasOrder = a.sectionOrder != null;
    const bHasOrder = b.sectionOrder != null;
    if (aHasOrder && bHasOrder) return (a.sectionOrder as number) - (b.sectionOrder as number);
    if (aHasOrder) return -1;
    if (bHasOrder) return 1;
    return a.name.localeCompare(b.name);
  });

  return rows.map((row) => row.name);
}

export function orderedSections(sections: SectionMap): Array<{ name: string; entries: CVEntry[] }> {
  return orderedSectionNames(sections).map((name) => ({ name, entries: sections[name] ?? [] }));
}

export function orderedBodySectionNames(sections: SectionMap): string[] {
  return orderedSectionNames(sections).filter((name) => !BODY_EXCLUDED_SECTIONS.has(name));
}

export function orderedBodySections(
  sections: SectionMap
): Array<{ name: string; entries: CVEntry[] }> {
  return orderedBodySectionNames(sections).map((name) => ({ name, entries: sections[name] ?? [] }));
}

export function splitAboutMetadata(aboutEntries: CVEntry[]): {
  contentEntries: CVEntry[];
  contactEntry: CVEntry | null;
  academicEntry: CVEntry | null;
} {
  const roots = aboutEntries.filter((entry) => !entry.parentEntryId);
  const contactEntry = roots.find(isContactInformationEntry) ?? null;
  const academicEntry = roots.find(isAcademicOverviewEntry) ?? null;
  const excluded = new Set([contactEntry?.id, academicEntry?.id].filter(Boolean));

  return {
    contentEntries: aboutEntries.filter((entry) => !excluded.has(entry.id)),
    contactEntry,
    academicEntry,
  };
}

export function extractContactInfo(sections: SectionMap): ContactInfo {
  const aboutEntries = sections.About ?? [];
  const contactEntries = sections.Contact ?? [];
  const { contactEntry } = splitAboutMetadata(aboutEntries);
  const lines = normalizeText(contactEntry?.description)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const address = lines[0] ?? "";
  const phone = lines.find((line) => /(?:\+?\d[\d.\-()\s]{7,}\d)/.test(line)) ?? "";
  const email = lines.find((line) => /@/.test(line)) ?? "";

  const websiteFromContact = contactEntries
    .filter((entry) => /website|contact form/i.test(`${entry.name} ${entry.subtitle ?? ""}`))
    .map((entry) => normalizeText(entry.link ?? ""))
    .find(Boolean);

  const website = normalizeText(contactEntry?.link) || websiteFromContact || "elijahfrost.com";

  return { address, phone, email, website };
}

export function formatContactLine(sections: SectionMap): string {
  const contact = extractContactInfo(sections);
  const website = contact.website || "elijahfrost.com";
  return [contact.address, contact.phone, contact.email, website].filter(Boolean).join(" | ");
}

export function extractAcademicStats(sections: SectionMap): string {
  const aboutEntries = sections.About ?? [];
  const { academicEntry } = splitAboutMetadata(aboutEntries);
  return normalizeText(academicEntry?.description)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" | ");
}

export function autoResumeDescription(entry: CVEntry): string {
  return normalizeText(entry.resumeDescription) || normalizeText(entry.description);
}

export function autoResumeBullets(entry: CVEntry): string[] {
  const source = normalizeText(entry.resumeBullets) || normalizeText(entry.bullets);
  if (!source) return [];

  return source
    .split(/\n|<br\s*\/?>/gi)
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);
}

function applyResumeOverridesToEntry(entry: CVEntry): CVEntry {
  return {
    ...entry,
    description: autoResumeDescription(entry) || null,
    bullets: autoResumeBullets(entry).join("\n") || null,
    children: entry.children.map(applyResumeOverridesToEntry),
  };
}

export function applyResumeOverrides(sections: SectionMap): SectionMap {
  const mapped: SectionMap = {};
  for (const [sectionName, entries] of Object.entries(sections)) {
    mapped[sectionName] = entries.map(applyResumeOverridesToEntry);
  }
  return mapped;
}

