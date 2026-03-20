import { getCVData } from "@/app/lib/notion";
import type { CVEntry } from "@/app/lib/notion";
import { TopNav } from "@/app/components/TopNav";
import { ContactForm } from "@/app/components/ContactForm";
import { DownloadButton } from "@/app/components/DownloadButton";
import {
  extractAcademicStats,
  extractContactInfo,
  orderedBodySections,
  sectionId,
  type SectionMap,
} from "@/app/lib/cv-dynamic";

export const revalidate = 60;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function dateRange(start: string | null, end: string | null): string {
  const s = start ? fmtDate(start) : null;
  const e = end ? fmtDate(end) : "Present";
  if (!s) return e;
  return `${s} - ${e}`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-8 font-serif text-3xl font-semibold tracking-tight text-[#1a1a1a] sm:text-4xl">
      {children}
    </h2>
  );
}

function SectionShell({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 lg:px-16">
      <SectionHeading>{title}</SectionHeading>
      <div className="relative pl-6 sm:pl-8">
        <span className="absolute top-0 left-0 h-full w-px bg-stone-300" aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}

function EntryTitle({
  name,
  link,
  size = "lg",
}: {
  name: string;
  link: string | null;
  size?: "lg" | "md";
}) {
  const className =
    size === "lg"
      ? "font-serif text-2xl leading-tight font-semibold text-[#1a1a1a]"
      : "font-serif text-xl leading-tight font-semibold text-[#1a1a1a]";

  if (!link) return <h3 className={className}>{name}</h3>;

  return (
    <h3 className={className}>
      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
        {name}
      </a>
    </h3>
  );
}

function BulletList({ raw }: { raw: string }) {
  const items = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-500" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function EntryBlock({
  children,
}: {
  children: React.ReactNode;
}) {
  return <article className="py-7">{children}</article>;
}

function HomeSection() {
  return (
    <section
      id="home"
      className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-6 sm:px-10 lg:px-16"
    >
      <div className="mx-auto w-full max-w-4xl text-center">
        <div className="fade-in-up delay-1">
          <p className="font-serif text-4xl text-stone-600 sm:text-5xl">Hello,</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold leading-tight text-[#1a1a1a] sm:text-6xl">
            I am Elijah Frost
          </h1>
          <p className="mt-6 text-base text-stone-600">Student Researcher &amp; Developer</p>
          <div className="fade-in-up delay-3 mx-auto mt-10 flex w-fit flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
            <DownloadButton
              href="/api/cv"
              label="CV"
              className="inline-flex h-10 w-44 items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-5 text-center text-sm font-medium text-white transition-all duration-300 hover:bg-stone-700 disabled:cursor-wait disabled:opacity-90"
            />
            <DownloadButton
              href="/resume/pdf"
              label="Resume"
              className="inline-flex h-10 w-44 items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-5 text-center text-sm font-medium text-white transition-all duration-300 hover:bg-stone-700 disabled:cursor-wait disabled:opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function EducationSection({
  entries,
  statsLine,
}: {
  entries: CVEntry[];
  statsLine: string;
}) {
  const orderedEntries = [...entries].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  return (
    <SectionShell id="education" title="Education">
      {orderedEntries.map((entry, index) => (
        <EntryBlock key={entry.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <EntryTitle name={entry.name} link={entry.link} />
              {entry.subtitle && <p className="mt-1 text-lg text-stone-600">{entry.subtitle}</p>}
            </div>
            <div className="text-right text-base text-stone-600">
              {(entry.start || entry.end) && <p>{dateRange(entry.start, entry.end)}</p>}
              {entry.location && <p>{entry.location}</p>}
            </div>
          </div>

          {entry.description && (
            <p className="mt-4 text-base leading-relaxed text-stone-700">{entry.description}</p>
          )}

          {(() => {
            const coursework = [...entry.children]
              .sort((a, b) => {
                const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
                const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return a.name.localeCompare(b.name);
              })
              .map((child) => child.name.trim())
              .filter(Boolean)
              .join(", ");
            const bulletLines = [
              ...(index === 0 && statsLine ? [statsLine] : []),
              ...(coursework ? [`Relevant Coursework: ${coursework}`] : []),
            ];
            return bulletLines.length > 0 ? <BulletList raw={bulletLines.join("\n")} /> : null;
          })()}
        </EntryBlock>
      ))}
    </SectionShell>
  );
}

function TimelineSection({
  id,
  title,
  entries,
  showHours,
}: {
  id: string;
  title: string;
  entries: CVEntry[];
  showHours?: boolean;
}) {
  return (
    <SectionShell id={id} title={title}>
      {entries.map((entry) => (
        <EntryBlock key={entry.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <EntryTitle name={entry.name} link={entry.link} />
              {entry.subtitle && <p className="mt-1 text-lg text-stone-600">{entry.subtitle}</p>}
            </div>
            <div className="text-right text-base text-stone-600">
              {showHours && entry.hours != null && (
                <p className="mb-1 text-sm tracking-wide uppercase">{entry.hours} hrs/wk</p>
              )}
              {(entry.start || entry.end) && <p>{dateRange(entry.start, entry.end)}</p>}
              {entry.location && <p>{entry.location}</p>}
            </div>
          </div>

          {entry.description && (
            <p className="mt-4 text-base leading-relaxed text-stone-700">{entry.description}</p>
          )}
          {entry.bullets && <BulletList raw={entry.bullets} />}

          {entry.children.length > 0 && (
            <div className="mt-6 space-y-5 border-l border-stone-300 pl-5">
              {entry.children.map((child) => (
                <div key={child.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-xl font-semibold leading-tight text-[#1a1a1a]">{child.name}</p>
                    {(child.start || child.end) && (
                      <p className="text-sm text-stone-500">{dateRange(child.start, child.end)}</p>
                    )}
                  </div>
                  {child.subtitle && <p className="mt-1 text-base text-stone-600">{child.subtitle}</p>}
                  {child.bullets && <BulletList raw={child.bullets} />}
                </div>
              ))}
            </div>
          )}
        </EntryBlock>
      ))}
    </SectionShell>
  );
}

function RecognitionSection({ entries }: { entries: CVEntry[] }) {
  return (
    <SectionShell id="recognition" title="Recognition">
      {entries.map((entry) => (
        <EntryBlock key={entry.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <EntryTitle name={entry.name} link={entry.link} size="md" />
              {entry.subtitle && <p className="mt-1 text-base text-stone-600">{entry.subtitle}</p>}
            </div>
            <div className="text-right text-base text-stone-600">
              {(entry.start || entry.end) && <p>{dateRange(entry.start, entry.end)}</p>}
              {entry.location && <p>{entry.location}</p>}
            </div>
          </div>
          {entry.description && (
            <p className="mt-4 text-base leading-relaxed text-stone-700">{entry.description}</p>
          )}
          {entry.bullets && <BulletList raw={entry.bullets} />}
        </EntryBlock>
      ))}
    </SectionShell>
  );
}

function SkillsSection({ entries }: { entries: CVEntry[] }) {
  const categories = entries.filter((e) => !e.parentEntryId);

  return (
    <SectionShell id="skills" title="Skills">
      {categories.map((category) => {
        const bulletSkills = (category.bullets ?? "")
          .replace(/<br\s*\/?>/gi, "\n")
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);

        const values =
          bulletSkills.length > 0
            ? bulletSkills
            : category.children.length > 0
              ? category.children.map((child) => child.name)
              : (category.description ?? "")
                  .split(/[,\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean);

        if (!values.length) return null;

        return (
          <EntryBlock key={category.id}>
            <p className="text-xl font-semibold leading-tight text-[#1a1a1a]">{category.name}</p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">{values.join(", ")}</p>
          </EntryBlock>
        );
      })}
    </SectionShell>
  );
}

function ContactSection({ entries, sectionMap }: { entries: CVEntry[]; sectionMap: SectionMap }) {
  const coreContact = extractContactInfo(sectionMap);
  const items = entries.filter(
    (e) =>
      !e.parentEntryId &&
      !/contact form|get in touch|website/i.test(
        `${e.name} ${e.subtitle ?? ""} ${e.description ?? ""}`
      )
  );

  const mergedItems = [
    { id: "address", label: "Address", value: coreContact.address, href: undefined },
    {
      id: "phone",
      label: "Phone",
      value: coreContact.phone,
      href: coreContact.phone ? `tel:${coreContact.phone}` : undefined,
    },
    {
      id: "email",
      label: "Email",
      value: coreContact.email,
      href: coreContact.email ? `mailto:${coreContact.email}` : undefined,
    },
    {
      id: "website",
      label: "Website",
      value: coreContact.website,
      href: coreContact.website
        ? `https://${coreContact.website.replace(/^https?:\/\//, "")}`
        : undefined,
    },
    ...items.map((entry) => {
      const value = entry.subtitle ?? entry.description ?? "";
      const isEmail = /email|@/i.test(entry.name) || value.includes("@");
      const isPhone = /phone|tel|mobile/i.test(entry.name);
      const href = isEmail ? `mailto:${value}` : isPhone ? `tel:${value}` : entry.link ?? undefined;
      return {
        id: entry.id,
        label: entry.name,
        value,
        href,
      };
    }),
  ].filter((item) => item.value);

  return (
    <SectionShell id="contact" title="Contact">
      <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr]">
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-stone-700">
            I am open to research collaborations, academic opportunities, and impactful projects.
            Feel free to reach out.
          </p>

          <div className="space-y-5">
            {mergedItems.map((item) => (
              <div key={item.id}>
                <p className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="mt-1 block text-base text-stone-800 hover:opacity-70">
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 text-base text-stone-800">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <ContactForm />
        </div>
      </div>
    </SectionShell>
  );
}

function EmptySection({ id, title }: { id: string; title: string }) {
  return (
    <SectionShell id={id} title={title}>
      <EntryBlock>
        <p className="text-base text-stone-500">No entries yet.</p>
      </EntryBlock>
    </SectionShell>
  );
}

function GenericSection({ title, entries }: { title: string; entries: CVEntry[] }) {
  return (
    <SectionShell id={sectionId(title)} title={title}>
      {entries.map((entry) => (
        <EntryBlock key={entry.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <EntryTitle name={entry.name} link={entry.link} />
              {entry.subtitle ? <p className="mt-1 text-lg text-stone-600">{entry.subtitle}</p> : null}
            </div>
            <div className="text-right text-base text-stone-600">
              {(entry.start || entry.end) ? <p>{dateRange(entry.start, entry.end)}</p> : null}
              {entry.location ? <p>{entry.location}</p> : null}
            </div>
          </div>
          {entry.description ? (
            <p className="mt-4 text-base leading-relaxed text-stone-700">{entry.description}</p>
          ) : null}
          {entry.bullets ? <BulletList raw={entry.bullets} /> : null}
        </EntryBlock>
      ))}
    </SectionShell>
  );
}

export function CVSite({
  sectionMap,
}: {
  sectionMap: SectionMap;
}) {
  const contact = sectionMap.Contact ?? [];
  const educationStats = extractAcademicStats(sectionMap);
  const sectionNames = [
    ...orderedBodySections(sectionMap).map((section) => section.name),
    ...(contact.length ? ["Contact"] : []),
  ];

  const renderSection = (name: string, entries: CVEntry[]) => {
    if (name === "Education") {
      return entries.length > 0 ? (
        <EducationSection entries={entries} statsLine={educationStats} />
      ) : (
        <EmptySection id="education" title="Education" />
      );
    }
    if (name === "Research") {
      return entries.length > 0 ? (
        <TimelineSection id="research" title="Research" entries={entries} />
      ) : (
        <EmptySection id="research" title="Research" />
      );
    }
    if (name === "Experience") {
      return entries.length > 0 ? (
        <TimelineSection id="experience" title="Experience" entries={entries} showHours />
      ) : (
        <EmptySection id="experience" title="Experience" />
      );
    }
    if (name === "Recognition") {
      return entries.length > 0 ? (
        <RecognitionSection entries={entries} />
      ) : (
        <EmptySection id="recognition" title="Recognition" />
      );
    }
    if (name === "Skills") {
      return entries.length > 0 ? (
        <SkillsSection entries={entries} />
      ) : (
        <EmptySection id="skills" title="Skills" />
      );
    }
    return entries.length > 0 ? (
      <GenericSection title={name} entries={entries} />
    ) : (
      <EmptySection id={sectionId(name)} title={name} />
    );
  };

  return (
    <>
      <TopNav
        sectionLabels={sectionNames}
        resumeDownloadHref="/resume/pdf"
      />
      <main className="bg-white pt-16 text-[#1a1a1a]">
        <HomeSection />
        {orderedBodySections(sectionMap).map(({ name, entries }) => (
          <div key={name}>{renderSection(name, entries)}</div>
        ))}
        {contact.length ? <ContactSection entries={contact} sectionMap={sectionMap} /> : null}
      </main>
    </>
  );
}

export default async function Page() {
  const cv = (await getCVData()) as SectionMap;
  return <CVSite sectionMap={cv} />;
}
