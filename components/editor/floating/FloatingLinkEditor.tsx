'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { GlobeIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { $commitLinkEdit } from '@/lib/editor/link-utils'
import { editorFloatingShellClassName } from './editor-floating-shell'
import { useEditorFloatingUI, type LinkSession } from './EditorFloatingUIContext'

type FloatingLinkEditorProps = {
  session: LinkSession
  phase: 'edit' | 'create'
}

export function FloatingLinkEditor({ session, phase }: FloatingLinkEditorProps) {
  const [editor] = useLexicalComposerContext()
  const { closeAll } = useEditorFloatingUI()
  const [linkText, setLinkText] = useState(session.linkText)
  const textInputRef = useRef<HTMLInputElement>(null)
  const sessionRef = useRef(session)

  sessionRef.current = session

  useEffect(() => {
    setLinkText(session.linkText)
    requestAnimationFrame(() => {
      textInputRef.current?.focus()
      textInputRef.current?.select()
    })
  }, [session])

  const apply = useCallback(() => {
    const current = sessionRef.current
    const trimmedText = linkText.trim()
    if (!trimmedText && phase === 'create') return

    $commitLinkEdit(editor, {
      url: current.linkUrl,
      displayText: trimmedText || current.linkUrl,
      savedSelection: current.savedSelection,
      editingLinkKey: phase === 'edit' ? current.editingLinkKey : null,
    })

    closeAll()
  }, [editor, linkText, phase, closeAll])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      apply()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeAll()
    }
  }

  const canSave = phase === 'edit' || linkText.trim().length > 0

  return (
    <div
      className={cn(
        editorFloatingShellClassName,
        'flex w-[min(420px,calc(100vw-24px))] flex-col gap-3 p-4'
      )}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, button, select, a')) return
        e.preventDefault()
      }}
    >
      <div className="space-y-2">
        <label htmlFor="link-display-text" className="text-sm font-medium leading-none">
          {phase === 'create' ? 'Link text' : 'Display text'}
        </label>
        <Input
          id="link-display-text"
          ref={textInputRef}
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={phase === 'create' ? 'Text to show' : 'Link text'}
        />
      </div>

      <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <GlobeIcon className="size-3.5 shrink-0" weight="regular" />
        <span className="truncate" title={session.linkUrl}>
          {session.linkUrl}
        </span>
      </p>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            closeAll()
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={!canSave}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            apply()
          }}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
