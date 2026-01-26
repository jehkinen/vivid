import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { mediaGetSchema, validateRequest } from '@/lib/validators/schemas'
import { mediaService } from '@/services/media.service'

export const GET = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const mediableType = searchParams.get('mediableType')
  const mediableId = searchParams.get('mediableId')
  const collection = searchParams.get('collection')
  const conversion = searchParams.get('conversion')

  const validation = validateRequest(mediaGetSchema, {
    mediableType: mediableType || '',
    mediableId: mediableId || '',
    collection: collection || undefined,
    conversion: conversion || undefined,
  })

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const media = await mediaService.findMany(
    validation.data.mediableType,
    validation.data.mediableId,
    validation.data.collection
  )

  if (validation.data.conversion) {
    const mediaWithConversions = await Promise.all(
      media.map(async (m) => {
        const conversionUrl = await mediaService.getConversionUrl(m, validation.data.conversion!)
        return { ...m, conversionUrl }
      })
    )
    return NextResponse.json(mediaWithConversions)
  }

  return NextResponse.json(media)
})

export const DELETE = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required', errors: [{ field: 'id', message: 'ID parameter is required' }] },
      { status: 400 }
    )
  }

  const { idParamSchema } = await import('@/lib/validators/schemas')
  const idValidation = validateRequest(idParamSchema, id)
  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: idValidation.errors },
      { status: 400 }
    )
  }

  await mediaService.softDelete(idValidation.data)
  return NextResponse.json({ success: true })
})