'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listsClient, type ListDto, type ListItemDto } from '@/lib/api/listsClient'
import { queryKeys } from '@/lib/query-keys'

export type ListItem = ListItemDto

export type List = ListDto

async function fetchLists(visibility?: string) {
  return listsClient.list(visibility)
}

async function fetchList(id: string) {
  return listsClient.get(id)
}

async function createList(data: { title: string; slug: string; visibility?: string }) {
  return listsClient.create(data)
}

async function updateList(id: string, data: { title?: string; slug?: string; visibility?: string }) {
  return listsClient.update(id, data)
}

async function deleteList(id: string) {
  return listsClient.delete(id)
}

async function addListItem(listId: string, data: { text: string }) {
  return listsClient.addItem(listId, data)
}

async function updateListItem(listId: string, itemId: string, data: { text?: string; checked?: boolean }) {
  return listsClient.updateItem(listId, itemId, data)
}

export function useLists(visibility?: string) {
  return useQuery({
    queryKey: queryKeys.lists.list(visibility),
    queryFn: () => fetchLists(visibility),
  })
}

export function useList(id: string | null) {
  return useQuery({
    queryKey: queryKeys.lists.detail(id!),
    queryFn: () => fetchList(id!),
    enabled: !!id,
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(variables.id) })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
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
        { queryKey: queryKeys.lists.all },
        (old) => {
          if (!old) return old
          return old.map((list) =>
            list.id === variables.listId
              ? { ...list, items: [...list.items, newItem] }
              : list
          )
        }
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(variables.listId) })
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
      const previousLists = queryClient.getQueriesData<List[]>({ queryKey: queryKeys.lists.all })
      queryClient.setQueriesData<List[]>(
        { queryKey: queryKeys.lists.all },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(variables.listId) })
    },
  })
}

export function useDeleteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      listsClient.deleteItem(listId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(variables.listId) })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useReorderListItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemIds }: { listId: string; itemIds: string[] }) =>
      listsClient.reorderItems(listId, itemIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(variables.listId) })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
