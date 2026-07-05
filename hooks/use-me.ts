import { useQuery } from '@tanstack/react-query'
import { authClient } from '@/lib/api/authClient'
import { queryKeys } from '@/lib/query-keys'

export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authClient.me(),
    staleTime: 60_000,
    retry: false,
  })
}
