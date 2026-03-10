"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLogEntry } from "@/lib/types";

const actionColors = {
  created: "default" as const,
  updated: "secondary" as const,
  deleted: "destructive" as const,
};

export function AuditLogTable() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);
    if (actionFilter) params.set("action", actionFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    fetch(`/api/audit-log?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setEntries(json.data);
          setTotalCount(json.count ?? 0);
        }
      });
  }, [entityTypeFilter, actionFilter, page, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={entityTypeFilter}
          onValueChange={(v) => {
            setEntityTypeFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="profile">Profile</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="w-[80px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.user?.full_name ?? "System"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionColors[entry.action]} className="capitalize">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{entry.entity_type}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {entry.entity_id.slice(0, 8)}...
                    </span>
                  </TableCell>
                  <TableCell>
                    {entry.changes && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDetailEntry(entry)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {detailEntry && (
        <Dialog open={!!detailEntry} onOpenChange={(open) => { if (!open) setDetailEntry(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-xs">
                {JSON.stringify(detailEntry.changes, null, 2)}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
