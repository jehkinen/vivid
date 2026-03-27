'use client'

import { useCallback } from 'react'
import PostSettingsPanel from '@/components/editor/PostSettingsPanel'
import PostEditorBackLink from '@/components/editor/post-editor/PostEditorBackLink'
import PostEditorBody from '@/components/editor/post-editor/PostEditorBody'
import PostEditorDeleteDialog from '@/components/editor/post-editor/PostEditorDeleteDialog'
import PostEditorDesktopRail from '@/components/editor/post-editor/PostEditorDesktopRail'
import PostEditorHeader from '@/components/editor/post-editor/PostEditorHeader'
import PostEditorMobileBar from '@/components/editor/post-editor/PostEditorMobileBar'
import PostEditorStatusStrip from '@/components/editor/post-editor/PostEditorStatusStrip'
import Loader from '@/components/ui/Loader'
import { usePostEditorPage } from '@/hooks/use-post-editor-page'
import { routes } from '@/lib/routes'
import { POST_STATUS } from '@/shared/constants'

export default function PostEditorPage() {
  const {
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
    setToolbarOpen,
    resolvedId,
    statusLabel,
    isSaving,
    tagsForSettings,
    hasSavedOnce,
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
  } = usePostEditorPage()

  const handleConfirmDelete = useCallback(() => {
    if (!resolvedId) return
    softDeletePost.mutate(resolvedId, {
      onSuccess: () => router.push(routes.VIVID_POSTS.path),
      onSettled: () => setDeleteDialogOpen(false),
    })
  }, [resolvedId, softDeletePost, router, setDeleteDialogOpen])

  if (isLoading && !isNew) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PostEditorHeader
        status={status}
        resolvedId={resolvedId}
        isSaving={isSaving}
        onStatusChange={handleStatusChange}
        onSaveDraft={() => performSave({ status: POST_STATUS.DRAFT })}
        onSavePublished={() =>
          performSave({ status: POST_STATUS.PUBLISHED, replaceUrl: !hasSavedOnce && isNew })
        }
      />
      <PostEditorBackLink resolvedId={resolvedId} />
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto flex min-h-full w-full max-w-none gap-0 px-4 md:max-w-[calc(48rem+80px+4rem)] md:gap-20 md:px-6">
            <PostEditorDesktopRail
              editor={editor}
              resolvedId={resolvedId ?? undefined}
              slug={slug}
              settingsOpen={settingsOpen}
              isNew={isNew}
              onSettingsToggle={handleSettingsToggle}
              onDeleteClick={() => setDeleteDialogOpen(true)}
            />
            <PostEditorBody
              postId={postId}
              resolvedId={resolvedId}
              title={title}
              lexical={lexical}
              featuredMedia={featuredMedia}
              onTitleChange={handleTitleChange}
              onEditorChange={handleEditorChange}
              onEditorMount={setEditor}
              onToolbarOpenChange={setToolbarOpen}
              onEditorLoaded={handleEditorLoaded}
              onRemoveFeatured={handleRemoveFeatured}
              onFeaturedUploaded={handleFeaturedUploaded}
            />
          </div>
        </div>
        <PostEditorStatusStrip lexical={lexical} statusLabel={statusLabel} />
        <PostEditorMobileBar
          editor={editor}
          resolvedId={resolvedId ?? undefined}
          slug={slug}
          lexical={lexical}
          statusLabel={statusLabel}
          settingsOpen={settingsOpen}
          mobileBarCollapsed={mobileBarCollapsed}
          onMobileBarCollapsedChange={setMobileBarCollapsed}
          onSettingsToggle={handleSettingsToggle}
        />
        {settingsOpen && (
          <PostSettingsPanel
            slug={slug}
            onSlugChange={handleSlugChange}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            publishedAt={publishedAt}
            onPublishedAtChange={setPublishedAt}
            selectedTagIds={selectedTagIds}
            onSelectedTagIdsChange={setSelectedTagIds}
            tags={tagsForSettings}
            onCreateTag={handleCreateTag}
            isNew={isNew}
            postId={resolvedId ?? undefined}
            onClose={handleSettingsClose}
          />
        )}
        <PostEditorDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={title}
          isDeleting={softDeletePost.isPending}
          onConfirmDelete={handleConfirmDelete}
        />
      </div>
    </div>
  )
}
