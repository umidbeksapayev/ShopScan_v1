"use client";

import { useState } from "react";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { PermissionKey, MemberPermissions } from "@/types/database";
import { useShop } from "@/hooks/use-shop";
import { useOwnerGuard } from "@/hooks/use-guards";
import {
  useStaff,
  useAddStaff,
  useRemoveStaff,
  useSetPermissions,
} from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const PERMS: PermissionKey[] = [
  "manage_products",
  "purchase",
  "returns",
  "manage_debt",
  "view_reports",
  "view_cost",
];

export default function StaffPage() {
  const { t } = useTranslation();
  const { checking } = useOwnerGuard();
  const { data: shop } = useShop();
  const { data: members, isLoading } = useStaff(shop?.id);
  const addMut = useAddStaff(shop?.id ?? "");
  const removeMut = useRemoveStaff(shop?.id ?? "");
  const permMut = useSetPermissions(shop?.id ?? "");
  const [email, setEmail] = useState("");

  if (checking) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await addMut.mutateAsync(email);
      toast.success(t("staff.added"));
      setEmail("");
    } catch (err) {
      toast.error(t("staff.addError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleRemove(userId: string, label: string) {
    if (!confirm(t("staff.removeConfirm", { name: label }))) return;
    try {
      await removeMut.mutateAsync(userId);
      toast.success(t("staff.removed"));
    } catch (err) {
      toast.error(t("staff.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  function togglePerm(
    userId: string,
    current: MemberPermissions,
    key: PermissionKey,
    checked: boolean
  ) {
    permMut.mutate({ userId, permissions: { ...current, [key]: checked } });
  }

  const owner = (members ?? []).find((m) => m.role === "owner");
  const cashiers = (members ?? []).filter((m) => m.role === "cashier");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("staff.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("staff.subtitle")}</p>
      </div>

      {/* Xodim qo'shish */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5"
      >
        <label htmlFor="staff-email" className="text-sm font-medium text-foreground">
          {t("staff.addTitle")}
        </label>
        <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
          {t("staff.addHint")}
        </p>
        <div className="flex gap-2">
          <Input
            id="staff-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kassir@email.com"
            className="flex-1"
          />
          <Button type="submit" disabled={addMut.isPending || !email.trim()}>
            <UserPlus className="mr-1 h-4 w-4" />
            {addMut.isPending ? t("common.saving") : t("staff.addBtn")}
          </Button>
        </div>
      </form>

      {/* Ega */}
      {owner && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{owner.email}</p>
            <p className="text-xs text-muted-foreground">
              {t("staff.owner")} · {t("staff.allAccess")}
            </p>
          </div>
        </div>
      )}

      {/* Kassirlar */}
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : cashiers.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          {t("staff.noCashiers")}
        </div>
      ) : (
        <ul className="space-y-3">
          {cashiers.map((m) => (
            <li
              key={m.user_id}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.email}</p>
                  <p className="text-xs text-muted-foreground">{t("staff.cashier")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(m.user_id, m.email)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-2.5 border-t pt-3">
                {PERMS.map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between gap-2"
                  >
                    <span className="text-sm text-foreground">
                      {t(`staff.perm_${key}`)}
                    </span>
                    <Switch
                      checked={m.permissions[key] === true}
                      onCheckedChange={(c) =>
                        togglePerm(m.user_id, m.permissions, key, c)
                      }
                    />
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
