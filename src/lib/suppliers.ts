import { createClient } from "@/lib/supabase/client";
import type { Supplier } from "@/types/database";

/** Ta'minotchilar ro'yxati (eng yangisi birinchi). */
export async function listSuppliers(shopId: string): Promise<Supplier[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Supplier[];
}

export interface CreateSupplierInput {
  shop_id: string;
  name: string;
  phone?: string | null;
  note?: string | null;
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      shop_id: input.shop_id,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      note: input.note?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}
