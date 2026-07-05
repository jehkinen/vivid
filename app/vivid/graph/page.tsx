'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Loader } from '@/components/ui/loader'
import { queryKeys } from '@/lib/query-keys'
import type { PostGraphDto } from '@/types/post-references'

async function fetchGraph(postId?: string, depth = 1): Promise<PostGraphDto> {
  const params = new URLSearchParams({ depth: String(depth) })
  if (postId) params.set('postId', postId)
  const res = await fetch(`/api/graph?${params}`)
  if (!res.ok) throw new Error('Failed to load graph')
  return res.json()
}

export default function GraphPage() {
  const [centerPostId, setCenterPostId] = useState<string | undefined>()
  const [depth, setDepth] = useState<1 | 2>(1)

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.graph.view(centerPostId, depth),
    queryFn: () => fetchGraph(centerPostId, depth),
  })

  const connectionCount = data?.edges.length ?? 0

  return (
    <div className="flex h-full flex-col p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Memory graph</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {connectionCount} connection{connectionCount === 1 ? '' : 's'}
            {centerPostId ? ' in neighborhood' : ' total'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Depth</label>
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value) as 1 | 2)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
          {centerPostId && (
            <button
              type="button"
              onClick={() => setCenterPostId(undefined)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Show all
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">Failed to load graph.</p>
      )}
      {data && !isLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Posts ({data.nodes.length})
            </h2>
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              {data.nodes.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => setCenterPostId(node.id)}
                    className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                      centerPostId === node.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <span className="font-medium block truncate">
                      {node.title || 'Untitled'}
                    </span>
                    <Link
                      href={`/vivid/editor/post/${node.id}`}
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Connections
            </h2>
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto text-sm">
              {data.edges.map((edge, i) => {
                const source = data.nodes.find((n) => n.id === edge.source)
                const target = data.nodes.find((n) => n.id === edge.target)
                return (
                  <li key={`${edge.source}-${edge.target}-${i}`} className="text-muted-foreground">
                    <span className="text-foreground">{source?.title || 'Untitled'}</span>
                    {' → '}
                    <span className="text-foreground">{target?.title || 'Untitled'}</span>
                  </li>
                )
              })}
              {data.edges.length === 0 && (
                <li className="text-muted-foreground">No connections yet.</li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
