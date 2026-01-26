import sharp from 'sharp'
import { IMAGE_CONVERSIONS } from '@/shared/constants'

export interface ConversionResult {
  name: string
  buffer: Buffer
  width: number
  height: number
}

export class ImageProcessingService {
  async resizeImage(
    buffer: Buffer,
    width: number,
    height: number,
    options?: { fit?: 'cover' | 'inside' | 'contain' }
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, {
        fit: options?.fit || 'inside',
        withoutEnlargement: true,
      })
      .toBuffer()
  }

  async generateConversions(originalBuffer: Buffer): Promise<ConversionResult[]> {
    const conversions: ConversionResult[] = []

    const thumb = await this.resizeImage(originalBuffer, 200, 200, { fit: 'cover' })
    conversions.push({
      name: IMAGE_CONVERSIONS.THUMB,
      buffer: thumb,
      width: 200,
      height: 200,
    })

    const medium = await this.resizeImage(originalBuffer, 800, 600, { fit: 'inside' })
    const mediumMetadata = await sharp(medium).metadata()
    conversions.push({
      name: IMAGE_CONVERSIONS.MEDIUM,
      buffer: medium,
      width: mediumMetadata.width || 800,
      height: mediumMetadata.height || 600,
    })

    const large = await this.resizeImage(originalBuffer, 1920, 1080, { fit: 'inside' })
    const largeMetadata = await sharp(large).metadata()
    conversions.push({
      name: IMAGE_CONVERSIONS.LARGE,
      buffer: large,
      width: largeMetadata.width || 1920,
      height: largeMetadata.height || 1080,
    })

    return conversions
  }
}

export const imageProcessingService = new ImageProcessingService()