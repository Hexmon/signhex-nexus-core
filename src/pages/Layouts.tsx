import { useEffect, useMemo, useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCw, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { SearchBar } from "@/components/common/SearchBar";
import { useToast } from "@/hooks/use-toast";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { Input } from "@/components/ui/input";
import { layoutsApi } from "@/api/domains/layouts";
import { queryKeys } from "@/api/queryKeys";
import type { LayoutItem, LayoutListParams } from "@/api/types";

const ITEMS_PER_PAGE = 20;
const aspectRatios = ["16:9", "9:16", "1:1", "4:3", "21:9"];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

const Layouts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [aspectRatioFilter, setAspectRatioFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<LayoutItem | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");

  const trimmedSearchQuery = searchQuery.trim();
  const aspectRatioQuery = aspectRatioFilter === "all" ? undefined : aspectRatioFilter;

  useEffect(() => {
    setPage(1);
  }, [trimmedSearchQuery, aspectRatioFilter]);

  useEffect(() => {
    setConfirmationInput("");
  }, [deleteTarget?.id]);

  const filters = useMemo<LayoutListParams>(() => {
    const params: LayoutListParams = {
      page,
      limit: ITEMS_PER_PAGE,
    };
    if (trimmedSearchQuery) {
      params.search = trimmedSearchQuery;
    }
    if (aspectRatioQuery) {
      params.aspect_ratio = aspectRatioQuery;
    }
    return params;
  }, [page, trimmedSearchQuery, aspectRatioQuery]);

  const queryKey = useMemo(
    () =>
      queryKeys.layouts({
        page,
        limit: ITEMS_PER_PAGE,
        search: trimmedSearchQuery || undefined,
        aspect_ratio: aspectRatioQuery,
      }),
    [page, trimmedSearchQuery, aspectRatioQuery],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => layoutsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });

  const deleteLayoutMutation = useSafeMutation({
    mutationFn: (layoutId: string) => layoutsApi.remove(layoutId),
    onSuccess: () => {
      refetch();
    },
  }, "Unable to delete layout.");

  const pagination = data?.pagination ?? { page, limit: ITEMS_PER_PAGE, total: 0 };
  const layouts = data?.items ?? [];
  const totalPages =
    pagination.limit > 0 ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;
  const hasMultiplePages = pagination.total > pagination.limit;

  const paginationPages = useMemo<Array<number | "ellipsis">>(() => {
    if (!hasMultiplePages) return [];
    const pages: Array<number | "ellipsis"> = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("ellipsis");
      }
    }

    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  }, [hasMultiplePages, page, totalPages]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const canConfirmDelete =
    Boolean(deleteTarget && confirmationInput.trim() === deleteTarget.name);

  const handleDelete = async () => {
    if (!deleteTarget || !canConfirmDelete) return;
    const targetName = deleteTarget.name;
    try {
      await deleteLayoutMutation.mutateAsync(deleteTarget.id);
      toast({
        title: "Layout deleted",
        description: `"${targetName}" has been removed.`,
      });
      setConfirmationInput("");
      setDeleteTarget(null);
    } catch {
      // Error toast handled by useSafeMutation; keep dialog open for retry.
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Layouts refreshed",
      description: "Layout list has been updated.",
    });
  };

  const errorMessage =
    error instanceof Error ? error.message : "Unable to load layouts right now.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Layouts</h1>
          <p className="text-muted-foreground">
            Manage mosaic templates used to place content on screens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/layouts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Layout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="Search by name or description..."
            onSearch={setSearchQuery}
          />
        </div>
        <div className="flex items-center gap-6">
          <Select value={aspectRatioFilter} onValueChange={setAspectRatioFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Aspect Ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratios</SelectItem>
              {aspectRatios.map((ratio) => (
                <SelectItem key={ratio} value={ratio}>
                  {ratio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {isFetching ? "Refreshing..." : `${pagination.total} layouts`}
          </p>
        </div>
      </div>

      {/* Table or Empty/Error States */}
      {isLoading ? (
        <div className="rounded-md border p-6">
          <LoadingIndicator label="Loading layouts..." />
        </div>
      ) : isError ? (
        <EmptyState
          title="Unable to load layouts"
          description={errorMessage}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : layouts.length === 0 ? (
        <EmptyState
          title="No layouts found"
          description="Try a different search term or create a new layout."
          actionLabel="Create layout"
          onAction={() => navigate("/layouts/new")}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Aspect Ratio</TableHead>
                <TableHead>Slots</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layouts.map((layout) => (
                <TableRow key={layout.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                      {layout.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {layout.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{layout.aspect_ratio}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{layout.spec.slots.length}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(layout.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/layouts/${layout.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(layout)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {hasMultiplePages && (
        <div className="flex justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={!canGoPrev}
                  className={!canGoPrev ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    if (!canGoPrev) {
                      event.preventDefault();
                      return;
                    }
                    event.preventDefault();
                    setPage((prev) => Math.max(prev - 1, 1));
                  }}
                />
              </PaginationItem>
              {paginationPages.map((pageItem, index) =>
                pageItem === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${pageItem}`}>
                    <PaginationLink
                      href="#"
                      isActive={pageItem === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageItem);
                      }}
                    >
                      {pageItem}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  aria-disabled={!canGoNext}
                  className={!canGoNext ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    if (!canGoNext) {
                      event.preventDefault();
                      return;
                    }
                    event.preventDefault();
                    setPage((prev) => Math.min(prev + 1, totalPages));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete layout?"
        description="This will permanently remove the layout template. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteLayoutMutation.isPending}
        confirmDisabled={!canConfirmDelete}
      >
        {deleteTarget && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please type <span className="font-medium text-foreground">{deleteTarget.name}</span> to confirm.
            </p>
            <Input
              value={confirmationInput}
              onChange={(event) => setConfirmationInput(event.target.value)}
              placeholder="Layout name"
              aria-label="Confirm layout name"
              className="w-full"
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default Layouts;
