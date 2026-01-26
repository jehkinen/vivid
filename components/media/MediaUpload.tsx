'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UploadSimpleIcon, CheckIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { MEDIABLE_TYPES, UPLOAD_ITEM_STATUS, type UploadItemStatus } from '@/shared/constants'

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  status: UploadItemStatus
  progress: number
  result?: { id: string; url: string; filename: string }
  error?: string
}

interface MediaUploadProps {
  mediableType?: string
  mediableId?: string
  collection?: string
  replaceMediaId?: string
  multiple?: boolean
  onUploaded?: (media: any[]) => void
  buttonLabel?: string
}

export default function MediaUpload({
  mediableType = MEDIABLE_TYPES.POST,
  mediableId,
  collection,
  replaceMediaId,
  multiple = false,
  onUploaded,
  buttonLabel = 'Select Files',
}: MediaUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const haveCalledOnUploadedRef = useRef(false)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const itemsRef = useRef<UploadItem[]>([])
  itemsRef.current = items

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
    const done = items.filter((i) => i.status === UPLOAD_ITEM_STATUS.DONE && i.result)
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
      setItems((prev) => {
        const next = [...prev]
        if (next[index].status !== UPLOAD_ITEM_STATUS.PENDING) return prev
        next[index] = { ...next[index], status: UPLOAD_ITEM_STATUS.UPLOADING, progress: 0 }
        return next
      })

      const onProgress = (p: number) =>
        setItems((prev) => {
          const next = [...prev]
          next[index] = { ...next[index], progress: p }
          return next
        })

      uploadOne(toUpload[index].file, index, signal, onProgress)
        .then((result) => {
          setItems((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], status: UPLOAD_ITEM_STATUS.DONE, progress: 100, result }
            return next
          })
        })
        .catch((err: Error) => {
          setItems((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], status: UPLOAD_ITEM_STATUS.ERROR, error: err.message }
            return next
          })
        })
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-1.5">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={item.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
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
          ))}
        </div>
      ) : (
        <div className={`relative w-full ${disabled ? 'cursor-not-allowed' : ''}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 ${disabled ? 'pointer-events-none' : ''}`}
            aria-label="Select files"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full pointer-events-none"
          >
            <UploadSimpleIcon className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </div>
      )}
      {!mediableId && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Please save the post first before uploading media
        </p>
      )}
    </div>
  )
}
