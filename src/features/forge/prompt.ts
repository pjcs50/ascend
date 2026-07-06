import type { TriageResult } from './types'

// Builds the prompt the user copies into ANY Claude surface they already pay for
// (claude.ai, Claude Code, Cowork). Claude returns JSON that the app parses back
// into a battle-plan — the durable, key-free, device-agnostic engine.
export function buildTriagePrompt(rawText: string): string {
  return `I use a personal productivity app called Ascend. I captured this raw thought and want to act on it by leveraging Claude. Analyze it and design my plan.

Captured item:
"""
${rawText}
"""

Classify it, then design exactly how I should use Claude to explore or accomplish it — abuse every relevant Claude capability (Claude.ai chat, Claude Code, Cowork, Projects, Deep Research, skills, MCP).

Return ONLY a raw JSON object — no prose, no markdown fences — with exactly these keys:
{
  "category": "one of: task, idea, project, research, question, habit, note, person",
  "destination": "best Ascend module for it (Habits, People, Journal, Tasks, Knowledge Base) or Inbox",
  "recommended_surface": "the single best Claude tool to use",
  "rationale": "one sentence on why that surface fits",
  "effort_estimate": "one of: quick win, an afternoon, a deep project",
  "next_action": "the one concrete first step to take right now",
  "prompts": [ { "surface": "which Claude surface", "prompt": "an exact, copy-paste-ready prompt" } ]
}

Give 1 to 4 step-wise prompts in order.`
}

// Extracts and validates the JSON battle-plan from a pasted Claude response.
// Tolerant of markdown fences / surrounding prose — grabs the outermost { ... }.
export function parseTriageResponse(text: string): { result: TriageResult | null; error: string | null } {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    return { result: null, error: "Couldn't find a JSON object in that response." }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return { result: null, error: 'That response was not valid JSON. Paste the full JSON Claude returned.' }
  }
  const p = parsed as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  const prompts = Array.isArray(p.prompts)
    ? p.prompts
        .map((x) => {
          const o = x as Record<string, unknown>
          return { surface: str(o.surface), prompt: str(o.prompt) }
        })
        .filter((x) => x.prompt.trim())
    : []
  const result: TriageResult = {
    category: str(p.category) || 'note',
    destination: str(p.destination) || 'Inbox',
    recommended_surface: str(p.recommended_surface),
    rationale: str(p.rationale),
    effort_estimate: str(p.effort_estimate),
    next_action: str(p.next_action),
    prompts,
  }
  return { result, error: null }
}
