import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'

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

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (IS_PUBLIC) {
      return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
      await s3Client.send(command)
    } catch (error: any) {
      if (error.name !== 'NoSuchKey') {
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
    } catch (error: any) {
      if (error.name !== 'NoSuchKey') {
        throw error
      }
    }
  }
}

export const storageService = new StorageService()