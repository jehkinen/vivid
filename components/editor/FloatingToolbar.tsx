'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $setBlocksType, $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection'
import { $unwrapNode } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
} from 'lexical'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isQuoteNode,
  $isHeadingNode,
} from '@lexical/rich-text'
import { $createCodeNode } from '@lexical/code'
import { useEffect, useState, useCallback } from 'react'
import {
  TextBIcon,
  TextItalicIcon,
  CodeIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  QuotesIcon,
  EraserIcon,
  LinkIcon,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import { HIGHLIGHT_COLORS, getContrastTextColor } from '@/lib/editor/constants'
import { $isSelectionInLink, $removeLinksInSelection } from '@/lib/editor/link-utils'
import EditorToolbarTooltip from './EditorToolbarTooltip'

type HeadingTag = 'h1' | 'h2' | 'h3'

type FloatingToolbarProps = {
  onOpenLink: () => void
  forceLinkActive?: boolean
}

export default function FloatingToolbar({ onOpenLink, forceLinkActive = false }: FloatingToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [headingTag, setHeadingTag] = useState<HeadingTag | null>(null)
  const [isQuote, setIsQuote] = useState(false)
  const [highlightBg, setHighlightBg] = useState<string | null>(null)
  const [isLink, setIsLink] = useState(false)

  const updateFormat = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsCode(selection.hasFormat('code'))
      const bg = $getSelectionStyleValueForProperty(selection, 'background-color', '')
      setHighlightBg(bg || null)
      const anchorNode = selection.anchor.getNode()
      const anchorBlock = anchorNode.getTopLevelElementOrThrow()
      setIsQuote($isQuoteNode(anchorBlock))
      setHeadingTag(
        $isHeadingNode(anchorBlock) ? (anchorBlock.getTag() as HeadingTag) : null
      )
      setIsLink($isSelectionInLink(selection))
    })
  }, [editor])

  useEffect(() => {
    updateFormat()
  }, [updateFormat])

  const linkActive = forceLinkActive || isLink

  const handleFormat = (format: 'bold' | 'italic' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    setTimeout(updateFormat, 10)
  }

  const handleWrapQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || selection.isCollapsed()) return
      const anchorNode = selection.anchor.getNode()
      const focusNode = selection.focus.getNode()
      const anchorBlock = anchorNode.getTopLevelElementOrThrow()
      const focusBlock = focusNode.getTopLevelElementOrThrow()
      if ($isQuoteNode(anchorBlock) && anchorBlock.getKey() === focusBlock.getTopLevelElementOrThrow().getKey()) {
        $unwrapNode(anchorBlock)
      } else {
        const startBlock = selection.anchor.isBefore(selection.focus) ? anchorBlock : focusBlock
        const endBlock = selection.anchor.isBefore(selection.focus) ? focusBlock : anchorBlock
        const nodesToWrap: ReturnType<typeof anchorBlock.getTopLevelElementOrThrow>[] = []
        let current: ReturnType<typeof anchorBlock.getTopLevelElementOrThrow> | null = startBlock
        while (current) {
          nodesToWrap.push(current)
          if (current.getKey() === endBlock.getKey()) break
          current = current.getNextSibling()
        }
        if (nodesToWrap.length === 0) return
        const lastBlock = nodesToWrap[nodesToWrap.length - 1]
        const nodeAfter = lastBlock.getNextSibling()
        const parent = startBlock.getParentOrThrow()
        const root = $getRoot()
        const quoteNode = $createQuoteNode()
        for (const n of nodesToWrap) {
          n.remove()
          quoteNode.append(n)
        }
        if (parent.getKey() === root.getKey()) {
          const index = nodeAfter ? nodeAfter.getIndexWithinParent() : root.getChildrenSize()
          root.splice(index, 0, [quoteNode])
        } else if (nodeAfter) {
          nodeAfter.insertBefore(quoteNode)
        } else {
          parent.append(quoteNode)
        }
      }
    })
    setTimeout(updateFormat, 10)
  }

  const handleLink = () => {
    onOpenLink()
  }

  const handleInsertBlock = (type: string, options?: Record<string, string>) => {
    if (type === 'quote') {
      handleWrapQuote()
      return
    }
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const tag = (options?.tag || 'h1') as HeadingTag
      switch (type) {
        case 'heading': {
          const anchorBlock = selection.anchor.getNode().getTopLevelElementOrThrow()
          const focusBlock = selection.focus.getNode().getTopLevelElementOrThrow()
          if (
            $isHeadingNode(anchorBlock) &&
            anchorBlock.getTag() === tag &&
            anchorBlock.getKey() === focusBlock.getKey()
          ) {
            $setBlocksType(selection, () => $createParagraphNode())
          } else {
            $setBlocksType(selection, () => $createHeadingNode(tag))
          }
          break
        }
        case 'code':
          selection.insertNodes([$createCodeNode()])
          break
      }
    })
    setTimeout(updateFormat, 10)
  }

  const handleHighlight = (bg: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || selection.isCollapsed()) return
      const currentBg = $getSelectionStyleValueForProperty(selection, 'background-color', '')
      const normalizedCurrent = currentBg?.toLowerCase().replace(/\s/g, '')
      const normalizedNew = bg.toLowerCase().replace(/\s/g, '')
      if (normalizedCurrent === normalizedNew) {
        $patchStyleText(selection, { 'background-color': null, color: null })
      } else {
        const textColor = getContrastTextColor(bg)
        $patchStyleText(selection, { 'background-color': bg, color: textColor })
      }
    })
    setTimeout(updateFormat, 10)
  }

  const handleClearFormat = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $removeLinksInSelection()
      $patchStyleText(selection, { 'background-color': null, color: null })
      ;['bold', 'italic', 'code'].forEach((f) => {
        if (selection.hasFormat(f as 'bold' | 'italic' | 'code')) {
          selection.toggleFormat(f as 'bold' | 'italic' | 'code')
        }
      })
      $setBlocksType(selection, () => $createParagraphNode())
    })
    setTimeout(updateFormat, 10)
  }

  const toggleProps = { variant: 'outline' as const, size: 'sm' as const }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <EditorToolbarTooltip label="Bold" shortcuts={['⌘', 'B']}>
          <Toggle
            {...toggleProps}
            pressed={isBold}
            onPressedChange={() => handleFormat('bold')}
            aria-label="Bold"
          >
            <TextBIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Italic" shortcuts={['⌘', 'I']}>
          <Toggle
            {...toggleProps}
            pressed={isItalic}
            onPressedChange={() => handleFormat('italic')}
            aria-label="Italic"
          >
            <TextItalicIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Code">
          <Toggle
            {...toggleProps}
            pressed={isCode}
            onPressedChange={() => handleFormat('code')}
            aria-label="Code"
          >
            <CodeIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Link" shortcuts={['⌘', 'K']}>
          <Toggle
            {...toggleProps}
            pressed={linkActive}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onPressedChange={() => handleLink()}
            aria-label="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <EditorToolbarTooltip label="Heading 1">
          <Toggle
            {...toggleProps}
            pressed={headingTag === 'h1'}
            onPressedChange={() => handleInsertBlock('heading', { tag: 'h1' })}
            aria-label="Heading 1"
          >
            <TextHOneIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Heading 2">
          <Toggle
            {...toggleProps}
            pressed={headingTag === 'h2'}
            onPressedChange={() => handleInsertBlock('heading', { tag: 'h2' })}
            aria-label="Heading 2"
          >
            <TextHTwoIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Heading 3">
          <Toggle
            {...toggleProps}
            pressed={headingTag === 'h3'}
            onPressedChange={() => handleInsertBlock('heading', { tag: 'h3' })}
            aria-label="Heading 3"
          >
            <TextHThreeIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Quote" shortcuts={['⌘', '⇧', '9']}>
          <Toggle
            {...toggleProps}
            pressed={isQuote}
            onPressedChange={handleWrapQuote}
            aria-label="Quote"
          >
            <QuotesIcon className="h-4 w-4" />
          </Toggle>
        </EditorToolbarTooltip>
        <EditorToolbarTooltip label="Clear formatting">
          <Button {...toggleProps} variant="outline" onClick={handleClearFormat} aria-label="Clear formatting">
            <EraserIcon className="h-4 w-4" />
          </Button>
        </EditorToolbarTooltip>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {HIGHLIGHT_COLORS.map((bg) => {
          const isActive =
            highlightBg?.toLowerCase().replace(/\s/g, '') === bg.toLowerCase().replace(/\s/g, '')
          return (
            <button
              key={bg}
              type="button"
              onClick={() => handleHighlight(bg)}
              className={cn(
                'size-6 shrink-0 rounded-sm border-2 transition-colors',
                isActive
                  ? 'border-foreground ring-2 ring-ring ring-offset-1 ring-offset-muted'
                  : 'border-transparent hover:border-border'
              )}
              style={{ backgroundColor: bg }}
              aria-label="Highlight color"
            />
          )
        })}
      </div>
    </div>
  )
}
