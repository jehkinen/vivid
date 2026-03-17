'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface ListItem {
  id: string
  listId: string
  text: string
  checked: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  title: string
  slug: string
  visibility: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  items: ListItem[]
}

async function fetchLists(visibility?: string) {
  const url = visibility ? `/api/lists?visibility=${visibility}` : '/api/lists'
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch lists')
  }
  return response.json()
}

async function fetchList(id: string) {
  const response = await fetch(`/api/lists/${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch list')
  }
  return response.json()
}

async function createList(data: { title: string; slug: string; visibility?: string }) {
  const response = await fetch('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create list')
  }
  return response.json()
}

async function updateList(id: string, data: { title?: string; slug?: string; visibility?: string }) {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update list')
  }
  return response.json()
}

async function deleteList(id: string) {
  const response = await fetch(`/api/lists/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete list')
  }
  return response.json()
}

async function addListItem(listId: string, data: { text: string }) {
  const response = await fetch(`/api/lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add item')
  }
  return response.json()
}

async function updateListItem(listId: string, itemId: string, data: { text?: string; checked?: boolean }) {
  const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update item')
  }
  return response.json()
}

async function deleteListItem(listId: string, itemId: string) {
  const response = await fetch(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete item')
  }
  return response.json()
}

async function reorderListItems(listId: string, itemIds: string[]) {
  const response = await fetch(`/api/lists/${listId}/items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to reorder items')
  }
  return response.json()
}

export function useLists(visibility?: string) {
  return useQuery({
    queryKey: ['lists', visibility],
    queryFn: () => fetchLists(visibility),
  })
}

export function useList(id: string | null) {
  return useQuery({
    queryKey: ['list', id],
    queryFn: () => fetchList(id!),
    enabled: !!id,
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateList>[1] }) => updateList(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list', variables.id] })
      toast.success('List updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List deleted')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useAddListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: { text: string } }) => addListItem(listId, data),
    onSuccess: (newItem: ListItem, variables) => {
      queryClient.setQueriesData<List[]>(
        { queryKey: ['lists'] },
        (old) => {
          if (!old) return old
          return old.map((list) =>
            list.id === variables.listId
              ? { ...list, items: [...list.items, newItem] }
              : list
          )
        }
      )
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list', variables.listId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      data,
    }: {
      listId: string
      itemId: string
      data: { text?: string; checked?: boolean }
    }) => updateListItem(listId, itemId, data),
    onMutate: (variables) => {
      const previousLists = queryClient.getQueriesData<List[]>({ queryKey: ['lists'] })
      queryClient.setQueriesData<List[]>(
        { queryKey: ['lists'] },
        (old) => {
          if (!old) return old
          return old.map((list) =>
            list.id === variables.listId
              ? {
                  ...list,
                  items: list.items.map((it) =>
                    it.id === variables.itemId && variables.data.checked !== undefined
                      ? { ...it, checked: variables.data.checked! }
                      : it
                  ),
                }
              : list
          )
        }
      )
      return { previousLists }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(error.message)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list', variables.listId] })
    },
  })
}

export function useDeleteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) => deleteListItem(listId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list', variables.listId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useReorderListItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemIds }: { listId: string; itemIds: string[] }) => reorderListItems(listId, itemIds),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['lists'] })
        queryClient.invalidateQueries({ queryKey: ['list', data.id] })
      }
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
