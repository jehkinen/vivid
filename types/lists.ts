export interface ListItemDto {
  id: string
  listId: string
  text: string
  checked: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ListDto {
  id: string
  title: string
  slug: string
  visibility: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  items: ListItemDto[]
}
