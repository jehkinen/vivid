import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { SIGNED_URL_EXPIRES_SECONDS, SIGNED_URL_CACHE_BUFFER_SECONDS } from '@/shared/constants'

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_ACCESS_KEY_SECRET!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET
const IS_PUBLIC = process.env.S3_PUBLIC_BUCKET === 'true'

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export class StorageService {
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType?: string
  ): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    const url = IS_PUBLIC
      ? `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`
      : await this.getFileUrl(key)

    return { key, url }
  }

  async getFileUrl(key: string, expiresIn: number = SIGNED_URL_EXPIRES_SECONDS): Promise<string> {
    if (IS_PUBLIC) {
      return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`
    }

    const cacheKey = `${key}:${expiresIn}`
    const cached = signedUrlCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    signedUrlCache.set(cacheKey, {
      url,
      expiresAt: Date.now() + (expiresIn - SIGNED_URL_CACHE_BUFFER_SECONDS) * 1000,
    })
    return url
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
      await s3Client.send(command)
    } catch (error: unknown) {
      const name = error && typeof error === 'object' && 'name' in error ? String((error as { name: unknown }).name) : ''
      if (name !== 'NoSuchKey') {
        throw error
      }
    }
  }

  async deleteFilesByPrefix(prefix: string): Promise<void> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
      })

      let continuationToken: string | undefined
      do {
        const response = await s3Client.send(listCommand)
        if (response.Contents && response.Contents.length > 0) {
          await Promise.all(
            response.Contents.map((object) => {
              if (object.Key) {
                return this.deleteFile(object.Key)
              }
            })
          )
        }
        continuationToken = response.NextContinuationToken
        if (continuationToken) {
          listCommand.input.ContinuationToken = continuationToken
        }
      } while (continuationToken)
    } catch (error: unknown) {
      const name = error && typeof error === 'object' && 'name' in error ? String((error as { name: unknown }).name) : ''
      if (name !== 'NoSuchKey') {
        throw error
      }
    }
  }
}

export const storageService = new StorageService()