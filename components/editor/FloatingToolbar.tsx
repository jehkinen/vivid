'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, $getRoot, FORMAT_TEXT_COMMAND } from 'lexical'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $createCodeNode } from '@lexical/code'
import { useEffect, useState, useCallback } from 'react'
import { TextBIcon, TextItalicIcon, CodeIcon, TextHOneIcon, QuotesIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface FloatingToolbarProps {
  show: boolean
  style: { top: string; left: string; transform?: string }
}

export default function FloatingToolbar({ show, style }: FloatingToolbarProps) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isCode, setIsCode] = useState(false)

  const updateFormat = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat('bold'))
        setIsItalic(selection.hasFormat('italic'))
        setIsCode(selection.hasFormat('code'))
      }
    })
  }, [editor])

  useEffect(() => {
    if (show) {
      updateFormat()
    }
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
        root.splice(index, 0, quoteNode)
      } else {
        if (nodeAfter) {
          parent.insertBefore(quoteNode, nodeAfter)
        } else {
          parent.append(quoteNode)
        }
      }
    })
  }

  const handleInsertBlock = (type: string, options?: any) => {
    if (type === 'quote') {
      handleWrapQuote()
      return
    }
    editor.update(() => {
      const selection = $getSelection()
      if (selection) {
        let node
        switch (type) {
          case 'heading':
            node = $createHeadingNode(options?.tag || 'h1')
            break
          case 'code':
            node = $createCodeNode()
            break
          default:
            return
        }
        selection.insertNodes([node])
      }
    })
  }

  if (!show) return null

  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1"
      style={{ ...style, position: 'fixed' }}
    >
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
        title="Heading"
      >
        <TextHOneIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleInsertBlock('quote')}
        title="Quote"
      >
        <QuotesIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
