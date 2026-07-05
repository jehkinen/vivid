import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mediaClient } from '@/lib/api/mediaClient'
import { queryKeys } from '@/lib/query-keys'

export function useBulkDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => mediaClient.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all })
      const deletedCount = result.deleted.length
      const blockedCount = result.blocked.length
      if (deletedCount > 0 && blockedCount === 0) {
        toast.success(deletedCount === 1 ? 'File deleted' : `${deletedCount} files deleted`)
      } else if (deletedCount > 0 && blockedCount > 0) {
        toast.success(`${deletedCount} deleted, ${blockedCount} skipped (in use)`)
      } else if (blockedCount > 0) {
        toast.error('Selected files are in use and were not deleted')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete files')
    },
  })
}
