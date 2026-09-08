# AI Approval Queue

A human-in-the-loop approval layer for AI-generated actions. An inbound event
arrives, an LLM drafts the next action with a visible confidence score and
stated reasoning, and **nothing executes until a person approves it**. Every
decision — approvals, rejections, and edits to the AI's draft — is written to an
append-only audit log.

The problem it solves: most teams won't let an LLM touch a customer, because one
bad send is expensive and untraceable. This is the trust and audit layer that
makes deploying AI viable in places where mistakes cost money.

## How it works

1. **Event arrives** — a form submission, support ticket, or portal request hits
   `POST /api/webhook`.
2. **AI drafts, nothing sends** — Gemini classifies the event into one of five
   action types and drafts the content. The row is written as `pending`.
3. **A human decides** — an admin reviews the original payload side by side with
   the draft, edits it if needed, then approves or rejects. Execution is
   simulated and logged, never actually sent.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Tailwind CSS v4**
- **Supabase** — Postgres, Auth, Row Level Security
- **Google Gemini** (`gemini-3.6-flash`) for drafting
- **Vercel** for hosting

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Required environment variables:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → Secret keys |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |

Then run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor,
sign up once to create an admin account, and optionally run
[`supabase/seed.sql`](supabase/seed.sql) for demo history.

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page with three demo event triggers |
| `/login`, `/signup` | Supabase email/password auth |
| `/admin/queue` | Pending actions, side-by-side review, approve/reject/edit |
| `/admin/audit` | Paginated decision log |
| `/api/webhook` | Public ingest endpoint, rate limited per IP |

## Security notes

- Row Level Security is on for every table. Admin reads and writes go through
  policies bound to the caller's session; the `profiles` select policy is load
  bearing, since every other policy subqueries it.
- The service-role client is used only in the webhook route, where inbound
  events arrive unauthenticated.
- Signup grants the `admin` role to anyone who registers. Disable new signups in
  Supabase Auth settings before exposing a deployment publicly.

## Deliberately out of scope

No real email sending, CRM writes, SMS, RAG, file uploads, or multi-tenancy.
Approved actions log what they *would* have done rather than doing it.
