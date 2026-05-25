'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Image as ImageIcon,
  Code2,
  Mic,
  Search,
  LayoutGrid,
  List,
  Star,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface DocumentTemplate {
  id: string
  name: string
  outputType: string
  icon: string | null
}

interface Document {
  id: string
  title: string
  input: string
  output: string
  templateId: string | null
  wordsCount: number | null
  model: string | null
  language: string | null
  tone: string | null
  isFavorite: boolean
  createdAt: string
  template: DocumentTemplate | null
}

interface DocumentsResponse {
  documents: Document[]
  total: number
  page: number
  totalPages: number
}

function getTypeIcon(type: string | null) {
  switch (type) {
    case 'image':
      return ImageIcon
    case 'code':
      return Code2
    case 'audio':
    case 'transcription':
      return Mic
    default:
      return FileText
  }
}

function getTypeLabel(type: string | null) {
  switch (type) {
    case 'image':
      return 'Image'
    case 'code':
      return 'Code'
    case 'audio':
    case 'transcription':
      return 'Transcription'
    default:
      return 'Text'
  }
}

function getTypeColor(type: string | null) {
  switch (type) {
    case 'image':
      return 'text-purple-500 bg-purple-500/10'
    case 'code':
      return 'text-cyan-500 bg-cyan-500/10'
    case 'audio':
    case 'transcription':
      return 'text-amber-500 bg-amber-500/10'
    default:
      return 'text-emerald-500 bg-emerald-500/10'
  }
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

export function DocumentsPage() {
  const { setActivePage } = useAppStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<Document | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
        ...(search ? { search } : {}),
        ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      })
      const res = await fetch(`/api/documents?${params}`)
      if (res.ok) {
        const data: DocumentsResponse = await res.json()
        setDocuments(data.documents)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [page, sort, search, typeFilter])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, sort])

  const toggleFavorite = async (doc: Document) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, isFavorite: !doc.isFavorite }),
      })
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, isFavorite: !d.isFavorite } : d
          )
        )
        toast.success(doc.isFavorite ? 'Removed from favorites' : 'Added to favorites')
      }
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const deleteDocument = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
        setTotal((prev) => prev - 1)
        toast.success('Document deleted')
      }
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleDownload = (doc: Document) => {
    const blob = new Blob([doc.output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Download started')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6 text-emerald-500" />
            My Documents
          </h2>
          <p className="text-muted-foreground">
            Browse and manage all your generated content
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="text">Text Documents</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="audio">Transcriptions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
                <SelectItem value="most-words">Most Words</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className={`rounded-r-none ${viewMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={`rounded-l-none ${viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${total} document${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
            <FolderOpen className="size-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start creating content to see your documents here
          </p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setActivePage('writer')}
          >
            <FileText className="size-4 mr-2" />
            Start Writing
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {documents.map((doc) => {
              const TypeIcon = getTypeIcon(doc.template?.outputType ?? null)
              const colorClass = getTypeColor(doc.template?.outputType ?? null)
              const previewText = doc.output
                ? doc.output.substring(0, 100) + (doc.output.length > 100 ? '...' : '')
                : 'No preview available'

              return (
                <motion.div
                  key={doc.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  className="transition-shadow hover:shadow-md"
                >
                  <Card className="overflow-hidden group cursor-pointer h-full flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-lg ${colorClass}`}>
                            <TypeIcon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm truncate max-w-[180px]">
                              {doc.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {doc.template?.name || getTypeLabel(doc.template?.outputType ?? null)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(doc)
                            }}
                          >
                            <Star
                              className={`size-4 ${
                                doc.isFavorite
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewTarget(doc)
                                  setViewDialogOpen(true)
                                }}
                              >
                                <Eye className="size-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="size-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setDeleteTarget(doc)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {previewText}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {getTypeLabel(doc.template?.outputType ?? null)}
                          </Badge>
                          {doc.wordsCount && (
                            <span className="text-[10px] text-muted-foreground">
                              {doc.wordsCount} words
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(doc.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* List View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Words</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {documents.map((doc) => {
                  const TypeIcon = getTypeIcon(doc.template?.outputType ?? null)
                  const colorClass = getTypeColor(doc.template?.outputType ?? null)

                  return (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/50 border-b transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${colorClass}`}>
                            <TypeIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[250px]">
                              {doc.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {doc.template?.name || 'No template'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(doc.template?.outputType ?? null)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatRelativeTime(doc.createdAt)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {doc.wordsCount ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => toggleFavorite(doc)}
                          >
                            <Star
                              className={`size-4 ${
                                doc.isFavorite
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-8 p-0">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewTarget(doc)
                                  setViewDialogOpen(true)
                                }}
                              >
                                <Eye className="size-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="size-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setDeleteTarget(doc)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first, last, and pages near current
              if (totalPages <= 7) return true
              if (p === 1 || p === totalPages) return true
              if (Math.abs(p - page) <= 1) return true
              return false
            })
            .map((p, idx, arr) => {
              const prev = arr[idx - 1]
              const showEllipsis = prev && p - prev > 1
              return (
                <span key={p} className="flex items-center gap-2">
                  {showEllipsis && <span className="text-muted-foreground text-sm">...</span>}
                  <Button
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className={`size-8 p-0 ${page === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                </span>
              )
            })}
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewTarget && (() => {
                const TypeIcon = getTypeIcon(viewTarget.template?.outputType ?? null)
                return <TypeIcon className="size-5 text-emerald-500" />
              })()}
              {viewTarget?.title}
            </DialogTitle>
            <DialogDescription>
              {viewTarget?.template?.name || 'Document'} • {viewTarget && formatRelativeTime(viewTarget.createdAt)}
              {viewTarget?.wordsCount ? ` • ${viewTarget.wordsCount} words` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                {viewTarget?.output}
              </pre>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {viewTarget && (
              <Button
                variant="outline"
                onClick={() => handleDownload(viewTarget)}
              >
                <Download className="size-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteDocument(deleteTarget)}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
