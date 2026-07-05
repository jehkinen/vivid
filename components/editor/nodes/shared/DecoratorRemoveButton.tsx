import { XIcon } from '@phosphor-icons/react'

export function DecoratorRemoveButton({
  onClick,
  className = 'absolute right-2 top-2 z-10 rounded p-1.5 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70',
  ariaLabel = 'Remove',
}: {
  onClick: () => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <button type="button" onClick={onClick} className={className} aria-label={ariaLabel}>
      <XIcon size={16} />
    </button>
  )
}
