'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { postsClient } from '@/lib/api/postsClient'
import type { GenerateCoverRequest, GenerateCoverMedia } from '@/types/ai'

export type GenerateCoverPhase = 'idle' | 'reading' | 'painting' | 'finishing' | 'done' | 'error'

export function useGenerateCover() {
  const [phase, setPhase] = useState<GenerateCoverPhase>('idle')

  const mutation = useMutation({
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

  const generate = async (postId: string, body: GenerateCoverRequest): Promise<GenerateCoverMedia | null> => {
    setPhase('reading')
    const readingTimer = window.setTimeout(() => {
      setPhase((current) => (current === 'reading' ? 'painting' : current))
    }, 2000)

    try {
      const result = await mutation.mutateAsync({ postId, body })
      return result.media
    } catch {
      return null
    } finally {
      window.clearTimeout(readingTimer)
    }
  }

  const reset = () => {
    setPhase('idle')
    mutation.reset()
  }

  return {
    generate,
    reset,
    phase,
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data?.media ?? null,
  }
}
