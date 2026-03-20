import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type CVSection =
  | "About"
  | "Education"
  | "Research"
  | "Experience"
  | "Recognition"
  | "Skills"
  | "Contact";

export interface CVEntry {
  id: string;
  name: string;
  section: CVSection;
  subtitle: string | null;
  description: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  order: number | null;
  hours: number | null;
  bullets: string | null;
  link: string | null;
  parentEntryId: string | null;
  sectionDescription: string | null;
  resumeProfiles: string[];
  resumeDescription: string | null;
  resumeBullets: string | null;
  children: CVEntry[];
}

export type CVData = Record<CVSection, CVEntry[]>;

// ---------------------------------------------------------------------------
// Notion client (singleton for server-side use)
// ---------------------------------------------------------------------------

function getNotionClient(): Client {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("Missing environment variable: NOTION_API_KEY");
  return new Client({ auth: apiKey });
}

function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error("Missing environment variable: NOTION_DATABASE_ID");
  return id;
}

// ---------------------------------------------------------------------------
// Property extractors
// ---------------------------------------------------------------------------

type Props = PageObjectResponse["properties"];

function getText(props: Props, key: string): string | null {
  const prop = props[key];
  if (!prop) return null;
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("") || null;
  }
  if (prop.type === "title") {
    return prop.title.map((t) => t.plain_text).join("") || null;
  }
  return null;
}

function getSelect(props: Props, key: string): string | null {
  const prop = props[key];
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

function getNumber(props: Props, key: string): number | null {
  const prop = props[key];
  if (!prop || prop.type !== "number") return null;
  return prop.number ?? null;
}

function getDate(props: Props, key: string): string | null {
  const prop = props[key];
  if (!prop || prop.type !== "date") return null;
  return prop.date?.start ?? null;
}

function getUrl(props: Props, key: string): string | null {
  const prop = props[key];
  if (!prop || prop.type !== "url") return null;
  return prop.url ?? null;
}

function getMultiSelect(props: Props, key: string): string[] {
  const prop = props[key];
  if (!prop || prop.type !== "multi_select") return [];
  return prop.multi_select.map((o) => o.name);
}

function getRelationId(props: Props, key: string): string | null {
  const prop = props[key];
  if (!prop || prop.type !== "relation") return null;
  return prop.relation[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Page → CVEntry mapper
// ---------------------------------------------------------------------------

function mapPage(page: PageObjectResponse): CVEntry {
  const props = page.properties;
  return {
    id: page.id,
    name: getText(props, "Name") ?? "",
    section: (getSelect(props, "Section") as CVSection) ?? "About",
    subtitle: getText(props, "Subtitle"),
    description: getText(props, "Description"),
    location: getText(props, "Location"),
    start: getDate(props, "Start"),
    end: getDate(props, "End"),
    order: getNumber(props, "Order"),
    hours: getNumber(props, "Hours"),
    bullets: getText(props, "Bullets"),
    link: getUrl(props, "Link"),
    parentEntryId: getRelationId(props, "Parent Entry"),
    sectionDescription: getText(props, "Section Description"),
    resumeProfiles: getMultiSelect(props, "Resume Profiles"),
    resumeDescription: getText(props, "Resume Description"),
    resumeBullets: getText(props, "Resume Bullets"),
    children: [],
  };
}

// ---------------------------------------------------------------------------
// Parent-child nesting helper
// ---------------------------------------------------------------------------

function nestEntries(entries: CVEntry[]): CVEntry[] {
  const byId = new Map<string, CVEntry>(entries.map((e) => [e.id, e]));
  const roots: CVEntry[] = [];

  for (const entry of entries) {
    if (entry.parentEntryId && byId.has(entry.parentEntryId)) {
      byId.get(entry.parentEntryId)!.children.push(entry);
    } else {
      roots.push(entry);
    }
  }

  return roots;
}

// ---------------------------------------------------------------------------
// Group a flat list into a Record keyed by section
// ---------------------------------------------------------------------------

function groupBySection(entries: CVEntry[]): CVData {
  const groups = {} as CVData;
  for (const entry of entries) {
    if (!groups[entry.section]) groups[entry.section] = [];
    groups[entry.section].push(entry);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Database query helper
// ---------------------------------------------------------------------------

async function queryAllVisiblePages(): Promise<PageObjectResponse[]> {
  const notion = getNotionClient();
  const databaseId = getDatabaseId();
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Visible",
        checkbox: { equals: true },
      },
      sorts: [{ property: "Order", direction: "ascending" }],
      start_cursor: cursor,
    });

    for (const result of response.results) {
      if (result.object === "page" && "properties" in result) {
        pages.push(result as PageObjectResponse);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCVData(): Promise<CVData> {
  const pages = await queryAllVisiblePages();
  const entries = pages.map(mapPage);
  const nested = nestEntries(entries);
  return groupBySection(nested);
}

export async function getResumeData(profile: string): Promise<CVData> {
  const pages = await queryAllVisiblePages();
  const entries = pages
    .map(mapPage)
    .filter((e) => e.resumeProfiles.includes(profile));
  const nested = nestEntries(entries);
  return groupBySection(nested);
}
