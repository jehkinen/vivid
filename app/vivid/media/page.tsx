'use client'

import { MediaPageHeader } from '@/components/admin/media/MediaPageHeader'
import { MediaFilters } from '@/components/admin/media/MediaFilters'
import { MediaBulkToolbar } from '@/components/admin/media/MediaBulkToolbar'
import { MediaBulkDeleteDialog } from '@/components/admin/media/MediaBulkDeleteDialog'
import { MediaListView } from '@/components/admin/media/MediaListView'
import { MediaGrid } from '@/components/admin/media/MediaGrid'
import { MediaLightbox } from '@/components/admin/media/MediaLightbox'
import { MediaPagination } from '@/components/admin/media/MediaPagination'
import { useMediaAdminPage } from '@/components/admin/media/useMediaAdminPage'

export default function MediaLibraryPage() {
  const {
    page,
    type,
    view,
    lightbox,
    items,
    isLoading,
    isFetching,
    hasMore,
    totalBytes,
    totalCount,
    usageRatio,
    storageLimitBytes,
    selectedIds,
    selectedCount,
    allPageSelected,
    deleteDialogOpen,
    isDeleting,
    setView,
    setLightbox,
    setDeleteDialogOpen,
    handleTypeChange,
    handlePrev,
    handleNext,
    openLightbox,
    toggleSelect,
    toggleSelectAllOnPage,
    clearSelection,
    handleConfirmDelete,
  } = useMediaAdminPage()

  return (
    <div className="p-8 space-y-6">
      <MediaPageHeader
        view={view}
        isLoading={isLoading}
        totalCount={totalCount}
        totalBytes={totalBytes}
        usageRatio={usageRatio}
        storageLimitBytes={storageLimitBytes}
        onViewChange={setView}
      />
      <MediaFilters type={type} onTypeChange={handleTypeChange} />
      <MediaBulkToolbar
        selectedCount={selectedCount}
        pageCount={items.length}
        allPageSelected={allPageSelected}
        isDeleting={isDeleting}
        onToggleSelectAll={toggleSelectAllOnPage}
        onClearSelection={clearSelection}
        onDelete={() => setDeleteDialogOpen(true)}
      />
      <div className="border rounded-lg overflow-hidden">
        {view === 'list' ? (
          <MediaListView
            items={items}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onItemClick={openLightbox}
          />
        ) : (
          <MediaGrid
            items={items}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onItemClick={openLightbox}
          />
        )}
      </div>
      <MediaLightbox items={items} lightbox={lightbox} onClose={() => setLightbox(null)} />
      <MediaPagination
        page={page}
        isFetching={isFetching}
        hasMore={hasMore}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      <MediaBulkDeleteDialog
        open={deleteDialogOpen}
        count={selectedCount}
        isPending={isDeleting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
