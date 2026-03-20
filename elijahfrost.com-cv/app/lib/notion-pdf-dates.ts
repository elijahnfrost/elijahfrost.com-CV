import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { CVData, CVEntry } from "@/app/lib/notion";

type EntryRenderFields = {
  start: string | null;
  end: string | null;
  compact: boolean;
};

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

function textFromProperty(prop: unknown): string | null {
  if (!prop || typeof prop !== "object") return null;
  const p = prop as Record<string, unknown>;
  const type = p.type;

  if (type === "rich_text" && Array.isArray(p.rich_text)) {
    const value = p.rich_text
      .map((part) =>
        part && typeof part === "object" && "plain_text" in part
          ? String((part as Record<string, unknown>).plain_text ?? "")
          : ""
      )
      .join("")
      .trim();
    return value || null;
  }

  if (type === "title" && Array.isArray(p.title)) {
    const value = p.title
      .map((part) =>
        part && typeof part === "object" && "plain_text" in part
          ? String((part as Record<string, unknown>).plain_text ?? "")
          : ""
      )
      .join("")
      .trim();
    return value || null;
  }

  if (type === "date" && p.date && typeof p.date === "object") {
    const value = (p.date as Record<string, unknown>).start;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  if (type === "select" && p.select && typeof p.select === "object") {
    const value = (p.select as Record<string, unknown>).name;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  return null;
}

async function fetchStartEndById(): Promise<Map<string, EntryRenderFields>> {
  const notion = getNotionClient();
  const byId = new Map<string, EntryRenderFields>();
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: getDatabaseId(),
      filter: {
        property: "Visible",
        checkbox: { equals: true },
      },
      start_cursor: cursor,
    });

    for (const result of response.results) {
      if (result.object !== "page" || !("properties" in result)) continue;
      const page = result as PageObjectResponse;
      const props = page.properties as Record<string, unknown>;
      const start = textFromProperty(props["Start"] ?? props["start"]);
      const end = textFromProperty(props["End"] ?? props["end"]);
      const compactProp = props["Compact"] ?? props["compact"];
      const compact =
        !!(
          compactProp &&
          typeof compactProp === "object" &&
          "type" in compactProp &&
          (compactProp as { type?: unknown }).type === "checkbox" &&
          "checkbox" in compactProp &&
          (compactProp as { checkbox?: unknown }).checkbox === true
        );

      byId.set(page.id, { start, end, compact });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return byId;
}

function mergeEntryDates(entry: CVEntry, byId: Map<string, EntryRenderFields>): CVEntry {
  const found = byId.get(entry.id);
  const mergedStart = found?.start ?? entry.start ?? null;
  const mergedEnd = found?.end ?? entry.end ?? null;
  const merged: CVEntry = {
    ...entry,
    start: mergedStart,
    end: mergedEnd,
    children: entry.children.map((child) => mergeEntryDates(child, byId)),
  };
  const compact = found?.compact ?? false;
  return Object.assign(merged, {
    Compact: compact,
    compact,
  });
}

export async function enrichSectionsWithNotionTextDates(sections: CVData): Promise<CVData> {
  const byId = await fetchStartEndById();
  const out = {} as CVData;
  for (const [sectionName, entries] of Object.entries(sections)) {
    out[sectionName as keyof CVData] = entries.map((entry) => mergeEntryDates(entry, byId));
  }
  return out;
}

