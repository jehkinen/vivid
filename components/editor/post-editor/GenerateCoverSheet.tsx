'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { CircleNotchIcon, SparkleIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { buildCoverPrompt, isUsablePromptOverride } from '@/lib/ai/build-cover-prompt'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useGenerateCover } from '@/hooks/api/use-generate-cover'
import { invalidateMediaUrlCache, refreshMediaUrl } from '@/hooks/use-media-url'
import {
  API_ERROR_CODE,
  COVER_GENERATION_MAX_ATTEMPTS,
  COVER_STYLE_PRESETS,
} from '@/shared/constants'
import type { ApiError } from '@/lib/api/request'
import type { CoverStylePreset, GenerateCoverMedia } from '@/types/ai'

type GenerateCoverSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  title: string
  plaintext: string
  tagNames: string[]
  openAiConfigured: boolean
  replaceMediaId?: string
  onAccepted: (media: GenerateCoverMedia) => void
}

function phaseLabel(phase: string): string | null {
  if (phase === 'reading') return 'Reading your post…'
  if (phase === 'painting') return 'Painting cover…'
  if (phase === 'finishing') return 'Finishing…'
  return null
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
  )
}

export function GenerateCoverSheet({
  open,
  onOpenChange,
  postId,
  title,
  plaintext,
  tagNames,
  openAiConfigured,
  replaceMediaId,
  onAccepted,
}: GenerateCoverSheetProps) {
  const [stylePreset, setStylePreset] = useState<CoverStylePreset>('editorial')
  const [promptOverride, setPromptOverride] = useState('')
  const [promptEdited, setPromptEdited] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [preview, setPreview] = useState<GenerateCoverMedia | null>(null)
  const [lastConcept, setLastConcept] = useState<string | null>(null)
  const { generate, reset, phase, isPending, error } = useGenerateCover()

  const promptPreview = useMemo(
    () =>
      buildCoverPrompt({
        title,
        plaintext,
        tagNames,
        stylePreset,
        promptOverride: promptEdited ? promptOverride : undefined,
      }),
    [title, plaintext, tagNames, stylePreset, promptOverride, promptEdited]
  )

  const mainIdeaLine =
    lastConcept ??
    promptPreview.sourceParts.concept ??
    promptPreview.sourceParts.title ??
    promptPreview.sourceParts.tags?.join(', ')

  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      reset()
      setPreview(null)
      setLastConcept(null)
      setPromptOverride('')
      setPromptEdited(false)
      setAttempts(0)
      setStylePreset('editorial')
    }
    wasOpenRef.current = open
  }, [open, reset])

  const handleStyleChange = (preset: CoverStylePreset) => {
    setStylePreset(preset)
    setPreview(null)
    setLastConcept(null)
    setPromptOverride('')
    setPromptEdited(false)
  }

  const handleGenerate = async () => {
    if (!openAiConfigured || !promptPreview.sufficient || attempts >= COVER_GENERATION_MAX_ATTEMPTS) return
    const replaceId = replaceMediaId ?? preview?.id
    setPreview(null)
    const customPrompt =
      promptEdited && isUsablePromptOverride(promptOverride) ? promptOverride.trim() : undefined
    const result = await generate(postId, {
      stylePreset,
      promptOverride: customPrompt,
      draft: { title, plaintext, tagNames },
      replaceMediaId: replaceId,
    })
    if (result?.media) {
      invalidateMediaUrlCache(result.media.id)
      const url = (await refreshMediaUrl(result.media.id)) ?? result.media.url
      setPreview({ ...result.media, url })
      if (result.prompt) {
        setPromptOverride(result.prompt)
        setPromptEdited(false)
      }
      if (result.concept) {
        setLastConcept(result.concept)
      }
      setAttempts((count) => count + 1)
    }
  }

  const handleAccept = () => {
    if (!preview) return
    onAccepted(preview)
    toast.success('Cover set')
    onOpenChange(false)
  }

  const apiError = error as ApiError | null
  const isNotConfigured =
    apiError?.details &&
    typeof apiError.details === 'object' &&
    'code' in apiError.details &&
    (apiError.details as { code?: string }).code === API_ERROR_CODE.OPENAI_NOT_CONFIGURED

  const activePhase = phaseLabel(phase)
  const canGenerate =
    openAiConfigured &&
    promptPreview.sufficient &&
    attempts < COVER_GENERATION_MAX_ATTEMPTS &&
    !isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        title="Generate cover"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-5 py-4 pr-12">
          <SheetTitle className="text-base">Generate cover</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 py-4">
          {!openAiConfigured ? (
            <div className="shrink-0 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Add your OpenAI API key in{' '}
              <Link href={routes.VIVID_PROFILE.path} className="text-foreground underline underline-offset-2">
                Profile
              </Link>
              .
            </div>
          ) : null}

          <div className="shrink-0 space-y-1.5">
            <SectionLabel>Main idea</SectionLabel>
            {mainIdeaLine ? (
              <p className="line-clamp-2 text-sm leading-snug text-foreground">{mainIdeaLine}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Write a title or a few sentences first.</p>
            )}
          </div>

          <div className="shrink-0 space-y-1.5">
            <SectionLabel>Style</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {COVER_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleStyleChange(preset.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                    stylePreset === preset.id
                      ? 'border-foreground/30 bg-muted/50 text-foreground'
                      : 'border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 shrink flex-col gap-1.5">
            <label htmlFor="cover-prompt" className="shrink-0">
              <SectionLabel>Image prompt</SectionLabel>
            </label>
            {attempts === 0 && !promptEdited ? (
              <p className="rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Composed from your full post on Generate — scene, light, mood. Appears here after the first run.
              </p>
            ) : (
              <textarea
                id="cover-prompt"
                value={promptOverride}
                onChange={(e) => {
                  setPromptEdited(true)
                  setPromptOverride(e.target.value)
                }}
                rows={4}
                placeholder="Edit to fine-tune the next regeneration…"
                className="min-h-[5.5rem] w-full shrink-0 resize-none rounded-md border border-border/80 bg-background px-3 py-2 text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <SectionLabel>Preview</SectionLabel>
            <div className="relative min-h-[7rem] flex-1 overflow-hidden rounded-lg border border-border/70 bg-muted/20">
              {isPending ? (
                <div className="flex h-full min-h-[7rem] flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CircleNotchIcon className="h-5 w-5 animate-spin" />
                  {activePhase ? <span>{activePhase}</span> : null}
                </div>
              ) : preview ? (
                <img
                  key={preview.url}
                  src={preview.url}
                  alt=""
                  className={cn(
                    'h-full w-full object-cover transition-all duration-500',
                    phase === 'done' || phase === 'finishing' ? 'ring-2 ring-foreground/15' : ''
                  )}
                />
              ) : (
                <div className="flex h-full min-h-[7rem] items-center justify-center px-4 text-center text-xs text-muted-foreground">
                  Image appears here
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error.message}
              {isNotConfigured ? (
                <>
                  {' '}
                  <Link href={routes.VIVID_PROFILE.path} className="underline underline-offset-2">
                    Open Profile
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 flex-row items-center justify-start gap-2 border-t border-border/60 px-5 py-4">
          <Button type="button" size="sm" onClick={handleGenerate} disabled={!canGenerate}>
            {isPending ? (
              <>
                <CircleNotchIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : preview ? (
              <>
                <CircleNotchIcon className="mr-1.5 h-3.5 w-3.5" />
                Regenerate
              </>
            ) : (
              <>
                <SparkleIcon className="mr-1.5 h-3.5 w-3.5" />
                Generate
              </>
            )}
          </Button>
          {preview ? (
            <Button type="button" size="sm" variant="outline" onClick={handleAccept}>
              Use as cover
            </Button>
          ) : null}
          {attempts > 0 ? (
            <span
              className="ml-auto text-[11px] text-muted-foreground tabular-nums"
              title={`Up to ${COVER_GENERATION_MAX_ATTEMPTS} generations per session`}
            >
              Generation {attempts}/{COVER_GENERATION_MAX_ATTEMPTS}
            </span>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
