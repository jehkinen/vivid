'use client'

import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { postsClient } from '@/lib/api/postsClient'
import type { GenerateCoverRequest, GenerateCoverResponse } from '@/types/ai'

export type GenerateCoverPhase = 'idle' | 'reading' | 'painting' | 'finishing' | 'done' | 'error'

export function useGenerateCover() {
  const [phase, setPhase] = useState<GenerateCoverPhase>('idle')

  const { mutateAsync, reset: resetMutation, isPending, error, data } = useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: GenerateCoverRequest }) =>
      postsClient.generateCover(postId, body),
    onMutate: () => {
      setPhase('reading')
    },
    onSuccess: () => {
      setPhase('finishing')
      window.setTimeout(() => setPhase('done'), 400)
    },
    onError: () => {
      setPhase('error')
    },
  })

  const reset = useCallback(() => {
    setPhase('idle')
    resetMutation()
  }, [resetMutation])

  const generate = useCallback(
    async (postId: string, body: GenerateCoverRequest): Promise<GenerateCoverResponse | null> => {
      setPhase('reading')
      const readingTimer = window.setTimeout(() => {
        setPhase((current) => (current === 'reading' ? 'painting' : current))
      }, 2000)

      try {
        return await mutateAsync({ postId, body })
      } catch {
        return null
      } finally {
        window.clearTimeout(readingTimer)
      }
    },
    [mutateAsync]
  )

  return {
    generate,
    reset,
    phase,
    isPending,
    error,
    data,
  }
}
