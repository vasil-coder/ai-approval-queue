# AI Approval Queue

**AI drafts the action. A human approves it before anything actually happens.**

## The 60-second pitch

Most businesses want AI to help with real work — replying to customers, processing refunds, booking appointments — but they don't trust it enough to let it act alone, and for good reason: one bad AI decision on a real customer is an incident, not a bug report. This project is the missing middle layer: AI drafts the action from an inbound event, but nothing executes until a person reviews and approves it in an admin queue. Every decision — approved, rejected, or edited — is logged with a full audit trail. It's the trust layer that lets a business actually turn AI automation on in places where a mistake would cost something.

## Live demo

**[ai-approval-queue.vercel.app](https://ai-approval-queue.vercel.app/)**

Click any of the 3 buttons on the landing page — sales inquiry, support ticket, or refund request — to trigger a simulated inbound event. You'll see a confirmation toast while Gemini drafts the corresponding action behind the scenes.

<!-- TODO: replace with real screenshot at public/screenshots/queue.png -->
![Admin queue screenshot](public/screenshots/queue.png)

The admin console — the approval queue and audit log — is fully built and running in production, protected by Supabase Auth with row-level security. Public signup is intentionally disabled to keep the shared demo data clean, the same way a real production system would gate admin access. I'll walk you through the admin side live, or watch the short recorded walkthrough below.

<!-- TODO: replace with real Loom link once recorded -->
[![Watch the 90-second walkthrough](public/screenshots/loom-thumbnail.png)](https://www.loom.com/share/PLACEHOLDER)

## How it works

1. An event comes in — a form submission, a support ticket, a webhook from any source
2. Gemini reads it and drafts the appropriate next action, with a confidence score and its reasoning
3. The draft lands in the admin queue as **pending** — nothing has happened yet
4. A human reviews it, edits if needed, and approves or rejects
5. The decision is logged to an immutable audit trail, along with what the approved action would execute

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (Postgres, Auth, Row-Level Security) |
| AI drafting | Google Gemini (`gemini-3.6-flash`) |
| Hosting | Vercel |

## Extensible by design

The queue, the schema, and the UI don't know or care what a "lead" or a "refund" is — they only know event → draft → approve → action. Swapping the workflow (lead qualification, appointment booking, refund review, support triage, outbound outreach review) means changing one prompt and what "approve" triggers, not rebuilding the system. This demo ships with 3 example workflows; the architecture supports any number more.

## Intentionally out of scope

Built to demonstrate the pattern cleanly, not as a finished product:

- Real email/SMS sending — approved actions are logged, not executed against live systems
- Real CRM writes (HubSpot, Salesforce, etc.)
- Multi-tenancy / team accounts
- File uploads or document processing
- RAG / knowledge base search

Each of these is a natural next step once the core pattern is validated for a specific use case.

## Local setup

```bash
git clone https://github.com/vasil-coder/ai-approval-queue.git
cd ai-approval-queue
npm install
```

Create `.env.local` with:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=


Run `supabase/schema.sql` in your Supabase project's SQL editor, then:

```bash
npm run dev
```

## Built by

Vasil Manavski — internal tools & AI-workflow automation.
Available for similar builds: [Upwork profile link] · [email]