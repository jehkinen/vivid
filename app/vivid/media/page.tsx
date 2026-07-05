'use client'

import { MediaPageHeader } from '@/components/admin/media/MediaPageHeader'
import { MediaFilters } from '@/components/admin/media/MediaFilters'
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
    setView,
    setLightbox,
    handleTypeChange,
    handlePrev,
    handleNext,
    openLightbox,
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
      <div className="border rounded-lg overflow-hidden">
        {view === 'list' ? (
          <MediaListView items={items} isLoading={isLoading} onItemClick={openLightbox} />
        ) : (
          <MediaGrid items={items} isLoading={isLoading} onItemClick={openLightbox} />
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
    </div>
  )
}
