import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSignedUrlMock = vi.hoisted(() => vi.fn(async () => 'https://signed.example/file.jpg'))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function S3Client() {}),
  PutObjectCommand: vi.fn(function PutObjectCommand() {}),
  DeleteObjectCommand: vi.fn(function DeleteObjectCommand() {}),
  ListObjectsV2Command: vi.fn(function ListObjectsV2Command() {}),
  GetObjectCommand: vi.fn(function GetObjectCommand(input: { Key: string }) {
    return input
  }),
}))

describe('storageService.getFileUrl', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.S3_ENDPOINT = 'https://s3.example'
    process.env.S3_BUCKET = 'bucket'
    process.env.S3_ACCESS_KEY_ID = 'key'
    process.env.S3_ACCESS_KEY_SECRET = 'secret'
    process.env.S3_PUBLIC_BUCKET = 'false'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('reuses cached signed URL for the same key', async () => {
    const { storageService } = await import('@/services/storage.service')
    const first = await storageService.getFileUrl('media/abc/original.jpg')
    const second = await storageService.getFileUrl('media/abc/original.jpg')
    expect(first).toBe(second)
    expect(getSignedUrlMock).toHaveBeenCalledTimes(1)
  })
})
