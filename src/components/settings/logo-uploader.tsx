"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Store, Upload, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage, deleteProductImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface LogoUploaderProps {
  shopId: string;
  logoUrl: string | null | undefined;
}

/** Do'kon logosini yuklash/o'zgartirish/o'chirish. Mavjud product-images bucket'idan foydalanadi. */
export function LogoUploader({ shopId, logoUrl }: LogoUploaderProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function saveLogo(url: string | null) {
    const supabase = createClient();
    const { error } = await supabase.from("shops").update({ logo_url: url }).eq("id", shopId);
    if (error) throw error;
    // Eski faylni o'chirishga urinamiz (xato bo'lsa jim — UI'ni bloklamaydi)
    if (logoUrl) deleteProductImage(logoUrl).catch(() => {});
    qc.invalidateQueries({ queryKey: ["memberships"] });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadProductImage(file, shopId);
      await saveLogo(url);
      toast.success(t("settings.logoSaved"));
    } catch (err) {
      toast.error(t("settings.logoError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await saveLogo(null);
      toast.success(t("settings.logoRemoved"));
    } catch (err) {
      toast.error(t("settings.logoError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
        {logoUrl ? (
          <Image src={logoUrl} alt={t("settings.logoLabel")} fill sizes="80px" className="object-cover" />
        ) : (
          <Store className="h-8 w-8 text-muted-foreground/40" />
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {logoUrl ? t("settings.logoChange") : t("settings.logoUpload")}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> {t("settings.logoRemove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.logoHint")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
