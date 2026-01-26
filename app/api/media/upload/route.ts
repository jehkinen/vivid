import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { mediaUploadSchema, validateRequest, idParamSchema } from '@/lib/validators/schemas'
import { mediaService } from '@/services/media.service'
import { MAX_FILE_SIZE, ALLOWED_IMAGE_MIME_TYPES } from '@/shared/constants'

export const POST = apiHandler(async (request: NextRequest) => {
  const formData = await request.formData()
  const mediableType = formData.get('mediableType') as string
  const mediableId = formData.get('mediableId') as string
  const collection = formData.get('collection') as string | null
  const replaceMediaId = formData.get('replaceMediaId') as string | null

  const validation = validateRequest(mediaUploadSchema, {
    mediableType,
    mediableId,
    collection: collection || undefined,
    replaceMediaId: replaceMediaId || undefined,
  })

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  if (replaceMediaId) {
    const idValidation = validateRequest(idParamSchema, replaceMediaId)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: idValidation.errors },
        { status: 400 }
      )
    }

    const existingMedia = await mediaService.findOne(replaceMediaId)
    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Media not found', errors: [{ field: 'replaceMediaId', message: 'Media not found' }] },
        { status: 404 }
      )
    }

    if (existingMedia.mediableType !== mediableType || existingMedia.mediableId !== mediableId) {
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

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        { error: 'Invalid file type', errors: [{ field: 'files', message: `File ${file.name} has invalid MIME type. Only images are allowed.` }] },
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
    validation.data.mediableType,
    validation.data.mediableId,
    uploadFiles,
    {
      collection: validation.data.collection,
      replaceMediaId: validation.data.replaceMediaId,
    }
  )

  return NextResponse.json({ files: results })
})