'use client'

import { useState, useRef, useEffect, type ChangeEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UploadSimpleIcon, CheckIcon, WarningCircleIcon, MusicNotesIcon } from '@phosphor-icons/react'
import { MEDIABLE_TYPES, UPLOAD_ITEM_STATUS, type UploadItemStatus } from '@/shared/constants'

type UploadResult = { id: string; url: string; filename: string }

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  status: UploadItemStatus
  progress: number
  result?: UploadResult
  error?: string
}

function isDoneWithResult(item: UploadItem): item is UploadItem & { result: UploadResult } {
  return item.status === UPLOAD_ITEM_STATUS.DONE && item.result != null
}

interface MediaUploadProps {
  mediableType?: string
  mediableId?: string
  collection?: string
  replaceMediaId?: string
  multiple?: boolean
  onUploaded?: (media: UploadResult[]) => void
  buttonLabel?: string
  buttonIcon?: ReactNode
  buttonClassName?: string
  accept?: string
  variant?: 'default' | 'featured'
}

function updateItemAt(items: UploadItem[], index: number, patch: Partial<UploadItem>): UploadItem[] {
  const next = [...items]
  next[index] = { ...next[index], ...patch }
  return next
}

export function MediaUpload({
  mediableType = MEDIABLE_TYPES.POST,
  mediableId,
  collection,
  replaceMediaId,
  multiple = false,
  onUploaded,
  buttonLabel = 'Select Files',
  buttonIcon,
  buttonClassName,
  accept = 'image/*',
  variant = 'default',
}: MediaUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const haveCalledOnUploadedRef = useRef(false)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const itemsRef = useRef<UploadItem[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl))
      uploadAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    if (items.some((i) => i.status === UPLOAD_ITEM_STATUS.PENDING || i.status === UPLOAD_ITEM_STATUS.UPLOADING)) return
    if (haveCalledOnUploadedRef.current) return
    const done = items.filter(isDoneWithResult)
    if (done.length === 0) {
      toast.error('Upload failed')
      return
    }
    haveCalledOnUploadedRef.current = true
    toast.success(`Successfully uploaded ${done.length} file(s)`)
    onUploaded?.(done.map((d) => d.result))
  }, [items, onUploaded])

  const uploadOne = (
    file: File,
    index: number,
    signal: AbortSignal | undefined,
    onProgress: (percent: number) => void
  ): Promise<{ id: string; url: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('mediableType', mediableType)
      formData.append('mediableId', mediableId!)
      if (collection) formData.append('collection', collection)
      if (replaceMediaId && index === 0) formData.append('replaceMediaId', replaceMediaId)

      const xhr = new XMLHttpRequest()
      signal?.addEventListener?.('abort', () => xhr.abort())

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            const one = data.files?.[0]
            if (!one) reject(new Error('No file in response'))
            else resolve({ id: one.id, url: one.url, filename: one.filename })
          } catch {
            reject(new Error('Upload failed'))
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.error || 'Upload failed'))
          } catch {
            reject(new Error('Upload failed'))
          }
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))

      xhr.open('POST', '/api/media/upload')
      xhr.send(formData)
    })
  }

  const startUploads = (toUpload: UploadItem[]) => {
    uploadAbortRef.current = new AbortController()
    const signal = uploadAbortRef.current.signal

    toUpload.forEach((_, index) => {
      setItems((prev: UploadItem[]) => {
        const next = [...prev]
        if (next[index].status !== UPLOAD_ITEM_STATUS.PENDING) return prev
        next[index] = { ...next[index], status: UPLOAD_ITEM_STATUS.UPLOADING, progress: 0 }
        return next
      })

      const onProgress = (p: number) =>
        setItems((prev: UploadItem[]) => updateItemAt(prev, index, { progress: p }))

      uploadOne(toUpload[index].file, index, signal, onProgress)
        .then((result) => {
          setItems((prev: UploadItem[]) =>
            updateItemAt(prev, index, {
              status: UPLOAD_ITEM_STATUS.DONE,
              progress: 100,
              result,
            })
          )
        })
        .catch((err: Error) => {
          setItems((prev: UploadItem[]) =>
            updateItemAt(prev, index, {
              status: UPLOAD_ITEM_STATUS.ERROR,
              error: err.message,
            })
          )
        })
    })
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!mediableId) {
      toast.error('Please save the post first before uploading media')
      e.target.value = ''
      return
    }

    const list = replaceMediaId ? [files[0]] : multiple ? Array.from(files) : [files[0]]
    const newItems: UploadItem[] = list.map((file, i) => ({
      id: `u-${i}-${file.name}-${file.size}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: UPLOAD_ITEM_STATUS.PENDING,
      progress: 0,
    }))

    setItems(newItems)
    e.target.value = ''
    startUploads(newItems)
  }

  const disabled = items.length > 0 || !mediableId
  const isFeatured = variant === 'featured'

  const openFilePicker = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const uploadProgress = items.length === 1 ? items[0] : null

  return (
    <div className={isFeatured ? 'mb-3' : 'space-y-4'}>
      {items.length > 0 ? (
        isFeatured && uploadProgress ? (
          <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
            {!uploadProgress.file.type.startsWith('audio/') && (
              <img
                src={uploadProgress.previewUrl}
                alt=""
                className="h-9 w-9 rounded object-cover opacity-80"
              />
            )}
            <div className="flex min-w-[5rem] flex-col gap-1">
              {uploadProgress.status === UPLOAD_ITEM_STATUS.ERROR ? (
                <WarningCircleIcon className="h-4 w-4 text-destructive" />
              ) : uploadProgress.status === UPLOAD_ITEM_STATUS.DONE ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-[width] duration-150 ease-out"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {uploadProgress.progress}%
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => {
            const isAudio = item.file.type.startsWith('audio/')
            return (
              <div key={item.id} className="flex flex-col gap-1.5">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  {isAudio ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MusicNotesIcon size={40} />
                      <span className="text-xs truncate max-w-full px-2">{item.file.name}</span>
                    </div>
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex items-center justify-center min-h-[24px]">
                  {item.status === UPLOAD_ITEM_STATUS.PENDING || item.status === UPLOAD_ITEM_STATUS.UPLOADING ? (
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-[width] duration-150 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  ) : item.status === UPLOAD_ITEM_STATUS.DONE ? (
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  ) : item.status === UPLOAD_ITEM_STATUS.ERROR ? (
                    <span title={item.error}>
                      <WarningCircleIcon className="h-5 w-5 text-destructive" />
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
        )
      ) : (
        <div className={cn(isFeatured ? 'w-fit' : 'w-full')}>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
            className="sr-only"
            aria-label="Select files"
          />
          {isFeatured ? (
            <button
              type="button"
              disabled={disabled}
              onClick={openFilePicker}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                'border-border/70 bg-muted/25 text-muted-foreground',
                !disabled &&
                  'hover:border-border hover:bg-muted/45 hover:text-foreground active:scale-[0.98]',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {buttonIcon ? (
                <span className="inline-flex [&>svg]:h-4 [&>svg]:w-4">{buttonIcon}</span>
              ) : (
                <UploadSimpleIcon className="h-4 w-4" />
              )}
              <span>{buttonLabel}</span>
            </button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={openFilePicker}
              className={['w-full cursor-pointer', buttonClassName].filter(Boolean).join(' ')}
            >
              {buttonIcon ? (
                <span className="mr-2 inline-flex [&>svg]:h-4 [&>svg]:w-4">{buttonIcon}</span>
              ) : (
                <UploadSimpleIcon className="mr-2 h-4 w-4" />
              )}
              {buttonLabel}
            </Button>
          )}
        </div>
      )}
      {!mediableId && items.length === 0 && !isFeatured && (
        <p className="text-sm text-muted-foreground">
          Please save the post first before uploading media
        </p>
      )}
    </div>
  )
}
