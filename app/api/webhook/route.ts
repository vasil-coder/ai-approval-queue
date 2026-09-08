import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { isActionType, type AiDraft, type DraftContent } from '@/lib/types'

const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const SYSTEM_PROMPT = `You are triaging inbound business events for human review. Given an event payload, draft the next appropriate action.

Return ONLY valid JSON matching this exact schema:
{
  "action_type": "reply_email" | "process_refund" | "book_appointment" | "escalate" | "no_action",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence explaining why",
  "draft_content": {
    "to": "email address if applicable",
    "subject": "if applicable",
    "body": "the drafted message or action description",
    "amount": null,
    "structured_fields": {}
  }
}

Do not include any text before or after the JSON.`

/**
 * Gemini occasionally answers 503 (overloaded) or 429 (free-tier rate limit).
 * Both clear on their own, so retry briefly rather than failing the request.
 * Kept short so a bad call never blocks the UI for long.
 */
async function generateWithRetry(
  ai: GoogleGenAI,
  request: Parameters<GoogleGenAI['models']['generateContent']>[0],
  attempts = 3
) {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await ai.models.generateContent(request)
    } catch (err) {
      lastError = err
      const message = err instanceof Error ? err.message : String(err)
      const transient =
        message.includes('429') ||
        message.includes('503') ||
        message.includes('500') ||
        /overloaded|high demand/i.test(message)
      if (!transient || i === attempts - 1) throw err
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)))
    }
  }
  throw lastError
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Best-effort fixed-window rate limit. Returns false when the caller is over
 * the limit.
 *
 * Read-then-write, so two concurrent requests from one IP can both slip
 * through at the boundary. Fine for a demo; the real fix is an atomic
 * increment in a Postgres function.
 */
async function withinRateLimit(
  supabase: SupabaseClient,
  ip: string
): Promise<boolean> {
  const now = new Date()

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('ip', ip)
    .maybeSingle()

  if (!existing) {
    await supabase
      .from('rate_limits')
      .insert({ ip, count: 1, window_start: now.toISOString() })
    return true
  }

  const windowAge = now.getTime() - new Date(existing.window_start).getTime()

  if (windowAge > RATE_LIMIT_WINDOW_MS) {
    await supabase
      .from('rate_limits')
      .update({ count: 1, window_start: now.toISOString() })
      .eq('ip', ip)
    return true
  }

  if (existing.count >= RATE_LIMIT_MAX) return false

  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('ip', ip)
  return true
}

/** Models occasionally wrap JSON in a markdown fence despite the MIME hint. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

/**
 * Coerce whatever the model returned into a shape the queue UI can render
 * without null-checking every field.
 */
function normalizeDraft(raw: unknown): AiDraft {
  const draft = (raw ?? {}) as Record<string, unknown>
  const content = (draft.draft_content ?? {}) as Record<string, unknown>

  const confidence = Number(draft.confidence)

  return {
    action_type: isActionType(draft.action_type) ? draft.action_type : 'escalate',
    confidence: Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : 0,
    reasoning:
      typeof draft.reasoning === 'string' && draft.reasoning.trim()
        ? draft.reasoning
        : 'No reasoning returned by the model.',
    draft_content: {
      to: typeof content.to === 'string' ? content.to : null,
      subject: typeof content.subject === 'string' ? content.subject : null,
      body: typeof content.body === 'string' ? content.body : '',
      amount:
        typeof content.amount === 'number' || typeof content.amount === 'string'
          ? (content.amount as number | string)
          : null,
      structured_fields:
        content.structured_fields &&
        typeof content.structured_fields === 'object'
          ? (content.structured_fields as DraftContent['structured_fields'])
          : {},
    },
  }
}

export async function POST(req: Request) {
  try {
    // 1. Parse the request body.
    let body: { source?: unknown; payload?: unknown }
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { source, payload } = body
    if (typeof source !== 'string' || !source || !payload) {
      return Response.json(
        { error: 'Body must be { source: string, payload: object }' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 2. Rate limit before spending a model call.
    const ip = clientIp(req)
    if (!(await withinRateLimit(supabase, ip))) {
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // 3. Ask Gemini for a draft action.
    // Without an explicit key the SDK silently falls back to Vertex AI +
    // Application Default Credentials, which fails with an unrelated-looking
    // "Could not load the default credentials" error. Fail clearly instead.
    if (!process.env.GEMINI_API_KEY) {
      console.error('[webhook] GEMINI_API_KEY is not set')
      return Response.json(
        {
          error: 'AI draft failed',
          details: 'GEMINI_API_KEY is not set on the server.',
        },
        { status: 500 }
      )
    }

    let rawText: string
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
      const response = await generateWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: JSON.stringify({ source, payload }),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          // Without this the model reasons before answering and the call takes
          // ~27s. Triage doesn't need it, and 'minimal' brings it under 2s.
          // Note: thinkingBudget (the older param) is rejected by this model.
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      })
      rawText = response.text ?? ''
    } catch (err) {
      console.error('[webhook] Gemini request failed:', err)
      return Response.json(
        {
          error: 'AI draft failed',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      )
    }

    // 4. Parse it.
    let draft: AiDraft
    try {
      draft = normalizeDraft(JSON.parse(stripFences(rawText)))
    } catch (err) {
      console.error('[webhook] Model returned unparseable JSON:', rawText)
      return Response.json(
        {
          error: 'AI draft failed',
          details: `Model did not return valid JSON: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
        { status: 500 }
      )
    }

    // 5. Record the event.
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({ source, payload })
      .select('id')
      .single()

    if (eventError || !event) {
      console.error('[webhook] events insert failed:', eventError)
      return Response.json({ error: 'DB write failed' }, { status: 500 })
    }

    // 6. Record the pending action.
    const { data: action, error: actionError } = await supabase
      .from('actions')
      .insert({
        event_id: event.id,
        action_type: draft.action_type,
        ai_draft: draft,
        status: 'pending',
      })
      .select('id')
      .single()

    if (actionError || !action) {
      console.error('[webhook] actions insert failed:', actionError)
      return Response.json({ error: 'DB write failed' }, { status: 500 })
    }

    // 7. Done.
    return Response.json({ ok: true, action_id: action.id })
  } catch (err) {
    console.error('[webhook] Unhandled error:', err)
    return Response.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
