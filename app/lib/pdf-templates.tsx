import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CVData, CVEntry } from "@/app/lib/notion";
import {
  extractContactInfo,
  orderedBodySections,
  splitAboutMetadata,
  type SectionMap,
} from "@/app/lib/cv-dynamic";

const PAGE_WIDTH_PT = 612;
const PAGE_MARGIN_PT = 36; // 0.5in
const RESUME_PAGE_MARGIN_PT = 28.8; // 0.4in

type RenderMode = "resume" | "cv";

type ResumeDensityConfig = {
  nameSize: number;
  sectionSize: number;
  bodySize: number;
  bulletSize: number;
  lineHeight: number;
  entryGap: number;
  sectionTop: number;
  maxBulletsPerEntry: number;
};

const HEADER_WEBSITE = "elijahfrost.com";

const RESUME_BASE_CONFIG: ResumeDensityConfig = {
  nameSize: 12.5,
  sectionSize: 9.2,
  bodySize: 9,
  bulletSize: 8.5,
  lineHeight: 1.12,
  entryGap: 1,
  sectionTop: 4,
  maxBulletsPerEntry: 2,
};

const RESUME_OVERFLOW_CONFIG: ResumeDensityConfig = {
  nameSize: 12,
  sectionSize: 8.8,
  bodySize: 8.5,
  bulletSize: 8,
  lineHeight: 1.1,
  entryGap: 0,
  sectionTop: 3,
  maxBulletsPerEntry: 2,
};

const RESUME_MIN_CONFIG: ResumeDensityConfig = {
  nameSize: 11.6,
  sectionSize: 8.5,
  bodySize: 8.2,
  bulletSize: 7.8,
  lineHeight: 1.08,
  entryGap: 0,
  sectionTop: 2.5,
  maxBulletsPerEntry: 2,
};

function createMitStyles(config: {
  nameSize: number;
  sectionSize: number;
  bodySize: number;
  bulletSize?: number;
  lineHeight: number;
  entryGap: number;
  sectionTop: number;
  pageMargin?: number;
}) {
  const bulletSize = config.bulletSize ?? config.bodySize;
  const pageMargin = config.pageMargin ?? PAGE_MARGIN_PT;
  return StyleSheet.create({
    page: {
      width: PAGE_WIDTH_PT,
      paddingTop: pageMargin,
      paddingBottom: pageMargin,
      paddingLeft: pageMargin,
      paddingRight: pageMargin,
      fontFamily: "Times-Roman",
      fontSize: config.bodySize,
      color: "#000000",
      lineHeight: config.lineHeight,
    },
    body: {
      fontSize: config.bodySize,
    },
    header: {
      marginBottom: 4,
    },
    headerRow: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerColLeft: {
      width: "33%",
      paddingTop: 2,
    },
    headerColCenter: {
      width: "34%",
      alignItems: "center",
    },
    headerColRight: {
      width: "33%",
      alignItems: "flex-end",
      paddingTop: 2,
    },
    name: {
      fontFamily: "Times-Bold",
      fontSize: config.nameSize,
      lineHeight: 1.1,
    },
    section: {
      marginTop: config.sectionTop,
    },
    sectionTitle: {
      fontFamily: "Times-Bold",
      fontSize: config.sectionSize,
      textTransform: "uppercase",
    },
    sectionRule: {
      marginTop: 1,
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
    },
    sectionBody: {
      marginTop: 1,
    },
    entry: {
      marginBottom: config.entryGap,
    },
    rowBetween: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    leftCell: {
      flexGrow: 1,
      flexShrink: 1,
    },
    rightCell: {
      flexShrink: 0,
      textAlign: "right",
    },
    entryTitle: {
      fontFamily: "Times-Bold",
      fontSize: config.bodySize,
    },
    italic: {
      fontStyle: "italic",
    },
    description: {
      fontSize: config.bodySize,
      marginTop: 1,
      marginBottom: 1,
    },
    bulletRow: {
      display: "flex",
      flexDirection: "row",
      marginLeft: 15,
      marginTop: 0.5,
    },
    bulletGlyph: {
      width: 8,
      fontSize: bulletSize,
      marginRight: 4,
    },
    bulletContent: {
      flexGrow: 1,
      flexShrink: 1,
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    bulletLeft: {
      flexGrow: 1,
      flexShrink: 1,
      fontSize: bulletSize,
    },
    bulletRight: {
      textAlign: "right",
      flexShrink: 0,
      fontSize: bulletSize,
    },
    skillLine: {
      fontSize: config.bodySize,
      marginBottom: 1,
    },
    skillCategory: {
      fontFamily: "Times-Bold",
    },
  });
}

const cvStyles = createMitStyles({
  nameSize: 14,
  sectionSize: 10,
  bodySize: 10,
  bulletSize: 10,
  lineHeight: 1.22,
  entryGap: 3,
  sectionTop: 6,
});

type MitStyles = ReturnType<typeof createMitStyles>;

function normalizeUnicode(value: string): string {
  return value
    // Preserve mu glyphs for micron units in PDF output.
    .replaceAll("¼", "μ")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"');
}

function safeText(value: string | null | undefined): string {
  if (!value) return "";
  return normalizeUnicode(value).normalize("NFC").trim();
}

function formatDateValue(value: string | null): string {
  if (!value) return "";
  const raw = safeText(value);
  if (!raw) return "";

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(raw)) return raw;

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(start: string | null, end: string | null): string {
  const startText = formatDateValue(start);
  const endText = formatDateValue(end);
  if (!startText) return "";
  if (startText && endText) return `${startText} – ${endText}`;
  if (startText) return startText;
  return "";
}

function fieldText(
  source: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      const clean = safeText(value);
      if (clean) return clean;
    }
  }
  return null;
}

function entryDateRange(entry: CVEntry): string {
  const raw = entry as CVEntry & Record<string, unknown>;
  const start = fieldText(raw, ["start", "Start"]);
  const end = fieldText(raw, ["end", "End"]);
  return formatDateRange(start, end);
}

function sanitizeBullet(line: string): string {
  return safeText(line).replace(/^[-*•\s]+/, "").trim();
}

function bulletLines(entry: CVEntry): string[] {
  const raw = entry.bullets ?? entry.resumeBullets;
  if (!raw) return [];
  return raw
    .split(/\n|<br\s*\/?>/gi)
    .map((line) => sanitizeBullet(line))
    .filter(Boolean);
}

function sortByOrder(entries: CVEntry[]): CVEntry[] {
  return [...entries].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return safeText(a.name).localeCompare(safeText(b.name));
  });
}

type EntryRenderConfig = {
  showDescription: boolean;
  bulletsField: "Bullets" | "Resume Bullets";
  descriptionField: "Description" | "Resume Description";
  fallbackBulletLimit: number;
};

function estimateResumeHeight(
  sections: SectionMap,
  cfg: ResumeDensityConfig,
  margin: number,
  renderConfig: EntryRenderConfig
): number {
  const sectionEntries = orderedBodySectionsForPdf(sections).map(({ entries }) => rootEntries(entries));
  let lines = 4; // header rows

  for (const entries of sectionEntries) {
    if (!entries.length) continue;
    lines += 2; // section title + rule
    for (const entry of entries) {
      const normalized = normalizeEntryForMode(entry, "resume", renderConfig);
      if (normalized.inlineCompact) {
        lines += 1;
        continue;
      }
      lines += 1; // name line
      if (normalized.subtitle || normalized.date) lines += 1;
      if (normalized.description) lines += 1;
      lines += normalized.bullets.length;
    }
  }

  const textHeight = lines * cfg.bodySize * cfg.lineHeight;
  const verticalPadding = margin * 2;
  return textHeight + verticalPadding;
}

function orderedBodySectionsForPdf(sections: SectionMap): Array<{ name: string; entries: CVEntry[] }> {
  return orderedBodySections(sections).map(({ name, entries }) => {
    if (name !== "About") return { name, entries };
    return {
      name,
      entries: splitAboutMetadata(entries).contentEntries,
    };
  });
}

function sectionHeader(title: string, styles: MitStyles) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
    </View>
  );
}

function bulletRow(
  styles: MitStyles,
  left: string,
  right?: string,
  key?: string
) {
  return (
    <View key={key ?? `${left}-${right ?? ""}`} style={styles.bulletRow}>
      <Text style={styles.bulletGlyph}>•</Text>
      <View style={styles.bulletContent}>
        <Text style={[styles.body, styles.bulletLeft]}>{left}</Text>
        {right ? <Text style={[styles.body, styles.bulletRight]}>{right}</Text> : null}
      </View>
    </View>
  );
}

function rootEntries(entries: CVEntry[]): CVEntry[] {
  return sortByOrder(entries).filter((entry) => !entry.parentEntryId);
}

function renderHeader(styles: MitStyles, sections: SectionMap) {
  const contact = extractContactInfo(sections);
  const address = safeText(contact.address);
  const email = safeText(contact.email);
  const phone = safeText(contact.phone);

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerColLeft}>
          <Text style={styles.body}>{address}</Text>
        </View>

        <View style={styles.headerColCenter}>
          <Text style={styles.name}>Elijah Frost</Text>
          <Text style={styles.body}>{email}</Text>
          <Text style={styles.body}>{phone}</Text>
        </View>

        <View style={styles.headerColRight}>
          <Text style={styles.body}>{HEADER_WEBSITE}</Text>
        </View>
      </View>
    </View>
  );
}

type NormalizedEntry = {
  id: string;
  name: string;
  location: string;
  subtitle: string;
  date: string;
  description: string;
  bullets: string[];
  inlineCompact: boolean;
};

function normalizeEntryForMode(
  entry: CVEntry,
  mode: RenderMode,
  renderConfig: EntryRenderConfig
): NormalizedEntry {
  const raw = entry as CVEntry & Record<string, unknown>;
  const name = safeText(entry.name);
  const location = safeText(entry.location);
  const subtitle = safeText(entry.subtitle);
  const date = entryDateRange(entry);

  const primaryDescription =
    renderConfig.descriptionField === "Resume Description"
      ? safeText(entry.resumeDescription)
      : safeText(entry.description);
  const fallbackDescription = safeText(entry.description);
  const rawDescription = primaryDescription || fallbackDescription;
  const description = renderConfig.showDescription ? rawDescription : "";

  const allBullets = bulletLines(entry);
  const preferredBullets =
    renderConfig.bulletsField === "Resume Bullets" && safeText(entry.resumeBullets)
      ? safeText(entry.resumeBullets)
          .split(/\n|<br\s*\/?>/gi)
          .map((line) => sanitizeBullet(line))
          .filter(Boolean)
      : renderConfig.bulletsField === "Bullets" && safeText(entry.bullets)
        ? safeText(entry.bullets)
            .split(/\n|<br\s*\/?>/gi)
            .map((line) => sanitizeBullet(line))
            .filter(Boolean)
        : [];
  const resumePreferred = safeText(entry.resumeBullets)
    ? safeText(entry.resumeBullets)
        .split(/\n|<br\s*\/?>/gi)
        .map((line) => sanitizeBullet(line))
        .filter(Boolean)
    : [];
  const limitedFallback = allBullets.slice(0, Math.max(1, renderConfig.fallbackBulletLimit));
  const compactFlag = raw["Compact"] === true || raw["compact"] === true;
  const baseBullets =
    mode === "resume"
      ? compactFlag
        ? resumePreferred.length > 0
          ? resumePreferred
          : allBullets
        : preferredBullets.length > 0
          ? preferredBullets
          : limitedFallback
      : preferredBullets.length > 0
        ? preferredBullets
        : allBullets;

  const childNames = sortByOrder(entry.children)
    .map((child) => safeText(child.name))
    .filter(Boolean);
  const courseworkBullet =
    childNames.length > 0
      ? [`Relevant Coursework: ${childNames.join(", ")}`]
      : [];

  const bullets = [...baseBullets, ...courseworkBullet];
  const inlineCompact = compactFlag;

  return {
    id: entry.id,
    name,
    location,
    subtitle,
    date,
    description,
    bullets,
    inlineCompact,
  };
}

function renderUniversalEntry(
  styles: MitStyles,
  normalized: NormalizedEntry
) {
  if (!normalized.name && normalized.bullets.length === 0 && !normalized.description) return null;

  if (normalized.inlineCompact) {
    return (
      <View key={normalized.id} style={styles.entry}>
        <Text style={styles.skillLine}>
          <Text style={styles.skillCategory}>{normalized.name}:</Text>{" "}
          {normalized.bullets.join(", ")}
        </Text>
      </View>
    );
  }

  return (
    <View key={normalized.id} style={styles.entry}>
      <View style={styles.rowBetween}>
        <Text style={[styles.body, styles.entryTitle, styles.leftCell]}>{normalized.name}</Text>
        {normalized.location ? (
          <Text style={[styles.body, styles.rightCell]}>{normalized.location}</Text>
        ) : null}
      </View>

      {normalized.subtitle || normalized.date ? (
        <View style={styles.rowBetween}>
          <Text style={[styles.body, styles.italic, styles.leftCell]}>{normalized.subtitle}</Text>
          {normalized.date ? (
            <Text style={[styles.body, styles.italic, styles.rightCell]}>{normalized.date}</Text>
          ) : null}
        </View>
      ) : null}

      {normalized.description ? <Text style={styles.description}>{normalized.description}</Text> : null}

      {normalized.bullets.map((bullet, index) =>
        bulletRow(styles, bullet, undefined, `${normalized.id}-bullet-${index}`)
      )}
    </View>
  );
}

function renderUniversalSection(
  styles: MitStyles,
  sectionKey: string,
  sectionTitle: string,
  entries: CVEntry[],
  mode: RenderMode,
  renderConfig: EntryRenderConfig
) {
  if (!entries.length) return null;
  return (
    <View key={sectionKey} style={styles.section}>
      {sectionHeader(sectionTitle, styles)}
      <View style={styles.sectionBody}>
        {entries.map((entry) =>
          renderUniversalEntry(
            styles,
            normalizeEntryForMode(entry, mode, renderConfig)
          )
        )}
      </View>
    </View>
  );
}

type ResumeDocumentProps = {
  sections: CVData;
};

export function ResumeDocument({ sections }: ResumeDocumentProps) {
  const sectionMap = sections as SectionMap;
  const renderConfig: EntryRenderConfig = {
    showDescription: false,
    bulletsField: "Resume Bullets",
    descriptionField: "Resume Description",
    fallbackBulletLimit: RESUME_BASE_CONFIG.maxBulletsPerEntry,
  };
  const letterHeight = 792;
  const candidates: Array<{ cfg: ResumeDensityConfig; margin: number }> = [
    { cfg: RESUME_BASE_CONFIG, margin: RESUME_PAGE_MARGIN_PT },
    { cfg: RESUME_OVERFLOW_CONFIG, margin: 25.2 },
    { cfg: RESUME_MIN_CONFIG, margin: 25.2 },
  ];
  const selected =
    candidates.find(({ cfg, margin }) =>
      estimateResumeHeight(sectionMap, cfg, margin, renderConfig) <= letterHeight
    ) ??
    candidates[candidates.length - 1];
  const cfg = selected.cfg;
  const margin = selected.margin;
  const resumeStyles = createMitStyles({
    nameSize: cfg.nameSize,
    sectionSize: cfg.sectionSize,
    bodySize: cfg.bodySize,
    bulletSize: cfg.bulletSize,
    lineHeight: cfg.lineHeight,
    entryGap: cfg.entryGap,
    sectionTop: cfg.sectionTop,
    pageMargin: margin,
  });
  const bodySections = orderedBodySectionsForPdf(sectionMap).map(({ name, entries }) => ({
    title: name.toUpperCase(),
    entries: rootEntries(entries),
  }));

  return (
    <Document title="Elijah_Frost_Resume">
      <Page size="LETTER" style={resumeStyles.page}>
        {renderHeader(resumeStyles, sectionMap)}
        {bodySections.map((section) => {
          if (!section.entries.length) return null;
          return renderUniversalSection(
            resumeStyles,
            section.title,
            section.title,
            section.entries,
            "resume",
            renderConfig
          );
        })}
      </Page>
    </Document>
  );
}

type CVDocumentProps = {
  sections: CVData;
};

export function CVDocument({ sections }: CVDocumentProps) {
  const sectionMap = sections as SectionMap;
  const renderConfig: EntryRenderConfig = {
    showDescription: true,
    bulletsField: "Bullets",
    descriptionField: "Description",
    fallbackBulletLimit: 2,
  };
  const bodySections = orderedBodySectionsForPdf(sectionMap).map(({ name, entries }) => ({
    title: name.toUpperCase(),
    entries: rootEntries(entries),
  }));

  return (
    <Document title="Elijah_Frost_CV">
      <Page size="LETTER" style={cvStyles.page}>
        {renderHeader(cvStyles, sectionMap)}
        {bodySections.map((section) => {
          if (!section.entries.length) return null;
          return renderUniversalSection(
            cvStyles,
            section.title,
            section.title,
            section.entries,
            "cv",
            renderConfig
          );
        })}
      </Page>
    </Document>
  );
}
