import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { mediaUploadSchema } from '@/lib/validators/schemas'
import { parseRequest } from '@/lib/validators/parse'
import { mediaService } from '@/services/media.service'
import { MAX_FILE_SIZE, ALLOWED_UPLOAD_MIME_TYPES } from '@/shared/constants'

export const POST = authedHandler(async (request: NextRequest) => {
  const formData = await request.formData()
  const data = parseRequest(mediaUploadSchema, {
    mediableType: formData.get('mediableType'),
    mediableId: formData.get('mediableId'),
    collection: formData.get('collection') || undefined,
    replaceMediaId: formData.get('replaceMediaId') || undefined,
  })

  if (data.replaceMediaId) {
    const existingMedia = await mediaService.findOne(data.replaceMediaId)
    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Media not found', errors: [{ field: 'replaceMediaId', message: 'Media not found' }] },
        { status: 404 }
      )
    }

    if (existingMedia.mediableType !== data.mediableType || existingMedia.mediableId !== data.mediableId) {
      return NextResponse.json(
        { error: 'Validation failed', errors: [{ field: 'replaceMediaId', message: 'Media does not belong to this entity' }] },
        { status: 400 }
      )
    }
  }

  const files = formData.getAll('files') as File[]
  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No files provided', errors: [{ field: 'files', message: 'At least one file is required' }] },
      { status: 400 }
    )
  }

  const uploadFiles = []
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large', errors: [{ field: 'files', message: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` }] },
        { status: 400 }
      )
    }

    if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type', errors: [{ field: 'files', message: `File ${file.name} has invalid MIME type. Images and audio are allowed.` }] },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    uploadFiles.push({
      buffer,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    })
  }

  const results = await mediaService.upload(
    data.mediableType,
    data.mediableId,
    uploadFiles,
    {
      collection: data.collection,
      replaceMediaId: data.replaceMediaId,
    }
  )

  return NextResponse.json({ files: results })
})
