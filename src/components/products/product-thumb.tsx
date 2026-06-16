import Image from "next/image";
import { Package } from "lucide-react";

interface ProductThumbProps {
  src: string | null | undefined;
  alt: string;
  /** next/image `sizes` (ota element `position: relative` + o'lcham bo'lishi kerak) */
  sizes?: string;
}

/**
 * Mahsulot rasmi yoki rasm bo'lmaganda Package placeholder.
 * Rasm endi IXTIYORIY (F-2) — shuning uchun null/undefined holatini yagona joyda hal qilamiz.
 * `fill` ishlatadi: chaqiruvchi `relative` + o'lchamli konteyner ichiga joylashtirishi shart.
 */
export function ProductThumb({ src, alt, sizes = "48px" }: ProductThumbProps) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
        <Package className="h-1/2 w-1/2" />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;
}
