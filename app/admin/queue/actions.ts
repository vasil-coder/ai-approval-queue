'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AiDraft } from '@/lib/types'

export type ActionResult = { ok: true } | { ok: false; error: string }

type Decision = 'approved' | 'rejected'

/**
 * What executing this action *would* do. Nothing is actually sent — this
 * string is written to the audit log so the demo shows the full loop.
 */
function describeExecution(draft: AiDraft, body: string): string {
  const { to, subject, amount } = draft.draft_content

  switch (draft.action_type) {
    case 'reply_email':
      return `Would send email to ${to ?? 'unknown recipient'}${
        subject ? ` with subject "${subject}"` : ''
      } (${body.length} chars)`
    case 'process_refund':
      return `Would process refund of $${amount ?? '0.00'} to ${to ?? 'customer'}`
    case 'book_appointment':
      return `Would book appointment for ${to ?? 'customer'}`
    case 'escalate':
      return 'Would escalate to a human specialist'
    case 'no_action':
      return 'No action taken — closed without response'
    default:
      return 'Would execute action'
  }
}

export async function decideAction(
  actionId: string,
  decision: Decision
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { data: action, error: fetchError } = await supabase
    .from('actions')
    .select('id, action_type, ai_draft, human_edits, status')
    .eq('id', actionId)
    .single()

  if (fetchError || !action) {
    return { ok: false, error: fetchError?.message ?? 'Action not found.' }
  }
  if (action.status !== 'pending') {
    return { ok: false, error: `Already ${action.status}.` }
  }

  const { error: updateError } = await supabase
    .from('actions')
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      approver_id: user.id,
    })
    .eq('id', actionId)
    .eq('status', 'pending') // no-op if someone else decided it first

  if (updateError) return { ok: false, error: updateError.message }

  const draft = action.ai_draft as AiDraft
  const edits = action.human_edits as { body?: string } | null
  const finalBody = edits?.body ?? draft.draft_content.body ?? ''

  // 1. The human decision.
  const { error: auditError } = await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: decision === 'approved' ? 'approve_action' : 'reject_action',
    entity: 'action',
    entity_id: actionId,
    metadata: {
      action_type: action.action_type,
      ai_confidence: draft.confidence,
      was_edited: Boolean(edits?.body),
    },
  })
  if (auditError) return { ok: false, error: auditError.message }

  // 2. The simulated side effect. Approvals only.
  if (decision === 'approved') {
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      action: 'simulate_execution',
      entity: 'action',
      entity_id: actionId,
      metadata: {
        simulated: describeExecution(draft, finalBody),
        dry_run: true,
      },
    })
  }

  revalidatePath('/admin/queue')
  revalidatePath('/admin/audit')
  return { ok: true }
}

export async function saveEdits(
  actionId: string,
  body: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { error: updateError } = await supabase
    .from('actions')
    .update({ human_edits: { body, edited_at: new Date().toISOString() } })
    .eq('id', actionId)

  if (updateError) return { ok: false, error: updateError.message }

  // An edit is a human decision too — the audit log should show that a person
  // changed what the AI wrote, not just that they approved it.
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'edit_draft',
    entity: 'action',
    entity_id: actionId,
    metadata: { new_length: body.length },
  })

  revalidatePath('/admin/queue')
  revalidatePath('/admin/audit')
  return { ok: true }
}
