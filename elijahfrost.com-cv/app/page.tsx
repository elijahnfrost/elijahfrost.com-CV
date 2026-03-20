import { getCVData } from "@/app/lib/notion";
import type { CVEntry } from "@/app/lib/notion";
import { Sidebar } from "@/app/components/Sidebar";
import { ContactForm } from "@/app/components/ContactForm";

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function dateRange(start: string | null, end: string | null): string {
  const s = start ? fmtDate(start) : null;
  const e = end ? fmtDate(end) : "Present";
  if (!s) return e;
  return `${s} – ${e}`;
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-8">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-xs font-semibold tracking-widest text-stone-400 uppercase">
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="my-8 border-t border-stone-100" />;
}

function BulletList({ raw }: { raw: string }) {
  const items = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-stone-600 leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Icon components
// ---------------------------------------------------------------------------

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-stone-400">
      <path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.31-2.69-6-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-stone-400">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,6 12,13 22,6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-stone-400">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.45 3.38 2 2 0 0 1 3.42 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.01z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section: Home
// ---------------------------------------------------------------------------

function HomeSection({ bio }: { bio: string | null }) {
  return (
    <section id="home" className="min-h-screen flex items-center px-16 py-24">
      <div className="flex w-full max-w-4xl items-center gap-16">
        <div className="flex-1">
          <p className="mb-3 text-xs font-medium tracking-[0.3em] text-stone-400 uppercase">
            Student Researcher &amp; Developer
          </p>
          <h1 className="font-serif text-6xl font-semibold leading-tight text-stone-900">
            Elijah
            <br />
            Frost
          </h1>
          {bio && (
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone-500">
              {bio}
            </p>
          )}
          <div className="mt-10 flex gap-4">
            <a
              href="#about"
              className="rounded-full border border-stone-900 px-7 py-2.5 text-xs font-medium tracking-widest text-stone-900 uppercase transition-colors hover:bg-stone-900 hover:text-white"
            >
              Learn More
            </a>
            <a
              href="/cv.pdf"
              className="rounded-full bg-stone-900 px-7 py-2.5 text-xs font-medium tracking-widest text-white uppercase transition-colors hover:bg-stone-700"
            >
              Download CV
            </a>
          </div>
        </div>

        {/* Headshot placeholder */}
        <div className="hidden lg:flex h-80 w-64 shrink-0 items-center justify-center rounded-2xl bg-stone-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-16 w-16 text-stone-300"
          >
            <circle cx="12" cy="8" r="5" />
            <path d="M3 21c0-5 4-9 9-9s9 4 9 9" />
          </svg>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: About
// ---------------------------------------------------------------------------

function ContactInfoItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-[10px] tracking-widest text-stone-400 uppercase">{label}</p>
        <p className="text-sm text-stone-700">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="transition-opacity hover:opacity-70">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-stone-200 bg-stone-50 px-5 py-4">
      <span className="text-xs tracking-widest text-stone-400 uppercase">{label}</span>
      <span className="mt-1 font-serif text-2xl font-semibold text-stone-900">{value}</span>
    </div>
  );
}

function AboutSection({ entries, contactEntries }: { entries: CVEntry[]; contactEntries: CVEntry[] }) {
  const objective = entries.find((e) => !e.parentEntryId);
  const statsEntries = entries.filter(
    (e) => e.parentEntryId && !e.children.length
  );
  const academicStats = statsEntries.filter((e) =>
    /gpa|sat|rank|score|grade/i.test(e.name)
  );

  const contactItems = contactEntries.filter((e) => !e.parentEntryId);

  return (
    <section id="about" className="px-16 py-24">
      <SectionHeading>About</SectionHeading>

      {/* Objective */}
      {objective?.description && (
        <div className="mb-10">
          <SubHeading>Objective</SubHeading>
          <p className="max-w-2xl text-base leading-relaxed text-stone-600">
            {objective.description}
          </p>
        </div>
      )}

      <Divider />

      {/* Contact Information */}
      {contactItems.length > 0 && (
        <>
          <div className="mb-10">
            <SubHeading>Contact Information</SubHeading>
            <div className="flex flex-wrap gap-6">
              {contactItems.map((entry) => {
                const isEmail = /email|@/i.test(entry.name) || (entry.description ?? "").includes("@");
                const isPhone = /phone|tel|mobile/i.test(entry.name);
                const isLocation = /location|address|city/i.test(entry.name);
                const icon = isEmail ? <MailIcon /> : isPhone ? <PhoneIcon /> : isLocation ? <LocationIcon /> : <LocationIcon />;
                const href = isEmail
                  ? `mailto:${entry.description ?? ""}`
                  : isPhone
                  ? `tel:${entry.description ?? ""}`
                  : entry.link ?? undefined;
                return (
                  <ContactInfoItem
                    key={entry.id}
                    icon={icon}
                    label={entry.name}
                    value={entry.subtitle ?? entry.description ?? ""}
                    href={href}
                  />
                );
              })}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/* Academic Overview */}
      {academicStats.length > 0 && (
        <div>
          <SubHeading>Academic Overview</SubHeading>
          <div className="flex flex-wrap gap-4">
            {academicStats.map((e) => (
              <StatCard
                key={e.id}
                label={e.name}
                value={e.subtitle ?? e.description ?? ""}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Education
// ---------------------------------------------------------------------------

function EducationEntry({ entry }: { entry: CVEntry }) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-900">
            {entry.link ? (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-stone-600 transition-colors"
              >
                {entry.name}
                <LinkIcon />
              </a>
            ) : (
              entry.name
            )}
          </h3>
          {entry.subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{entry.subtitle}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {(entry.start || entry.end) && (
            <p className="text-sm text-stone-500">
              {dateRange(entry.start, entry.end)}
            </p>
          )}
          {entry.location && (
            <p className="mt-0.5 text-xs text-stone-400">{entry.location}</p>
          )}
        </div>
      </div>

      {entry.description && (
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          {entry.description}
        </p>
      )}

      {/* Sub-items (programs, courses, etc.) */}
      {entry.children.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-stone-100">
          {entry.children.map((child) => (
            <div
              key={child.id}
              className="rounded-lg bg-stone-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    {child.name}
                  </p>
                  {child.subtitle && (
                    <p className="text-xs text-stone-500">{child.subtitle}</p>
                  )}
                </div>
                {(child.start || child.end) && (
                  <p className="text-xs text-stone-400 shrink-0">
                    {dateRange(child.start, child.end)}
                  </p>
                )}
              </div>
              {child.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                  {child.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationSection({ entries }: { entries: CVEntry[] }) {
  return (
    <section id="education" className="px-16 py-24 bg-stone-50/50">
      <SectionHeading>Education</SectionHeading>
      {entries.map((entry) => (
        <EducationEntry key={entry.id} entry={entry} />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Research & Experience (shared layout)
// ---------------------------------------------------------------------------

function ResearchEntry({ entry, showHours }: { entry: CVEntry; showHours?: boolean }) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            {entry.link ? (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-stone-600 transition-colors"
              >
                {entry.name}
                <LinkIcon />
              </a>
            ) : (
              entry.name
            )}
          </h3>
          {entry.subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{entry.subtitle}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {showHours && entry.hours != null && (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                {entry.hours} hrs/wk
              </span>
            )}
            {(entry.start || entry.end) && (
              <p className="text-sm text-stone-500">
                {dateRange(entry.start, entry.end)}
              </p>
            )}
          </div>
          {entry.location && (
            <p className="mt-0.5 text-xs text-stone-400">{entry.location}</p>
          )}
        </div>
      </div>

      {entry.description && (
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          {entry.description}
        </p>
      )}

      {entry.bullets && <BulletList raw={entry.bullets} />}

      {entry.children.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-stone-100">
          {entry.children.map((child) => (
            <div key={child.id} className="rounded-lg bg-stone-50 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{child.name}</p>
                  {child.subtitle && (
                    <p className="text-xs text-stone-500">{child.subtitle}</p>
                  )}
                </div>
                {(child.start || child.end) && (
                  <p className="text-xs text-stone-400 shrink-0">
                    {dateRange(child.start, child.end)}
                  </p>
                )}
              </div>
              {child.bullets && <BulletList raw={child.bullets} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchSection({ entries }: { entries: CVEntry[] }) {
  return (
    <section id="research" className="px-16 py-24">
      <SectionHeading>Research</SectionHeading>
      {entries.map((entry) => (
        <ResearchEntry key={entry.id} entry={entry} />
      ))}
    </section>
  );
}

function ExperienceSection({ entries }: { entries: CVEntry[] }) {
  return (
    <section id="experience" className="px-16 py-24 bg-stone-50/50">
      <SectionHeading>Experience</SectionHeading>
      {entries.map((entry) => (
        <ResearchEntry key={entry.id} entry={entry} showHours />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Recognition
// ---------------------------------------------------------------------------

function RecognitionEntry({ entry }: { entry: CVEntry }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            {entry.link ? (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-stone-600 transition-colors"
              >
                {entry.name}
                <LinkIcon />
              </a>
            ) : (
              entry.name
            )}
          </h3>
          {entry.subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{entry.subtitle}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {(entry.start || entry.end) && (
            <p className="text-sm text-stone-500">
              {dateRange(entry.start, entry.end)}
            </p>
          )}
          {entry.location && (
            <p className="mt-0.5 text-xs text-stone-400">{entry.location}</p>
          )}
        </div>
      </div>
      {entry.description && (
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          {entry.description}
        </p>
      )}
      {entry.bullets && <BulletList raw={entry.bullets} />}
    </div>
  );
}

function RecognitionSection({ entries }: { entries: CVEntry[] }) {
  return (
    <section id="recognition" className="px-16 py-24">
      <SectionHeading>Recognition</SectionHeading>
      {entries.map((entry) => (
        <RecognitionEntry key={entry.id} entry={entry} />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Skills
// ---------------------------------------------------------------------------

function SkillsSection({ entries }: { entries: CVEntry[] }) {
  const categories = entries.filter((e) => !e.parentEntryId);

  return (
    <section id="skills" className="px-16 py-24 bg-stone-50/50">
      <SectionHeading>Skills</SectionHeading>
      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id}>
            <h3 className="mb-3 text-xs font-semibold tracking-widest text-stone-400 uppercase">
              {cat.name}
            </h3>
            {cat.children.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cat.children.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : cat.description ? (
              <div className="flex flex-wrap gap-2">
                {cat.description.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {/* Flat entries (no parent) that aren't categories themselves */}
        {entries.filter((e) => !e.parentEntryId && !e.children.length && !categories.find((c) => c.id === e.id)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entries
              .filter((e) => !e.parentEntryId && !e.children.length)
              .map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
                >
                  {skill.name}
                </span>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Contact
// ---------------------------------------------------------------------------

function ContactSection({ entries }: { entries: CVEntry[] }) {
  const items = entries.filter((e) => !e.parentEntryId);

  return (
    <section id="contact" className="px-16 py-24">
      <SectionHeading>Contact</SectionHeading>
      <div className="grid gap-16 lg:grid-cols-2">
        {/* Info column */}
        <div>
          <p className="mb-8 text-base leading-relaxed text-stone-500">
            I&apos;m open to research collaborations, academic opportunities, and
            interesting projects. Feel free to reach out.
          </p>
          {items.length > 0 && (
            <div className="flex flex-col gap-4">
              {items.map((entry) => {
                const isEmail = /email|@/i.test(entry.name) || (entry.description ?? "").includes("@");
                const isPhone = /phone|tel|mobile/i.test(entry.name);
                const icon = isEmail ? <MailIcon /> : isPhone ? <PhoneIcon /> : <LocationIcon />;
                const href = isEmail
                  ? `mailto:${entry.description ?? ""}`
                  : isPhone
                  ? `tel:${entry.description ?? ""}`
                  : entry.link ?? undefined;
                return (
                  <ContactInfoItem
                    key={entry.id}
                    icon={icon}
                    label={entry.name}
                    value={entry.subtitle ?? entry.description ?? ""}
                    href={href}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Form column */}
        <ContactForm />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptySection({ id, title }: { id: string; title: string }) {
  return (
    <section id={id} className="px-16 py-24">
      <SectionHeading>{title}</SectionHeading>
      <p className="text-sm text-stone-400">No entries yet.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Page() {
  const cv = await getCVData();

  const about = cv.About ?? [];
  const contact = cv.Contact ?? [];
  const education = cv.Education ?? [];
  const research = cv.Research ?? [];
  const experience = cv.Experience ?? [];
  const recognition = cv.Recognition ?? [];
  const skills = cv.Skills ?? [];

  const bio =
    about.find((e) => !e.parentEntryId)?.description ??
    about[0]?.description ??
    null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-56 flex-1">
        <HomeSection bio={bio} />

        {about.length > 0 ? (
          <AboutSection entries={about} contactEntries={contact} />
        ) : (
          <EmptySection id="about" title="About" />
        )}

        {education.length > 0 ? (
          <EducationSection entries={education} />
        ) : (
          <EmptySection id="education" title="Education" />
        )}

        {research.length > 0 ? (
          <ResearchSection entries={research} />
        ) : (
          <EmptySection id="research" title="Research" />
        )}

        {experience.length > 0 ? (
          <ExperienceSection entries={experience} />
        ) : (
          <EmptySection id="experience" title="Experience" />
        )}

        {recognition.length > 0 ? (
          <RecognitionSection entries={recognition} />
        ) : (
          <EmptySection id="recognition" title="Recognition" />
        )}

        {skills.length > 0 ? (
          <SkillsSection entries={skills} />
        ) : (
          <EmptySection id="skills" title="Skills" />
        )}

        <ContactSection entries={contact} />
      </main>
    </div>
  );
}
