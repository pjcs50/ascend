export type ForgeStatus = 'new' | 'triaged' | 'in_progress' | 'done' | 'archived'

export interface ForgeItem {
  id: string
  user_id: string
  raw_text: string
  status: ForgeStatus
  ai_category: string | null
  ai_destination: string | null
  recommended_surface: string | null
  rationale: string | null
  effort_estimate: string | null
  next_action: string | null
  triaged_at: string | null
  created_at: string
}

export interface ForgePrompt {
  id: string
  user_id: string
  forge_item_id: string
  step_order: number
  surface: string | null
  prompt_text: string
  created_at: string
}

// The parsed shape a Claude triage response must produce.
export interface TriageResult {
  category: string
  destination: string
  recommended_surface: string
  rationale: string
  effort_estimate: string
  next_action: string
  prompts: { surface: string; prompt: string }[]
}
