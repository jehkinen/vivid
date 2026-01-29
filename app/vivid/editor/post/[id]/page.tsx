'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LexicalEditor as LexicalEditorInstance } from 'lexical'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LexicalEditor from '@/components/editor/LexicalEditor'
import InsertBlockPlus from '@/components/editor/InsertBlockPlus'
import PostSettingsPanel from '@/components/editor/PostSettingsPanel'
import MediaUpload from '@/components/media/MediaUpload'
import { extractPlaintextFromLexical } from '@/lib/lexical-utils'
import { POST_STATUS, POST_VISIBILITY, type PostStatus, type PostVisibility } from '@/shared/constants'
import { usePost, useCreatePost, useUpdatePost } from '@/hooks/api/use-posts'
import { useTags, useCreateTag } from '@/hooks/api/use-tags'
import { slugify, cn } from '@/lib/utils'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'
import { usePostSettings } from '@/lib/post-settings-context'
import { BookOpenIcon, XIcon, CaretLeftIcon } from '@phosphor-icons/react'
import Loader from '@/components/ui/Loader'

const AUTOSAVE_DELAY_MS = 1000

export default function PostEditorPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const isNew = postId === 'new'
  const { open: settingsOpen, setOpen: setSettingsOpen } = usePostSettings()

  const { data: post, isLoading } = usePost(isNew ? '' : postId)
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const { data: tags = [] } = useTags()
  const createTagMutation = useCreateTag()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [lexical, setLexical] = useState<string | null>(null)
  const [status, setStatus] = useState<PostStatus>(POST_STATUS.DRAFT)
  const [visibility, setVisibility] = useState<PostVisibility>(POST_VISIBILITY.PUBLIC)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [featuredMedia, setFeaturedMedia] = useState<any>(null)
  const [hasSavedOnce, setHasSavedOnce] = useState(false)
  const [editor, setEditor] = useState<LexicalEditorInstance | null>(null)
  const [hasUserTyped, setHasUserTyped] = useState(false)
  const [editorLoaded, setEditorLoaded] = useState(isNew)
  const initialLoadCompleteRef = useRef(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolvedIdRef = useRef<string>(postId)
  const ignoreNextAutosaveCount = useRef(0)
  const ignoreLexicalChangeUntil = useRef(0)
  const lastSyncedPostIdRef = useRef<string | null>(null)
  const prevPostIdRef = useRef<string>(postId)

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
    setTitle(post.title || '')
    setSlug(post.slug || '')
    setLexical(post.lexical)
    setStatus((post.status as PostStatus) || POST_STATUS.DRAFT)
    setVisibility(
      post.visibility === POST_VISIBILITY.PUBLIC || post.visibility === POST_VISIBILITY.PRIVATE
        ? (post.visibility as PostVisibility)
        : POST_VISIBILITY.PUBLIC
    )
    setPublishedAt(post.publishedAt || null)
    setSelectedTagIds(post.tags?.map((t: any) => t.tag.id) || [])
    setFeaturedMedia(post.featuredMedia || null)
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
          onError: () => {
            setStatus(prevStatus)
            if (newStatus === POST_STATUS.PUBLISHED && !prevPublishedAt) setPublishedAt(prevPublishedAt)
          },
        }
      )
    },
    [status, publishedAt, updatePost]
  )

  const performSave = useCallback(
    (opts?: { publish?: boolean; replaceUrl?: boolean; status?: PostStatus }) => {
      const s = opts?.status ?? (opts?.publish ? POST_STATUS.PUBLISHED : status)
      const t = (title || '').trim()
      const sslug = slug.trim() ? slugify(slug.trim()) : slugify(t || 'Untitled')
      const lexicalSource =
        editor != null
          ? JSON.stringify(editor.getEditorState().toJSON())
          : lexical
      const plaintext = (lexicalSource ? extractPlaintextFromLexical(lexicalSource) : '') ?? ''
      let safeLexical: string | undefined
      if (lexicalSource && typeof lexicalSource === 'string') {
        try {
          JSON.parse(lexicalSource)
          safeLexical = lexicalSource
        } catch { /* omit */ }
      }
      const isNewPost = resolvedIdRef.current === 'new' || !resolvedIdRef.current
      const isEmpty = !t && !(slug || '').trim() && !(plaintext || '').trim()
      if (isNewPost && isEmpty) return
      
      if (!isNewPost && isEmpty && hasSavedOnce) {
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
        updatePost.mutate(
          { id: resolvedIdRef.current, data: { ...data, status: s } },
          { 
            onSuccess: () => {
              setStatus(s)
              setHasUserTyped(false)
            }
          }
        )
      }
    },
    [title, slug, lexical, status, visibility, publishedAt, selectedTagIds, createPost, updatePost, router, editor]
  )

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null
      performSave({ replaceUrl: true })
    }, AUTOSAVE_DELAY_MS)
  }, [performSave])

  const handleSaveSuccess = useCallback(() => {
    setHasUserTyped(false)
  }, [])

  useEffect(() => {
    if (ignoreNextAutosaveCount.current > 0) {
      ignoreNextAutosaveCount.current -= 1
      return
    }
    if (!hasUserTyped) return
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
  ])

  const handleEditorChange = (_: any, __: string, lexicalState: string) => {
    if (ignoreLexicalChangeUntil.current > Date.now()) return
    if (!isNew && !initialLoadCompleteRef.current) return
    setLexical(lexicalState)
    setHasUserTyped(true)
  }

  const handleSettingsToggle = () => {
    ignoreLexicalChangeUntil.current = Date.now() + 300
    if (settingsOpen) {
      performSave({ replaceUrl: true })
      setSettingsOpen(false)
    } else {
      setSettingsOpen(true)
    }
  }

  const handleSettingsClose = () => {
    ignoreLexicalChangeUntil.current = Date.now() + 300
    performSave({ replaceUrl: true })
    setSettingsOpen(false)
  }

  const handleTitleChange = (value: string) => {
    if (!isNew && !initialLoadCompleteRef.current) return
    setTitle(value)
    setHasUserTyped(true)
  }

  const isSaving = createPost.isPending || updatePost.isPending
  const resolvedId = isNew ? (hasSavedOnce ? resolvedIdRef.current : null) : postId
  const statusLabel =
    !hasSavedOnce && isNew
      ? 'New'
      : status === POST_STATUS.PUBLISHED
        ? `Published${isSaving ? ' - Saving...' : hasSavedOnce ? ' - Saved' : ''}`
        : `Draft${isSaving ? ' - Saving...' : hasSavedOnce ? ' - Saved' : ''}`

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 border-b px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/vivid/posts" className="flex items-center gap-1.5">
              <CaretLeftIcon size={16} />
              <span>Posts</span>
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={resolvedId ? `/vivid/editor/post/${resolvedId}/preview` : '#'}
              target="_blank"
              onClick={(e) => !resolvedId && e.preventDefault()}
            >
              Preview
            </Link>
          </Button>
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() =>
                resolvedId
                  ? handleStatusChange(POST_STATUS.DRAFT)
                  : performSave({ status: POST_STATUS.DRAFT })
              }
              disabled={!resolvedId && isSaving}
              className={cn(
                'px-3 py-1.5 text-sm rounded',
                status === POST_STATUS.DRAFT ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() =>
                resolvedId
                  ? handleStatusChange(POST_STATUS.PUBLISHED)
                  : performSave({ status: POST_STATUS.PUBLISHED, replaceUrl: !hasSavedOnce && isNew })
              }
              disabled={!resolvedId && isSaving}
              className={cn(
                'px-3 py-1.5 text-sm rounded',
                status === POST_STATUS.PUBLISHED ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Published
            </button>
          </div>
          <button
            onClick={handleSettingsToggle}
            className={`flex items-center justify-center w-9 h-9 rounded-md border transition-colors ${
              settingsOpen ? 'bg-accent text-accent-foreground border-border' : 'text-muted-foreground hover:text-foreground border-border'
            }`}
            aria-label={settingsOpen ? 'Close post settings' : 'Open post settings'}
          >
            <BookOpenIcon size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-3xl mx-auto py-8 px-6 font-reading">
            <div className="flex">
              <div className="flex-1 min-w-0 flex flex-col relative">
                {resolvedId && (
                  <div className="mb-4">
                    {featuredMedia ? (
                      <div className="relative inline-block mb-4">
                        <img
                          src={featuredMedia.url}
                          alt={featuredMedia.filename}
                          className="max-w-full max-h-64 rounded-lg object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            updatePost.mutate({ id: resolvedId, data: { featuredMediaId: null } })
                            setFeaturedMedia(null)
                          }}
                        >
                          <XIcon size={16} />
                        </Button>
                      </div>
                    ) : (
                      <MediaUpload
                        mediableType="Post"
                        mediableId={resolvedId}
                        collection="featured"
                        buttonLabel="+ Add feature image"
                        onUploaded={(m) => {
                          if (m.length) {
                            updatePost.mutate({ id: resolvedId, data: { featuredMediaId: m[0].id } })
                            setFeaturedMedia(m[0])
                          }
                        }}
                      />
                    )}
                  </div>
                )}
    <input
      type="text"
      value={title}
      onChange={(e) => handleTitleChange(e.target.value)}
      placeholder="Post title"
      className="w-full bg-transparent text-foreground text-4xl font-semibold tracking-tight border-0 outline-none placeholder:text-muted-foreground py-2 mb-2"
    />
                <LexicalEditor
                  key={postId}
                  initialEditorState={lexical}
                  onChange={handleEditorChange}
                  placeholder="Begin writing your vivid story..."
                  mediableType="Post"
                  mediableId={resolvedId || undefined}
                  onEditorMount={setEditor}
                  onEditorLoaded={() => {
                    setEditorLoaded(true)
                    if (!isNew) {
                      setTimeout(() => {
                        initialLoadCompleteRef.current = true
                      }, 300)
                    } else {
                      initialLoadCompleteRef.current = true
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {settingsOpen && (
          <PostSettingsPanel
            slug={slug}
            onSlugChange={setSlug}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            publishedAt={publishedAt}
            onPublishedAtChange={setPublishedAt}
            selectedTagIds={selectedTagIds}
            onSelectedTagIdsChange={setSelectedTagIds}
            tags={tags.map((t: any) => ({ id: t.id, name: t.name, color: t.color }))}
            onCreateTag={async (name) => {
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
            }}
            isNew={isNew}
            postId={resolvedId || undefined}
            onClose={handleSettingsClose}
          />
        )}
      </div>
    </div>
  )
}
