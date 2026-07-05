'use client'

type TagHeaderProps = {
  isNew: boolean
}

export function TagHeader({ isNew }: TagHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2">
        {isNew ? 'New Tag' : 'Edit Tag'}
      </h1>
    </div>
  )
}
