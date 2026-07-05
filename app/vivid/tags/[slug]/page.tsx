'use client'

import { Loader } from '@/components/ui/loader'
import { TagHeader } from '@/components/admin/tags/TagHeader'
import { TagPostsList } from '@/components/admin/tags/TagPostsList'
import { TagDeleteDialog } from '@/components/admin/tags/TagDeleteDialog'
import { TagMergeDialog } from '@/components/admin/tags/TagMergeDialog'
import { useTagEditPage } from '@/components/admin/tags/useTagEditPage'

export default function TagEditPage() {
  const {
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
    savePending,
    deletePending,
    mergePending,
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
  } = useTagEditPage()

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <TagHeader isNew={isNew} />
        <TagPostsList
          isNew={isNew}
          name={name}
          slugValue={slugValue}
          color={color}
          description={description}
          hasOtherTags={otherTags.length > 0}
          savePending={savePending}
          onNameChange={handleNameChange}
          onSlugChange={setSlugValue}
          onColorChange={setColor}
          onDescriptionChange={setDescription}
          onSave={handleSave}
          onDeleteClick={() => setDeleteDialogOpen(true)}
          onMergeClick={() => setMergeDialogOpen(true)}
        />
      </div>

      <TagDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deletePending={deletePending}
        onConfirm={handleDelete}
      />

      <TagMergeDialog
        open={mergeDialogOpen}
        tagName={tag?.name}
        otherTags={otherTags}
        mergeTargetId={mergeTargetId}
        mergePopoverOpen={mergePopoverOpen}
        mergePending={mergePending}
        onOpenChange={setMergeDialogOpen}
        onMergeTargetIdChange={setMergeTargetId}
        onMergePopoverOpenChange={setMergePopoverOpen}
        onConfirm={handleMerge}
      />
    </div>
  )
}
