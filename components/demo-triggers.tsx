'use client'

import { useEffect, useState } from 'react'

const DEMO_EVENTS = [
  {
    key: 'sales',
    label: 'Sales inquiry',
    hint: 'A 200-person company asking about enterprise pricing',
    body: {
      source: 'web_form',
      payload: {
        from: 'sarah@acme.co',
        subject: 'Interested in enterprise plan',
        body: "Hi, we're a 200-person company evaluating vendors for Q4...",
      },
    },
  },
  {
    key: 'support',
    label: 'Support ticket',
    hint: 'Angry customer whose order never turned up',
    body: {
      source: 'support_form',
      payload: {
        from: 'mark@retail.io',
        subject: 'Order stuck',
        body: "My order #4471 shipped 3 weeks ago and still hasn't arrived. Getting frustrated.",
      },
    },
  },
  {
    key: 'refund',
    label: 'Refund request',
    hint: 'A $149 warranty claim on something that broke',
    body: {
      source: 'customer_portal',
      payload: {
        from: 'lisa@personal.com',
        order_id: 'ORD-8823',
        amount: 149.0,
        reason: 'Product broke on second use, still under warranty',
      },
    },
  },
] as const

type Toast = { message: string; tone: 'ok' | 'error' }

export function DemoTriggers() {
  const [pending, setPending] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  async function trigger(event: (typeof DEMO_EVENTS)[number]) {
    setPending(event.key)
    setToast(null)

    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.body),
      })

      if (!res.ok) {
        const detail = await res.text()
        setToast({
          message: `Webhook failed (${res.status}). ${detail.slice(0, 120)}`,
          tone: 'error',
        })
        return
      }

      setToast({
        message: 'Got it. The model is drafting now, check the queue.',
        tone: 'ok',
      })
    } catch {
      setToast({ message: 'Network error. Is the server running?', tone: 'error' })
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {DEMO_EVENTS.map((event) => (
          <button
            key={event.key}
            onClick={() => trigger(event)}
            disabled={pending !== null}
            className="group rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-accent disabled:opacity-50"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-display font-semibold">
                {pending === event.key ? 'Sending…' : event.label}
              </span>
              <span className="text-accent opacity-0 transition-opacity group-hover:opacity-100">
                &rarr;
              </span>
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">
              {event.hint}
            </span>
          </button>
        ))}
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed inset-x-4 bottom-4 z-50 rounded-2xl px-4 py-3 text-sm shadow-lg sm:left-auto sm:right-6 sm:max-w-md ${
            toast.tone === 'ok'
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
