import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { ImageNode } from './nodes/ImageNode'
import { GalleryNode } from './nodes/GalleryNode'
import { AudioNode } from './nodes/AudioNode'
import { YouTubeNode } from './nodes/YouTubeNode'

export const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  ImageNode,
  GalleryNode,
  AudioNode,
  YouTubeNode,
]

export { ImageNode, $createImageNode, $isImageNode } from './nodes/ImageNode'
export { GalleryNode, $createGalleryNode, $isGalleryNode } from './nodes/GalleryNode'
export { AudioNode, $createAudioNode, $isAudioNode } from './nodes/AudioNode'
export {
  YouTubeNode,
  $createYouTubeNode,
  $isYouTubeNode,
  extractYouTubeVideoId,
} from './nodes/YouTubeNode'
