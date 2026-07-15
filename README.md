# LeadFlow — CRM & Lead Management Dashboard

> Track leads, manage pipeline stages, and never miss a follow-up. AI-powered CRM for small businesses and freelancers — without the bloat of enterprise tools.

Built with [Next.js 16](https://nextjs.org), [Prisma 7](https://prisma.io), [PostgreSQL](https://postgresql.org) (via Docker), [Radix UI](https://radix-ui.com), and [Tailwind CSS v4](https://tailwindcss.com).

---

## ✨ Features

### 📋 Lead / Contact Management
- **Full CRUD** — Create, edit, and delete leads with rich profiles
- **Fields** — Name, company, email, phone, source (referral, website, cold outreach, etc.), tags
- **Deal Tracking** — Set deal value per lead with pipeline total value shown per stage
- **Notes** — Timestamped, freeform notes per lead with AI-powered summarization

### 🔄 Pipeline / Deal Tracking
- **Kanban Board** — 6 customizable stages: New → Contacted → Qualified → Proposal Sent → Won → Lost
- **Drag & Drop** — Move leads between stages using `dnd-kit` with smooth animations
- **Stage Totals** — See total deal value for each stage at a glance

### ⏰ Follow-Up & Reminders
- **Schedule Follow-ups** — Set due dates per lead with title and description
- **Dashboard Widget** — "Due today / Overdue / Upcoming" at-a-glance view
- **Inline Creation** — Create follow-ups directly from the Kanban card

### 📊 Analytics & Dashboard
- **Stats Overview** — Total leads, pipeline value, conversion rate, won deals
- **Bar Chart** — Lead distribution by pipeline stage
- **Pie Chart** — Lead breakdown by source
- **Line Chart** — Lead creation over time
- **Recent Activity** — Last 5 leads and follow-ups due today

### 🤖 AI Features (Differentiator)
- **Note Summarization** — Paste raw call/meeting notes → AI generates a clean summary + suggested next action
- **Follow-up Suggestions** — AI reviews lead context → suggests what to say/do next (API ready, UI pending)
- Powered by [Groq](https://groq.com) / Llama 3.3 70B — blazing fast inference

### 🎨 UI/UX
- **Dark Navy Theme** — Professional dark mode with navy-blue palette, matching portfolio design
- **Responsive** — Mobile-first with collapsible sidebar and hamburger menu
- **Skeleton Loading** — Animated placeholders while data loads
- **Toast Notifications** — Success/error/warning toasts via `sonner`
- **Light/Dark/System Theme** — Toggle from the sidebar user menu
- **Custom Scrollbar** — Styled to match the theme

---

## 🧱 Tech Stack

| Category          | Technology                                                     |
| ----------------- | -------------------------------------------------------------- |
| **Framework**     | [Next.js 16](https://nextjs.org) (App Router)                  |
| **Language**      | TypeScript 5                                                   |
| **UI Library**    | React 19                                                       |
| **Styling**       | Tailwind CSS 4 + `tw-animate-css`                             |
| **Components**    | Radix UI (Dialog, Select, Label, Slot, Dropdown Menu, Popover) |
| **Icons**         | Lucide React                                                   |
| **Charts**        | [Recharts](https://recharts.org) (Bar, Pie, Line)              |
| **Auth**          | [NextAuth.js v5](https://next-auth.js.org) (Credentials, JWT)  |
| **Database**      | PostgreSQL 17 (via Docker) + [Prisma 7](https://prisma.io) ORM |
| **Drag & Drop**   | [dnd-kit](https://dndkit.com)                                  |
| **AI**            | [Groq SDK](https://groq.com) (Llama 3.3 70B)                  |
| **Forms**         | React Hook Form (setup) + Zod validation                       |
| **State Mgmt**    | SWR (data fetching + caching)                                  |
| **Theme**         | `next-themes`                                                  |
| **Toasts**        | `sonner`                                                       |
| **Password**      | `bcryptjs`                                                     |
| **Fonts**         | Geist (Geist Sans + Geist Mono via Next.js font)              |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (required for Next.js 16)
- **Docker** (for PostgreSQL) or a remote PostgreSQL instance
- **(Optional)** [Groq API key](https://console.groq.com) for AI features

### 1. Clone & Install

```bash
cd leadflow
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
# Start the PostgreSQL container
docker compose up -d

# Verify it's running
docker ps
```

This starts PostgreSQL 17 on `localhost:5432` with the credentials from `docker-compose.yml`.

### 3. Environment Variables

The `.env` file is pre-configured for local development with Docker:

```env
DATABASE_URL="postgresql://leadflow:leadflow_secret@localhost:5432/leadflow"
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"
GROQ_API_KEY="your-groq-api-key-here"    # Optional — for AI features
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# (Optional) Seed with 120 realistic demo leads
npm run prisma:seed

# (Optional) Open Prisma Studio to inspect data
npm run prisma:studio
```

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

After seeding, login with:

| Field    | Value                |
| -------- | -------------------- |
| **Email**   | `demo@leadflow.app` |
| **Password** | `demo123456`        |

### Available Scripts

| Script                      | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run dev`               | Start the Next.js dev server             |
| `npm run build`             | Generate Prisma client + build Next.js   |
| `npm run start`             | Start the production server              |
| `npm run lint`              | Run ESLint                               |
| `npm run prisma:generate`   | Generate Prisma client                   |
| `npm run prisma:migrate`    | Run database migrations                  |
| `npm run prisma:studio`     | Open Prisma Studio (DB GUI)              |
| `npm run prisma:seed`       | Seed demo data (120 leads)               |

---

## 🏗️ Project Structure

```
leadflow/
├── prisma/
│   ├── schema.prisma           # Database schema (User, Lead, Note, FollowUp)
│   ├── config.ts               # Prisma v7 configuration
│   ├── migrations/             # Database migration files
│   └── seed.ts                 # Seed script (120 demo leads)
├── src/
│   ├── app/
│   │   ├── globals.css                  # Tailwind + CSS variables (dark navy theme)
│   │   ├── layout.tsx                  # Root layout with fonts & Providers
│   │   ├── page.tsx                    # Root page → redirects to /dashboard or /login
│   │   ├── login/page.tsx             # Sign-in form (email + password)
│   │   ├── register/page.tsx          # Registration form
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard layout wrapper (sidebar + content)
│   │   │   ├── dashboard/page.tsx     # Stats overview, follow-ups due, recent leads
│   │   │   ├── leads/page.tsx         # Lead table with search, filter, sort
│   │   │   ├── pipeline/page.tsx      # Kanban board with drag-and-drop
│   │   │   ├── analytics/page.tsx     # Charts (bar, pie, line) with Recharts
│   │   │   └── settings/page.tsx      # Account profile info
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts    # NextAuth handler
│   │       │   └── register/route.ts         # User registration
│   │       ├── leads/
│   │       │   ├── route.ts                  # GET (list), POST (create lead)
│   │       │   └── [id]/route.ts             # GET, PATCH, DELETE lead
│   │       ├── notes/route.ts               # POST (create note with AI summary)
│   │       ├── pipeline/move/route.ts       # POST (move lead between stages)
│   │       ├── dashboard/route.ts           # GET (aggregated dashboard data)
│   │       ├── follow-ups/route.ts          # GET, POST, PATCH, DELETE
│   │       └── ai/
│   │           ├── summarize/route.ts       # POST (AI note summarization)
│   │           └── suggest/route.ts         # POST (AI follow-up suggestions)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-layout.tsx  # Dashboard shell with mobile sidebar toggle
│   │   │   └── sidebar.tsx           # Sidebar nav with theme switcher + user menu
│   │   ├── leads/
│   │   │   ├── lead-form.tsx         # Lead creation/editing form
│   │   │   ├── lead-card.tsx         # Kanban card with inline dialogs (notes, follow-ups)
│   │   │   └── kanban-board.tsx      # Drag-and-drop Kanban with dnd-kit
│   │   └── ui/
│   │       ├── badge.tsx, button.tsx, card.tsx
│   │       ├── dialog.tsx, dropdown-menu.tsx
│   │       ├── input.tsx, label.tsx, textarea.tsx
│   │       ├── select.tsx, separator.tsx
│   │       ├── skeleton.tsx, popover.tsx
│   │       └── ...
│   └── lib/
│       ├── auth.ts                   # NextAuth config (Credentials + PrismaAdapter)
│       ├── auth.config.ts            # Shared auth config (JWT, pages, callbacks)
│       ├── prisma.ts                 # Prisma client singleton (with pg adapter)
│       ├── providers.tsx             # Client providers (Session, Theme, Toaster)
│       ├── utils.ts                  # Helpers: cn(), formatCurrency(), formatDate(), etc.
│       └── validation.ts             # Zod schemas for all API endpoints
├── middleware.ts                     # Auth middleware — protects dashboard routes
├── prisma.config.ts                  # Prisma v7 configuration
├── next.config.ts                    # Next.js configuration
├── docker-compose.yml                # PostgreSQL 17 container
├── postcss.config.mjs                # PostCSS config (Tailwind)
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies & scripts
```

---

## 🔌 API Routes

All routes (except auth and registration) require authentication — they validate the session via `auth()` and return `401` if unauthorized.

| Route                              | Method   | Description                                     |
| ---------------------------------- | -------- | ----------------------------------------------- |
| **Auth**                           |          |                                                 |
| `/api/auth/register`               | `POST`   | Register a new user (name, email, password)      |
| `/api/auth/[...nextauth]`          | `GET/POST` | NextAuth handler (login, session, signout)     |
|                                    |          |                                                 |
| **Leads**                          |          |                                                 |
| `/api/leads`                       | `GET`    | List all leads for the authenticated user       |
| `/api/leads`                       | `POST`   | Create a new lead                               |
| `/api/leads/[id]`                  | `GET`    | Get a single lead with notes and follow-ups     |
| `/api/leads/[id]`                  | `PATCH`  | Update a lead                                   |
| `/api/leads/[id]`                  | `DELETE` | Delete a lead                                   |
|                                    |          |                                                 |
| **Notes**                          |          |                                                 |
| `/api/notes`                       | `POST`   | Create a note (supports optional AI summary)    |
|                                    |          |                                                 |
| **Pipeline**                       |          |                                                 |
| `/api/pipeline/move`               | `POST`   | Move a lead between stages (drag-and-drop)      |
|                                    |          |                                                 |
| **Dashboard**                      |          |                                                 |
| `/api/dashboard`                   | `GET`    | Aggregated stats, stage/source distribution,    |
|                                    |          | lead timeline, recent leads, follow-ups due     |
|                                    |          |                                                 |
| **Follow-ups**                     |          |                                                 |
| `/api/follow-ups`                  | `GET`    | List all follow-ups (sorted by due date)        |
| `/api/follow-ups`                  | `POST`   | Create a follow-up                              |
| `/api/follow-ups?id=X`             | `PATCH`  | Update a follow-up (e.g., mark complete)        |
| `/api/follow-ups?id=X`             | `DELETE` | Delete a follow-up                              |
|                                    |          |                                                 |
| **AI**                             |          |                                                 |
| `/api/ai/summarize`                | `POST`   | Summarize raw notes using Groq/Llama 3.3       |
| `/api/ai/suggest`                  | `POST`   | Get AI-powered follow-up suggestions            |

---

## 🖥️ Pages & Routes

| Path           | Description                                       | Auth Required |
| -------------- | ------------------------------------------------- | ------------- |
| `/`            | Redirects to `/dashboard` or `/login`              | No            |
| `/login`       | Sign-in page (email + password)                   | No            |
| `/register`    | Create an account                                 | No            |
| `/dashboard`   | Main dashboard with stats, follow-ups, recent leads | Yes           |
| `/leads`       | Lead table with search, filter, and sort           | Yes           |
| `/pipeline`    | Kanban board with drag-and-drop                   | Yes           |
| `/analytics`   | Charts: stage distribution, source breakdown, timeline | Yes        |
| `/settings`    | Account profile info                              | Yes           |

---

## 🧠 AI Features

### Note Summarization
1. Open any lead card on the Kanban board
2. Click the note icon (💬) to open the note dialog
3. Paste raw call/meeting notes into the text area
4. Click **"AI Summarize"** to get a clean summary + suggested next action
5. Save the note — the AI summary is preserved alongside the raw content

### Follow-up Suggestions (API Ready)
The `/api/ai/suggest` endpoint takes lead name, stage, notes, and days since last contact and returns an actionable follow-up suggestion. Wire it into any UI component by:

```ts
const res = await fetch("/api/ai/suggest", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    leadName: "Jane Smith",
    leadStage: "QUALIFIED",
    notes: "Discussed pricing...",
    daysSinceLastContact: 5,
  }),
})
```

### Setup
Set `GROQ_API_KEY` in your `.env` file. Get a free API key at [console.groq.com](https://console.groq.com). The free tier is generous and sufficient for development and demo.

---

## 🎨 Theming

LeadFlow supports **light**, **dark**, and **system** themes via `next-themes`. The theme is persisted in local storage and toggled from the sidebar user menu.

CSS custom properties use the `oklch()` color space for vibrant, perceptually-uniform colors. The **dark navy theme** (`--background: oklch(0.12 0.008 260)`) provides a professional, easy-on-the-eyes experience ideal for sales workflows.

---

## 🧩 Architecture Decisions

- **Server-side data** fetched via **SWR** with automatic revalidation and caching
- **Drag-and-drop** uses **dnd-kit** with `PointerSensor` (8px activation distance to prevent accidental drags)
- **AI integration** uses **Groq's Llama 3.3 70B** for blazing-fast inference (vs. OpenAI's GPT-4)
- **Prisma v7** with driver adapters for direct PostgreSQL connection via the `pg` library
- **Database in Docker** — PostgreSQL runs in a container, data persists in a named volume
- **Single-user mode** — authentication supports a single user with optional team expansion
- **Mobile-first** — sidebar collapses off-screen on mobile with backdrop overlay; Kanban board scrolls horizontally

---

## 🗄️ Database Schema

Key models defined in `prisma/schema.prisma`:

| Model              | Description                                        |
| ------------------ | -------------------------------------------------- |
| **User**           | User accounts with email/password auth             |
| **Account**        | NextAuth account linking (for future OAuth)        |
| **Session**        | NextAuth sessions (JWT strategy currently used)    |
| **VerificationToken** | NextAuth verification tokens                    |
| **Lead**           | Contacts/prospects with name, company, source, tags, deal value, stage |
| **Note**           | Timestamped notes per lead with optional AI summary |
| **FollowUp**       | Scheduled reminders per lead with due date and completion status |

---

## 🐳 Docker

PostgreSQL runs in a Docker container:

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Wipe data and start fresh
docker compose down -v && docker compose up -d
```

The database is configured with:
- **Port:** 5432
- **User:** leadflow
- **Password:** leadflow_secret
- **Database:** leadflow
- **Image:** `postgres:17-alpine` (lightweight, ~200MB)

A health check ensures the container is ready before accepting connections.

---

## 🤝 Contributing

This is a portfolio project. Feel free to fork, experiment, and adapt for your own use.

---

## 📝 License

Private — internal use. Built as a portfolio piece to demonstrate full-stack development with Next.js, Prisma, PostgreSQL, and AI integration.
