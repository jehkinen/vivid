'use client'

import type { LexicalEditor as LexicalEditorInstance } from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import FloatingToolbarPlugin from './FloatingToolbarPlugin'
import FloatingInsertPlusPlugin from './FloatingInsertPlusPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { ImageNode } from './nodes/ImageNode'
import { GalleryNode } from './nodes/GalleryNode'
import { AudioNode } from './nodes/AudioNode'
import { EditorTypingProvider, useEditorTyping } from './EditorTypingContext'
import { MediableProvider } from './MediableContext'

const EDITOR_NODES = [
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
]
import { EditorState } from 'lexical'
import { useEffect, useState, useRef, Component, ReactElement } from 'react'
import { $generateHtmlFromNodes } from '@lexical/html'

function OnMountPlugin({ onMount }: { onMount?: (editor: LexicalEditorInstance) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    onMount?.(editor)
  }, [editor, onMount])
  return null
}


interface ErrorBoundaryProps {
  children: ReactElement
  onError: (error: Error) => void
}

class LexicalErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
    console.error('Lexical editor error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 dark:text-red-400">
          Something went wrong with the editor. Please refresh the page.
        </div>
      )
    }
    return this.props.children
  }
}

const theme = {
  heading: {
    h1: 'text-4xl font-bold mb-4 mt-6',
    h2: 'text-3xl font-bold mb-3 mt-5',
    h3: 'text-2xl font-bold mb-2 mt-4',
    h4: 'text-xl font-bold mb-2 mt-3',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm',
  },
  list: {
    listitem: 'ml-6',
    nested: {
      listitem: 'ml-12',
    },
    ol: 'list-decimal',
    ul: 'list-disc',
  },
  quote: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300',
  link: 'text-blue-600 dark:text-blue-400 hover:underline',
  code: 'bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm overflow-x-auto block my-4',
}

function CustomOnChangePlugin({ onChange }: { onChange: (editorState: EditorState, html: string, lexical: string) => void }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null)
        const lexicalState = JSON.stringify(editorState.toJSON())
        onChange(editorState, htmlString, lexicalState)
      })
    })
  }, [editor, onChange])

  return null
}

interface LexicalEditorProps {
  initialEditorState?: string | null
  onChange?: (editorState: EditorState, html: string, lexical: string) => void
  placeholder?: string
  className?: string
  mediableType?: string
  mediableId?: string
  onEditorMount?: (editor: LexicalEditorInstance) => void
  onEditorLoaded?: () => void
}

function LoadInitialStatePlugin({ content, onLoaded }: { content: string; onLoaded?: () => void }) {
  const [editor] = useLexicalComposerContext()
  const [loaded, setLoaded] = useState(false)
  const onLoadedRef = useRef(onLoaded)
  const contentRef = useRef(content)
  const lastLoadedContentRef = useRef<string | null>(null)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    if (loaded && (content || '').trim() !== '' && lastLoadedContentRef.current === '') {
      setLoaded(false)
    }
  }, [content, loaded])

  useEffect(() => {
    if (loaded) return

    const currentContent = contentRef.current
    
    if (!currentContent || currentContent.trim() === '') {
      lastLoadedContentRef.current = ''
      setLoaded(true)
      setTimeout(() => {
        onLoadedRef.current?.()
      }, 100)
      return
    }

    let editorState
    try {
      const parsed = JSON.parse(currentContent)
      editorState = editor.parseEditorState(parsed)
    } catch (error) {
      console.error('Error loading initial state:', error)
      lastLoadedContentRef.current = currentContent
      setLoaded(true)
      setTimeout(() => {
        onLoadedRef.current?.()
      }, 100)
      return
    }

    queueMicrotask(() => {
      try {
        editor.setEditorState(editorState)
        lastLoadedContentRef.current = currentContent
        setLoaded(true)
        setTimeout(() => {
          onLoadedRef.current?.()
        }, 300)
      } catch (error) {
        lastLoadedContentRef.current = currentContent
        setLoaded(true)
        setTimeout(() => {
          onLoadedRef.current?.()
        }, 100)
      }
    })
  }, [editor, content, loaded])

  return null
}

function EditorContentArea({
  initialEditorState,
  placeholder,
  onChange,
  onEditorLoaded,
}: {
  initialEditorState?: string | null
  placeholder: string
  onChange?: (editorState: EditorState, html: string, lexical: string) => void
  onEditorLoaded?: () => void
}) {
  const { setTyping } = useEditorTyping()
  const handleChange = (editorState: EditorState, html: string, lexical: string) => {
    if (onChange) onChange(editorState, html, lexical)
  }
  return (
    <div
      className="flex-1 relative min-w-0 flex flex-col bg-transparent"
      onKeyDown={setTyping}
    >
      <LoadInitialStatePlugin 
        content={initialEditorState || ''} 
        onLoaded={onEditorLoaded} 
      />
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="min-h-[500px] outline-none pl-0 pr-6 pt-6 pb-6 prose prose-lg max-w-none dark:prose-invert focus:outline-none text-left" />
        }
        placeholder={
          <div className="absolute top-6 left-0 text-gray-400 dark:text-gray-500 pointer-events-none select-none">
            {placeholder}
          </div>
        }
        ErrorBoundary={({ children }) => (
          <LexicalErrorBoundary onError={(error) => console.error('Lexical error:', error)}>
            {children}
          </LexicalErrorBoundary>
        )}
      />
      <HistoryPlugin />
      <FloatingToolbarPlugin />
      <FloatingInsertPlusPlugin />
      <CustomOnChangePlugin onChange={handleChange} />
    </div>
  )
}

export default function LexicalEditor({
  initialEditorState,
  onChange,
  placeholder = 'Begin writing your vivid story...',
  className = '',
  mediableType,
  mediableId,
  onEditorMount,
  onEditorLoaded,
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'VividEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical editor error:', error)
    },
    nodes: EDITOR_NODES,
  }

  const handleChange = (editorState: EditorState, html: string, lexical: string) => {
    if (onChange) {
      onChange(editorState, html, lexical)
    }
  }

  return (
    <div className={`lexical-editor bg-transparent ${className}`}>
      <EditorTypingProvider>
        <MediableProvider mediableType={mediableType} mediableId={mediableId}>
          <LexicalComposer initialConfig={initialConfig}>
            <OnMountPlugin onMount={onEditorMount} />
            <EditorContentArea
              initialEditorState={initialEditorState}
              placeholder={placeholder}
              onChange={handleChange}
              onEditorLoaded={onEditorLoaded}
            />
          </LexicalComposer>
        </MediableProvider>
      </EditorTypingProvider>
    </div>
  )
}

