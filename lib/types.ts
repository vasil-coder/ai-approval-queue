export const ACTION_TYPES = [
  'reply_email',
  'process_refund',
  'book_appointment',
  'escalate',
  'no_action',
] as const

export type ActionType = (typeof ACTION_TYPES)[number]

export type DraftContent = {
  to?: string | null
  subject?: string | null
  body?: string | null
  amount?: number | string | null
  structured_fields?: Record<string, unknown>
}

export type AiDraft = {
  action_type: ActionType
  confidence: number
  reasoning: string
  draft_content: DraftContent
}

export function isActionType(value: unknown): value is ActionType {
  return ACTION_TYPES.includes(value as ActionType)
}

export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executed'

export type QueueEvent = {
  id: string
  source: string
  payload: Record<string, unknown>
  received_at: string | null
}

export type HumanEdits = { body?: string } | null

export type QueueAction = {
  id: string
  action_type: string | null
  ai_draft: AiDraft
  status: ActionStatus
  created_at: string | null
  human_edits: HumanEdits
  event: QueueEvent | null
}
