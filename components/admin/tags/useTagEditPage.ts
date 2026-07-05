'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTag, useTags, useCreateTag, useUpdateTag, useDeleteTag, useMergeTag } from '@/hooks/api/use-tags'
import { slugify } from '@/lib/utils'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'

export function useTagEditPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const isNew = slug === 'new'

  const { data: tag, isLoading } = useTag(isNew ? '' : slug)
  const { data: allTags = [] } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()
  const mergeTag = useMergeTag()

  const [name, setName] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [color, setColor] = useState(() =>
    isNew ? TAG_DEFAULT_COLORS[Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)] : '#000000'
  )
  const [description, setDescription] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergePopoverOpen, setMergePopoverOpen] = useState(false)
  const slugSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (slugSyncTimerRef.current) clearTimeout(slugSyncTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (tag && !isNew) {
      setName(tag.name || '')
      setSlugValue(tag.slug || '')
      setColor(tag.color || '#000000')
      setDescription(tag.description || '')
    }
  }, [tag, isNew])

  const handleNameChange = useCallback((value: string) => {
    setName(value)
    if (slugSyncTimerRef.current) clearTimeout(slugSyncTimerRef.current)
    slugSyncTimerRef.current = setTimeout(() => {
      slugSyncTimerRef.current = null
      setSlugValue(slugify(value))
    }, 500)
  }, [])

  const handleSave = useCallback(() => {
    if (!name.trim() || !slugValue.trim()) return

    if (isNew) {
      createTag.mutate(
        { name, slug: slugValue, color },
        { onSuccess: () => router.push('/vivid/tags') }
      )
    } else {
      updateTag.mutate(
        { slug, data: { name, slug: slugValue, color, description } },
        { onSuccess: () => router.push('/vivid/tags') }
      )
    }
  }, [name, slugValue, color, description, isNew, createTag, updateTag, slug, router])

  const handleDelete = useCallback(() => {
    if (!tag) return
    deleteTag.mutate(slug, { onSuccess: () => router.push('/vivid/tags') })
    setDeleteDialogOpen(false)
  }, [tag, deleteTag, slug, router])

  const otherTags = (allTags as { id: string; name: string; slug: string }[]).filter(
    (t) => t.id !== tag?.id
  )

  const handleMerge = useCallback(() => {
    if (!tag || !mergeTargetId) return
    mergeTag.mutate(
      { sourceTagId: tag.id, targetTagId: mergeTargetId },
      {
        onSuccess: (data) => {
          setMergeDialogOpen(false)
          setMergeTargetId('')
          router.push(data?.targetTagSlug ? `/vivid/tags/${data.targetTagSlug}` : '/vivid/tags')
        },
      }
    )
  }, [tag, mergeTargetId, mergeTag, router])

  return {
    isNew,
    isLoading,
    tag,
    name,
    slugValue,
    color,
    description,
    deleteDialogOpen,
    mergeDialogOpen,
    mergeTargetId,
    mergePopoverOpen,
    otherTags,
    savePending: createTag.isPending || updateTag.isPending,
    deletePending: deleteTag.isPending,
    mergePending: mergeTag.isPending,
    setSlugValue,
    setColor,
    setDescription,
    setDeleteDialogOpen,
    setMergeDialogOpen,
    setMergeTargetId,
    setMergePopoverOpen,
    handleNameChange,
    handleSave,
    handleDelete,
    handleMerge,
  }
}
