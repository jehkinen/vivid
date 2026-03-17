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

    return conversions
  }
}

export const imageProcessingService = new ImageProcessingService()