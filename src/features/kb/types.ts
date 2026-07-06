export interface KbPage {
  id: string
  user_id: string
  parent_id: string | null
  title: string
  content: string | null
  tags: string[]
  icon: string | null
  sort_order: number
  created_at: string
}

export type KbPagePatch = Partial<Pick<KbPage, 'title' | 'content' | 'tags' | 'icon' | 'parent_id'>>
