'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LexicalEditor as LexicalEditorInstance } from 'lexical'
import { useParams, useRouter } from 'next/navigation'
import { extractPlaintextFromLexical } from '@/lib/lexical-utils'
import { POST_STATUS, POST_VISIBILITY, type PostStatus, type PostVisibility } from '@/shared/constants'
import { usePost, useCreatePost, useUpdatePost, useSoftDeletePost } from '@/hooks/api/use-posts'
import { useTags, useCreateTag } from '@/hooks/api/use-tags'
import { slugify } from '@/lib/utils'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'
import { usePostSettings } from '@/components/providers/PostSettingsProvider'
import type { PostEditorFeaturedMedia } from '@/types/post-editor'

const AUTOSAVE_DELAY_MS = 3000

export function usePostEditorPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const isNew = postId === 'new'
  const { open: settingsOpen, setOpen: setSettingsOpen } = usePostSettings()

  const { data: post, isLoading } = usePost(isNew ? '' : postId)
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const softDeletePost = useSoftDeletePost()
  const { data: tags = [] } = useTags()
  const createTagMutation = useCreateTag()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [lexical, setLexical] = useState<string | null>(null)
  const [status, setStatus] = useState<PostStatus>(POST_STATUS.DRAFT)
  const [visibility, setVisibility] = useState<PostVisibility>(POST_VISIBILITY.PUBLIC)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [featuredMedia, setFeaturedMedia] = useState<PostEditorFeaturedMedia>(null)
  const [hasSavedOnce, setHasSavedOnce] = useState(false)
  const [editor, setEditor] = useState<LexicalEditorInstance | null>(null)
  const [hasUserTyped, setHasUserTyped] = useState(false)
  const [, setEditorLoaded] = useState(isNew)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const initialLoadCompleteRef = useRef(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolvedIdRef = useRef<string>(postId)
  const ignoreNextAutosaveCount = useRef(0)
  const ignoreLexicalChangeUntil = useRef(0)
  const lastSyncedPostIdRef = useRef<string | null>(null)
  const prevPostIdRef = useRef<string>(postId)
  const slugManuallyEditedRef = useRef(false)
  const lastLexicalContentRef = useRef<string | null>(null)
  const [mobileBarCollapsed, setMobileBarCollapsed] = useState(false)
  const [toolbarOpen, setToolbarOpen] = useState(false)

  useEffect(() => {
    if (postId !== prevPostIdRef.current) {
      prevPostIdRef.current = postId
      if (postId && postId !== 'new') {
        lastSyncedPostIdRef.current = null
      }
    }
  }, [postId])

  useEffect(() => {
    if (!post || isNew) return
    if (lastSyncedPostIdRef.current === post.id) return

    lastSyncedPostIdRef.current = post.id
    const wasAlreadyLoaded = initialLoadCompleteRef.current

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current)
      autosaveTimer.current = null
    }
    ignoreLexicalChangeUntil.current = Date.now() + 500
    slugManuallyEditedRef.current = false
    setTitle(post.title || '')
    setSlug(post.slug || '')
    const lexicalVal = post.lexical ?? null
    setLexical(lexicalVal)
    lastLexicalContentRef.current = lexicalVal
    setStatus((post.status as PostStatus) || POST_STATUS.DRAFT)
    setVisibility(
      post.visibility === POST_VISIBILITY.PUBLIC || post.visibility === POST_VISIBILITY.PRIVATE
        ? (post.visibility as PostVisibility)
        : POST_VISIBILITY.PUBLIC
    )
    setPublishedAt(post.publishedAt || null)
    setSelectedTagIds(post.tags?.map((t: { tag: { id: string } }) => t.tag.id) || [])
    setFeaturedMedia((post.featuredMedia as PostEditorFeaturedMedia) || null)
    setHasSavedOnce(true)
    resolvedIdRef.current = post.id
    ignoreNextAutosaveCount.current = 5
    setHasUserTyped(false)

    if (!wasAlreadyLoaded) {
      setEditorLoaded(false)
      initialLoadCompleteRef.current = false

      if (!post.lexical || post.lexical.trim() === '') {
        setTimeout(() => {
          initialLoadCompleteRef.current = true
          setEditorLoaded(true)
        }, 300)
      }
    }
  }, [post, isNew])

  useEffect(() => {
    if (isNew) {
      setEditorLoaded(true)
      initialLoadCompleteRef.current = true
    }
  }, [isNew])

  const handleStatusChange = useCallback(
    (newStatus: PostStatus) => {
      const id = resolvedIdRef.current
      if (!id || id === 'new') return
      const prevStatus = status
      const prevPublishedAt = publishedAt
      setStatus(newStatus)
      if (newStatus === POST_STATUS.PUBLISHED && !publishedAt) {
        setPublishedAt(new Date().toISOString())
      }
      updatePost.mutate(
        { id, data: { status: newStatus }, silent: true },
        {
          onSuccess: () => {
            if (postId === 'new') {
              router.replace(`/vivid/editor/post/${id}`)
            }
          },
          onError: () => {
            setStatus(prevStatus)
            if (newStatus === POST_STATUS.PUBLISHED && !prevPublishedAt) setPublishedAt(prevPublishedAt)
          },
        }
      )
    },
    [status, publishedAt, updatePost, postId, router]
  )

  const performSave = useCallback(
    (opts?: { publish?: boolean; replaceUrl?: boolean; status?: PostStatus }) => {
      if (createPost.isPending || updatePost.isPending) return
      const s = opts?.status ?? (opts?.publish ? POST_STATUS.PUBLISHED : status)
      const t = (title || '').trim()
      const sslug = slug.trim() ? slugify(slug.trim()) : slugify(t || 'Untitled')
      const lexicalSource =
        editor != null ? JSON.stringify(editor.getEditorState().toJSON()) : lexical
      const plaintext = (lexicalSource ? extractPlaintextFromLexical(lexicalSource) : '') ?? ''
      let safeLexical: string | undefined
      if (lexicalSource && typeof lexicalSource === 'string') {
        try {
          JSON.parse(lexicalSource)
          safeLexical = lexicalSource
        } catch {
          /* omit */
        }
      }
      const isNewPost = resolvedIdRef.current === 'new' || !resolvedIdRef.current
      const isEmpty = !t && !(slug || '').trim() && !(plaintext || '').trim()
      if (isNewPost && isEmpty) return

      if (!isNewPost && isEmpty && hasSavedOnce) {
        return
      }

      if (!isNewPost && !safeLexical && editor == null && (lexical == null || lexical === '')) {
        return
      }

      const data = {
        title: t,
        slug: sslug,
        ...(safeLexical && { lexical: safeLexical }),
        plaintext,
        status: s,
        visibility,
        publishedAt,
        tagIds: selectedTagIds,
      }

      if (isNewPost) {
        createPost.mutate(data, {
          onSuccess: (saved) => {
            setHasSavedOnce(true)
            resolvedIdRef.current = saved.id
            setStatus(s)
            setHasUserTyped(false)
            if (opts?.replaceUrl !== false) {
              router.replace(`/vivid/editor/post/${saved.id}`)
            }
          },
        })
      } else {
        const id = resolvedIdRef.current
        updatePost.mutate(
          { id, data: { ...data, status: s } },
          {
            onSuccess: () => {
              setStatus(s)
              setHasUserTyped(false)
              if (postId === 'new') {
                router.replace(`/vivid/editor/post/${id}`)
              }
            },
          }
        )
      }
    },
    [title, slug, lexical, status, visibility, publishedAt, selectedTagIds, createPost, updatePost, router, editor, hasSavedOnce, postId]
  )

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null
      performSave({ replaceUrl: true })
    }, AUTOSAVE_DELAY_MS)
  }, [performSave])

  const isSaving = createPost.isPending || updatePost.isPending

  useEffect(() => {
    if (toolbarOpen) return
    if (ignoreNextAutosaveCount.current > 0) {
      ignoreNextAutosaveCount.current -= 1
      return
    }
    if (!hasUserTyped) return
    if (isSaving) return
    if (!isNew && isLoading) return
    if (!isNew && !initialLoadCompleteRef.current) return
    scheduleAutosave()
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [
    title,
    slug,
    lexical,
    status,
    visibility,
    publishedAt,
    selectedTagIds,
    scheduleAutosave,
    isNew,
    isLoading,
    hasUserTyped,
    isSaving,
    toolbarOpen,
  ])

  useEffect(() => {
    if (toolbarOpen) return
    if (!hasUserTyped || isSaving) return
    if (!isNew && isLoading) return
    if (!isNew && !initialLoadCompleteRef.current) return
    scheduleAutosave()
  }, [toolbarOpen, hasUserTyped, isSaving, isNew, isLoading, scheduleAutosave])

  const handleEditorChange = useCallback(
    (_: unknown, __: string, lexicalState: string) => {
      if (ignoreLexicalChangeUntil.current > Date.now()) return
      if (!isNew && !initialLoadCompleteRef.current) return
      if (lastLexicalContentRef.current === lexicalState) return
      lastLexicalContentRef.current = lexicalState
      setLexical(lexicalState)
      setHasUserTyped(true)
    },
    [isNew]
  )

  const handleSettingsToggle = useCallback(() => {
    ignoreLexicalChangeUntil.current = Date.now() + 300
    if (settingsOpen) {
      performSave({ replaceUrl: true })
      setSettingsOpen(false)
    } else {
      setSettingsOpen(true)
    }
  }, [settingsOpen, performSave, setSettingsOpen])

  const handleSettingsClose = useCallback(() => {
    ignoreLexicalChangeUntil.current = Date.now() + 300
    performSave({ replaceUrl: true })
    setSettingsOpen(false)
  }, [performSave, setSettingsOpen])

  const handleTitleChange = useCallback(
    (value: string) => {
      if (!isNew && !initialLoadCompleteRef.current) return
      setTitle(value)
      if (!slugManuallyEditedRef.current) setSlug(slugify(value))
      setHasUserTyped(true)
    },
    [isNew]
  )

  const handleSlugChange = useCallback((v: string) => {
    slugManuallyEditedRef.current = true
    setSlug(v)
  }, [])

  const handleEditorLoaded = useCallback(() => {
    setEditorLoaded(true)
    if (!isNew) {
      setTimeout(() => {
        initialLoadCompleteRef.current = true
      }, 300)
    } else {
      initialLoadCompleteRef.current = true
    }
  }, [isNew])

  const handleCreateTag = useCallback(
    async (name: string) => {
      try {
        const tag = await createTagMutation.mutateAsync({
          name,
          slug: slugify(name),
          color: TAG_DEFAULT_COLORS[Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)],
        })
        return { value: tag.id, label: tag.name, color: tag.color }
      } catch {
        return null
      }
    },
    [createTagMutation]
  )

  const handleRemoveFeatured = useCallback(
    (id: string) => {
      updatePost.mutate({ id, data: { featuredMediaId: null } })
      setFeaturedMedia(null)
    },
    [updatePost]
  )

  const handleFeaturedUploaded = useCallback(
    (id: string, media: { id: string }[]) => {
      if (media.length) {
        updatePost.mutate({ id, data: { featuredMediaId: media[0].id } })
        setFeaturedMedia(media[0] as NonNullable<PostEditorFeaturedMedia>)
      }
    },
    [updatePost]
  )

  const resolvedId = isNew ? (hasSavedOnce ? resolvedIdRef.current : null) : postId
  const statusLabel =
    !hasSavedOnce && isNew
      ? 'New'
      : status === POST_STATUS.PUBLISHED
        ? `Published${isSaving ? ' - Saving...' : hasSavedOnce ? ' - Saved' : ''}`
        : `Draft${isSaving ? ' - Saving...' : hasSavedOnce ? ' - Saved' : ''}`

  const tagsForSettings = tags.map((t: { id: string; name: string; color: string | null; postCount?: number }) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    postCount: t.postCount,
  }))

  return {
    postId,
    isNew,
    isLoading,
    title,
    slug,
    lexical,
    status,
    visibility,
    publishedAt,
    selectedTagIds,
    featuredMedia,
    editor,
    setEditor,
    settingsOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    mobileBarCollapsed,
    setMobileBarCollapsed,
    toolbarOpen,
    setToolbarOpen,
    resolvedId,
    statusLabel,
    isSaving,
    tagsForSettings,
    hasSavedOnce,
    updatePost,
    softDeletePost,
    router,
    handleStatusChange,
    performSave,
    handleSettingsToggle,
    handleSettingsClose,
    handleEditorChange,
    handleTitleChange,
    handleSlugChange,
    handleEditorLoaded,
    handleCreateTag,
    handleRemoveFeatured,
    handleFeaturedUploaded,
    setVisibility,
    setPublishedAt,
    setSelectedTagIds,
  }
}
