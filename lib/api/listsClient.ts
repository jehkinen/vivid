import { apiRequest } from './request'
import type { ListDto, ListItemDto } from '@/types/lists'

export type { ListDto, ListItemDto }

export const listsClient = {
  list(visibility?: string) {
    return apiRequest<ListDto[]>({
      path: '/api/lists',
      query: {
        visibility,
      },
    })
  },

  get(id: string) {
    return apiRequest<ListDto>({
      path: `/api/lists/${id}`,
    })
  },

  create(data: { title: string; slug: string; visibility?: string }) {
    return apiRequest<ListDto>({
      path: '/api/lists',
      method: 'POST',
      body: data,
    })
  },

  update(id: string, data: { title?: string; slug?: string; visibility?: string }) {
    return apiRequest<ListDto>({
      path: `/api/lists/${id}`,
      method: 'PATCH',
      body: data,
    })
  },

  delete(id: string) {
    return apiRequest<void>({
      path: `/api/lists/${id}`,
      method: 'DELETE',
    })
  },

  addItem(listId: string, data: { text: string }) {
    return apiRequest<ListItemDto>({
      path: `/api/lists/${listId}/items`,
      method: 'POST',
      body: data,
    })
  },

  updateItem(listId: string, itemId: string, data: { text?: string; checked?: boolean }) {
    return apiRequest<ListItemDto>({
      path: `/api/lists/${listId}/items/${itemId}`,
      method: 'PATCH',
      body: data,
    })
  },

  deleteItem(listId: string, itemId: string) {
    return apiRequest<void>({
      path: `/api/lists/${listId}/items/${itemId}`,
      method: 'DELETE',
    })
  },

  reorderItems(listId: string, itemIds: string[]) {
    return apiRequest<void>({
      path: `/api/lists/${listId}/items`,
      method: 'PATCH',
      body: { itemIds },
    })
  },
}

