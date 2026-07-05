'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CircleNotchIcon, SparkleIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { buildCoverPrompt } from '@/lib/ai/build-cover-prompt'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useGenerateCover } from '@/hooks/api/use-generate-cover'
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

  useEffect(() => {
    if (!open) return
    if (!promptEdited) {
      setPromptOverride(promptPreview.prompt)
    }
  }, [open, promptPreview.prompt, promptEdited])

  useEffect(() => {
    if (!open) {
      reset()
      setPreview(null)
      setAttempts(0)
      setPromptEdited(false)
      setStylePreset('editorial')
    }
  }, [open, reset])

  const handleStyleChange = (preset: CoverStylePreset) => {
    setStylePreset(preset)
    if (!promptEdited) {
      const next = buildCoverPrompt({
        title,
        plaintext,
        tagNames,
        stylePreset: preset,
      })
      setPromptOverride(next.prompt)
    }
  }

  const handleGenerate = async () => {
    if (!openAiConfigured || !promptPreview.sufficient || attempts >= COVER_GENERATION_MAX_ATTEMPTS) return
    const media = await generate(postId, {
      stylePreset,
      promptOverride: promptOverride.trim() || undefined,
      draft: { title, plaintext, tagNames },
      replaceMediaId: replaceMediaId ?? preview?.id,
    })
    if (media) {
      setPreview(media)
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
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Generate cover</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {!openAiConfigured ? (
            <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Add your OpenAI API key in{' '}
              <Link href={routes.VIVID_PROFILE.path} className="text-foreground underline underline-offset-2">
                Profile
              </Link>{' '}
              to generate covers.
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Used from your post</p>
            <div className="flex flex-wrap gap-2">
              {promptPreview.sourceParts.title ? (
                <span className="rounded-full border border-border/70 bg-muted/25 px-2.5 py-1 text-xs text-foreground">
                  {promptPreview.sourceParts.title}
                </span>
              ) : null}
              {promptPreview.sourceParts.excerpt ? (
                <span className="max-w-full truncate rounded-full border border-border/70 bg-muted/25 px-2.5 py-1 text-xs text-muted-foreground">
                  {promptPreview.sourceParts.excerpt}
                </span>
              ) : null}
              {promptPreview.sourceParts.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/70 bg-muted/25 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            {!promptPreview.sufficient ? (
              <p className="text-xs text-muted-foreground">Write a title or a few sentences before generating.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Style</p>
            <div className="flex flex-wrap gap-2">
              {COVER_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleStyleChange(preset.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
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

          <div className="space-y-2">
            <label htmlFor="cover-prompt" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prompt
            </label>
            <textarea
              id="cover-prompt"
              value={promptOverride}
              onChange={(e) => {
                setPromptEdited(true)
                setPromptOverride(e.target.value)
              }}
              rows={5}
              className="w-full resize-y rounded-md border border-border/80 bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border/70 bg-muted/20">
              {preview ? (
                <img
                  src={preview.url}
                  alt=""
                  className={cn(
                    'h-full w-full object-cover transition-all duration-500',
                    phase === 'done' || phase === 'finishing'
                      ? 'scale-100 opacity-100 ring-2 ring-foreground/15'
                      : 'scale-100 opacity-100'
                  )}
                />
              ) : isPending ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CircleNotchIcon className="h-6 w-6 animate-spin" />
                  {activePhase ? <span>{activePhase}</span> : null}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Generated cover will appear here
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
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

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleGenerate} disabled={!canGenerate}>
              {isPending ? (
                <>
                  <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : preview ? (
                <>
                  <CircleNotchIcon className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <SparkleIcon className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
            {preview ? (
              <Button type="button" variant="outline" onClick={handleAccept}>
                Use as cover
              </Button>
            ) : null}
            {attempts > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                Attempt {attempts}/{COVER_GENERATION_MAX_ATTEMPTS}
              </span>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
