'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { editorFloatingShellClassName } from './editor-floating-shell'
import { $removeLinksInSelection } from '@/lib/editor/link-utils'
import { useEditorFloatingUI, type LinkSession } from './EditorFloatingUIContext'

type FloatingLinkPreviewProps = {
  session: LinkSession
  onEdit: (session: LinkSession) => void
}

export default function FloatingLinkPreview({ session, onEdit }: FloatingLinkPreviewProps) {
  const [editor] = useLexicalComposerContext()
  const { closeAll } = useEditorFloatingUI()

  const remove = () => {
    editor.update(
      () => {
        const key = session.editingLinkKey
        if (key) {
          const node = $getNodeByKey(key)
          if (node && $isLinkNode(node)) {
            node.selectStart()
          }
        }
        $removeLinksInSelection()
      },
      { discrete: true }
    )
    closeAll()
  }

  return (
    <div
      className={cn(
        editorFloatingShellClassName,
        'flex w-[min(420px,calc(100vw-24px))] items-center gap-2 px-3 py-2'
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span
        title={session.linkUrl}
        className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
      >
        {session.linkUrl}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit(session)
          }}
          title="Edit link text"
        >
          <PencilSimpleIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            remove()
          }}
          title="Remove link"
          className="hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" weight="regular" />
        </Button>
      </div>
    </div>
  )
}
