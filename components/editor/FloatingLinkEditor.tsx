'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, CheckIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  $commitLinkEdit,
  $removeLinksInSelection,
  $restoreLinkSelection,
} from '@/lib/editor/link-utils'
import { useEditorFloatingUI, type LinkSession } from './EditorFloatingUIContext'

type FloatingLinkEditorProps = {
  session: LinkSession
}

export default function FloatingLinkEditor({ session }: FloatingLinkEditorProps) {
  const [editor] = useLexicalComposerContext()
  const { closeLinkSession } = useEditorFloatingUI()
  const [linkText, setLinkText] = useState(session.linkText)
  const [linkUrl, setLinkUrl] = useState(session.linkUrl)
  const [canRemove, setCanRemove] = useState(!!session.editingLinkKey)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const sessionRef = useRef(session)

  sessionRef.current = session

  useEffect(() => {
    setLinkText(session.linkText)
    setLinkUrl(session.linkUrl)
    setCanRemove(!!session.editingLinkKey)
    requestAnimationFrame(() => {
      urlInputRef.current?.focus()
      urlInputRef.current?.select()
    })
  }, [session])

  const apply = useCallback(
    (closeAfter: boolean) => {
      const current = sessionRef.current
      const trimmedUrl = linkUrl.trim()
      if (!trimmedUrl) return

      $commitLinkEdit(editor, {
        url: trimmedUrl,
        displayText: linkText.trim() || trimmedUrl,
        savedSelection: current.savedSelection,
        editingLinkKey: current.editingLinkKey,
      })

      setCanRemove(true)

      if (closeAfter) {
        closeLinkSession()
      }
    },
    [editor, linkText, linkUrl, closeLinkSession]
  )

  const remove = () => {
    editor.update(
      () => {
        const key = sessionRef.current.editingLinkKey
        if (key) {
          const node = $getNodeByKey(key)
          if (node && $isLinkNode(node)) {
            node.selectStart()
          }
        } else if (sessionRef.current.savedSelection) {
          $restoreLinkSelection(sessionRef.current.savedSelection)
        }
        $removeLinksInSelection()
      },
      { discrete: true }
    )
    closeLinkSession()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      apply(true)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeLinkSession()
    }
  }

  return (
    <div
      className={cn(
        'w-80 rounded-md border bg-popover p-3 text-popover-foreground shadow-md',
        'flex flex-col gap-2.5'
      )}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, button, select')) return
        e.preventDefault()
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={closeLinkSession}
            title="Back"
            className="shrink-0 text-muted-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Link</span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={remove}
            title="Remove link"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" weight="regular" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="editor-link-text" className="text-xs text-muted-foreground">
          Display text
        </label>
        <Input
          id="editor-link-text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Link text"
          className="h-8 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="editor-link-url" className="text-xs text-muted-foreground">
          URL
        </label>
        <Input
          id="editor-link-url"
          ref={urlInputRef}
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="h-8 text-sm"
        />
      </div>

      <div className="flex justify-end pt-0.5">
        <Button
          type="button"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply(true)}
          disabled={!linkUrl.trim()}
          className="gap-1.5"
        >
          <CheckIcon className="h-4 w-4" weight="bold" />
          Apply
        </Button>
      </div>
    </div>
  )
}
