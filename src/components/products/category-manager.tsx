"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, FolderTree } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useCategories,
  useCreateCategory,
  useRenameCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();
  const createMut = useCreateCategory();
  const renameMut = useRenameCategory();
  const deleteMut = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate() {
    const nm = newName.trim();
    if (!nm) return;
    try {
      await createMut.mutateAsync(nm);
      setNewName("");
      toast.success(t("category.created"));
    } catch (err) {
      toast.error(t("category.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleRename(id: string) {
    const nm = editName.trim();
    if (!nm) return;
    try {
      await renameMut.mutateAsync({ id, name: nm });
      setEditingId(null);
      toast.success(t("category.renamed"));
    } catch (err) {
      toast.error(t("category.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleDelete(id: string, name: string, count: number) {
    if (!confirm(t("category.deleteConfirm", { name, count }))) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success(t("category.deleted"));
    } catch (err) {
      toast.error(t("category.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("category.manageTitle")}</DialogTitle>
          <DialogDescription>{t("category.manageHint")}</DialogDescription>
        </DialogHeader>

        {/* Yangi kategoriya qo'shish */}
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("category.namePlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
          <Button onClick={handleCreate} disabled={createMut.isPending || !newName.trim()}>
            <Plus className="mr-1 h-4 w-4" /> {t("common.add")}
          </Button>
        </div>

        {/* Ro'yxat */}
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : !categories || categories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              <FolderTree className="h-8 w-8 text-muted-foreground/40" />
              {t("category.empty")}
            </div>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
              >
                {editingId === c.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(c.id);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRename(c.id)}
                      disabled={renameMut.isPending || !editName.trim()}
                      aria-label={t("common.save")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingId(null)}
                      aria-label={t("common.cancel")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {c.name}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {t("category.productCount", { count: c.product_count })}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={t("common.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.name, c.product_count)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
