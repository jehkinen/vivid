'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { useDeletedPosts, useRestorePost, useHardDeletePost } from '@/hooks/api/use-posts'
import { formatDateTime } from '@/lib/utils'

export default function DeletedPostsPage() {
  const router = useRouter()
  const { data: posts = [], isLoading } = useDeletedPosts()
  const restorePost = useRestorePost()
  const hardDeletePost = useHardDeletePost()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const handleRestore = (id: string) => {
    restorePost.mutate(id, {
      onSuccess: () => {
        router.push('/vivid/posts')
      },
    })
  }

  const handleDeletePermanently = () => {
    if (!selectedPostId) return
    hardDeletePost.mutate(selectedPostId, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedPostId(null)
      },
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Deleted Posts</h1>
        <Button variant="outline" onClick={() => router.push('/vivid/posts')}>
          Back to Posts
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No deleted posts found
                </TableCell>
              </TableRow>
            ) : (
              posts
                .filter((post: any) => post.deletedAt)
                .map((post: any) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title || 'Untitled'}</TableCell>
                    <TableCell>{formatDateTime(post.deletedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(post.id)}
                          disabled={restorePost.isPending}
                        >
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedPostId(post.id)
                            setDeleteDialogOpen(true)
                          }}
                          disabled={hardDeletePost.isPending}
                        >
                          Delete Permanently
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this post? This action cannot be undone
              and will delete all associated media files.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePermanently}
              disabled={hardDeletePost.isPending}
            >
              {hardDeletePost.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}