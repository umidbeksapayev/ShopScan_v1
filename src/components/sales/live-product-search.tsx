"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types/database";
import { formatCurrency, formatWeight, cn } from "@/lib/utils";
import { matchScore } from "@/lib/translit";
import { Input } from "@/components/ui/input";

interface LiveProductSearchProps {
  products: Product[];
  onSelect: (p: Product) => void;
}

const MIN_CHARS = 2;
const MAX_RESULTS = 8;

/**
 * Sotuvda tezkor qidiruv: 2 harfda jonli dropdown (debounce 220ms, client-side).
 * Lotin/kiril normalizatsiya, ↑/↓ navigatsiya, Enter/klik bilan savatga.
 */
export function LiveProductSearch({ products, onSelect }: LiveProductSearchProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);

  // Debounce — yozish to'xtaganda filtrlanadi
  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 220);
    return () => clearTimeout(id);
  }, [term]);

  const results = useMemo(() => {
    if (debounced.trim().length < MIN_CHARS) return [];
    return products
      .map((p) => ({ p, score: matchScore(p.name, debounced) }))
      .filter((r) => r.score > 0 && r.p.quantity > 0)
      .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
      .slice(0, MAX_RESULTS)
      .map((r) => r.p);
  }, [products, debounced]);

  useEffect(() => {
    setActive(0);
  }, [results]);

  function pick(p: Product) {
    onSelect(p);
    setTerm("");
    setDebounced("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const p = results[active];
      if (p) pick(p);
    }
  }

  const showPanel = debounced.trim().length >= MIN_CHARS;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t("sell.livePlaceholder")}
          className="pl-9"
          aria-label={t("sell.searchAria")}
        />
      </div>

      {showPanel && (
        <div className="overflow-hidden rounded-lg border bg-card">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("sell.nothingFound")}
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((p, idx) => {
                const qtyLabel =
                  p.sale_type === "weight"
                    ? formatWeight(p.quantity)
                    : `${p.quantity} ${t("common.pcs")}`;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pick(p)}
                      onMouseEnter={() => setActive(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                        idx === active ? "bg-accent" : "hover:bg-accent"
                      )}
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(p.selling_price)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {qtyLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
