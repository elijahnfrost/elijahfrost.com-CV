# Elijah Frost CV Site

Personal website + resume/CV app built with Next.js.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Notion API (`@notionhq/client`)
- PDF rendering via `@react-pdf/renderer`

## What This App Does

- Renders the website from Notion database entries.
- Supports section ordering and nested entries (parent/child).
- Provides resume-specific content overrides.
- Exposes downloadable PDFs:
  - `GET /api/cv` for full CV PDF
  - `GET /resume/pdf` for resume PDF

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with:

```bash
NOTION_API_KEY=your_notion_integration_key
NOTION_DATABASE_ID=your_notion_database_id
```

3. Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build for production
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Notion Fields Used

Core fields expected in the Notion database:

- `Name`, `Section`, `Visible`, `Order`
- `Subtitle`, `Description`, `Bullets`, `Link`
- `Location`, `Start`, `End`, `Hours`
- `Parent Entry` (relation)
- `Resume` (checkbox)
- `Resume Description`, `Resume Bullets`
- `Section Description` (optional)

## Notes

- Content is fetched server-side from Notion.
- PDF templates live in `app/lib/pdf-templates.tsx`.
- Main web rendering lives in `app/page.tsx`.
