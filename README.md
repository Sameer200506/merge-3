# merge 3 (Startup / agency operating system)

A second iteration of the StartupOS concept: one dashboard for an agency or
startup to run customers, sales pipeline, delivery, time and payouts. Package
name: `startupos`.

## Modules

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page with feature overview |
| `/dashboard` | KPI overview |
| `/customers`, `/customers/[id]` | Customer directory and detail |
| `/pipeline` | Deals / sales pipeline |
| `/projects`, `/projects/[id]` | Delivery projects |
| `/tasks` | Task board |
| `/time` | Time tracking |
| `/payouts` | Payout tracking |
| `/activity` | Activity feed |
| `/notifications` | Notifications |
| `/search` | Global search |
| `/settings` | Workspace settings |

## Stack

Next.js 15 (App Router) + React 19, TypeScript, Tailwind CSS, shadcn-style
Radix components, TanStack Query/Table, `@dnd-kit` drag-and-drop,
`recharts`, `date-fns`, `geist` font.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build
npm start
npm run lint
npm run typecheck
```

## Data

`src/lib/queries.ts` provides the data access layer used by the pages; it
currently reads the seeded/in-memory dataset, so the app runs without a
database. Swap those functions for real queries when connecting a backend.
`src/app/actions.ts` holds the server actions.
