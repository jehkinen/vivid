import { IMAGE_CARD_WIDTH, type ImageCardWidth } from '@/shared/constants'

export function getImageCardWidthClass(cardWidth?: ImageCardWidth | string | null): string {
  if (cardWidth === IMAGE_CARD_WIDTH.FULL) return 'w-full'
  if (cardWidth === IMAGE_CARD_WIDTH.WIDE) return 'max-w-4xl mx-auto'
  return 'max-w-2xl mx-auto'
}
