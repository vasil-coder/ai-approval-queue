# AI Approval Queue

**Demo video: <!-- paste your video link here -->**

Runs locally. Setup is below and takes a couple of minutes if you already have
a Supabase project and a Gemini API key.

A human-in-the-loop approval layer for AI actions. Something comes in, a model
drafts a response, and nothing at all happens until a person signs off on it.
Every approval, edit and rejection gets written to an audit log.

The problem it solves: most teams won't let a model talk to their customers,
and they have a point. One bad send costs money and afterwards nobody can
explain what happened. This is the layer that makes it safe to try.

## How it works

1. **Something comes in.** A form submission, support ticket, or refund request
   hits `POST /api/webhook`.
2. **The model writes a draft.** Gemini picks one of five action types, drafts
   the content, scores its own confidence and says why. The row is saved as
   `pending`.
3. **You decide.** The admin queue shows the original payload next to the
   draft. Edit it, approve it, or throw it out. Execution is simulated and
   logged, never actually sent.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Tailwind CSS v4**
- **Supabase** for Postgres, Auth and Row Level Security
- **Google Gemini** (`gemini-3.6-flash`) for the drafting
- **Vercel** for hosting

## Running it locally

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Environment variables you'll need:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > Secret keys |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |

Then run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL
editor, sign up once to create an admin account, and optionally run
[`supabase/seed.sql`](supabase/seed.sql) if you want some history in the log.

## Routes

| Route | What it does |
|---|---|
| `/` | Landing page with three demo event triggers |
| `/login`, `/signup` | Supabase email and password auth |
| `/admin/queue` | Pending actions, side by side review, approve/reject/edit |
| `/admin/audit` | Paginated decision log |
| `/api/webhook` | Public ingest endpoint, rate limited per IP |

## A few notes on the build

Row Level Security is on for every table. Admin reads and writes go through
policies bound to the caller's session. The `profiles` select policy is doing
more work than it looks like: every other policy subqueries that table as the
calling user, so without it RLS quietly denies everything and the queue just
sits there empty.

The service-role client only gets used in the webhook route, where events
arrive with no session attached.

Signup grants the `admin` role to anyone who registers, so turn off new signups
in the Supabase Auth settings before putting a deployment anywhere public.

## Deliberately left out

No real email sending, CRM writes, SMS, RAG, file uploads or multi-tenancy.
Approved actions log what they would have done instead of doing it.
