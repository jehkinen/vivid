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
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { HIGHLIGHT_COLORS, getContrastTextColor } from '@/lib/editor/constants'

interface FloatingToolbarProps {
  show: boolean
  style: { top: string; left: string; transform?: string }
}

type HeadingTag = 'h1' | 'h2' | 'h3'

export default function FloatingToolbar({ show, style }: FloatingToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [headingTag, setHeadingTag] = useState<HeadingTag | null>(null)
  const [isQuote, setIsQuote] = useState(false)
  const [highlightBg, setHighlightBg] = useState<string | null>(null)

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
    })
  }, [editor])

  useEffect(() => {
    if (show) updateFormat()
  }, [show, updateFormat])

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
        } else {
        if (nodeAfter) {
          nodeAfter.insertBefore(quoteNode)
          } else {
            parent.append(quoteNode)
          }
        }
      }
    })
    setTimeout(updateFormat, 10)
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
        case 'heading':
          $setBlocksType(selection, () => $createHeadingNode(tag))
          break
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

  if (!show) return null

  return (
    <div
      className="fixed z-50 flex flex-col gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1.5"
      style={{ ...style, position: 'fixed' }}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('bold')}
          className={isBold ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Bold (Cmd+B)"
        >
          <TextBIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('italic')}
          className={isItalic ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Italic (Cmd+I)"
        >
          <TextItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('code')}
          className={isCode ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Code"
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleInsertBlock('heading', { tag: 'h1' })}
          className={headingTag === 'h1' ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Heading 1"
        >
          <TextHOneIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleInsertBlock('heading', { tag: 'h2' })}
          className={headingTag === 'h2' ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Heading 2"
        >
          <TextHTwoIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleInsertBlock('heading', { tag: 'h3' })}
          className={headingTag === 'h3' ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Heading 3"
        >
          <TextHThreeIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWrapQuote}
          className={isQuote ? 'bg-gray-100 dark:bg-gray-700' : ''}
          title="Quote"
        >
          <QuotesIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFormat}
          title="Clear formatting"
        >
          <EraserIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {HIGHLIGHT_COLORS.map((bg) => {
          const isActive =
            highlightBg?.toLowerCase().replace(/\s/g, '') === bg.toLowerCase().replace(/\s/g, '')
          return (
            <button
              key={bg}
              type="button"
              onClick={() => handleHighlight(bg)}
              className={`w-5 h-5 rounded border-2 shrink-0 transition-colors ${
                isActive
                  ? 'border-gray-900 dark:border-gray-100 ring-1 ring-offset-1'
                  : 'border-transparent hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              style={{ backgroundColor: bg }}
              title="Highlight"
              aria-label="Highlight color"
            />
          )
        })}
      </div>
    </div>
  )
}
