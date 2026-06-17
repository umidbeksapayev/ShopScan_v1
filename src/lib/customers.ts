import { createClient } from "@/lib/supabase/client";
import type {
  Customer,
  CustomerWithBalance,
  CustomerPayment,
  Sale,
} from "@/types/database";

/** Mijozlar + joriy balans (get_customers_with_balance RPC — balans bo'yicha tartiblangan). */
export async function listCustomersWithBalance(
  shopId: string
): Promise<CustomerWithBalance[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_customers_with_balance", {
    p_shop_id: shopId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerWithBalance[];
}

/**
 * Mijozlar ro'yxati (balanssiz) — checkout pickeri uchun. A'zolik darajasidagi
 * RLS, ya'ni kassir ham nasiya sotuvida mijoz tanlay oladi (manage_debt shart emas).
 */
export async function listCustomers(shopId: string): Promise<Customer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Customer[];
}

export interface CreateCustomerInput {
  shop_id: string;
  name: string;
  phone?: string | null;
  note?: string | null;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      shop_id: input.shop_id,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      note: input.note?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function getCustomer(id: string): Promise<Customer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

/** Mijozning barcha sotuvlari (qatorlari bilan) — eng yangisi birinchi. */
export async function getCustomerSales(customerId: string): Promise<Sale[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(
      "*, items:sale_items(*, product:products(name, image_url, sale_type))"
    )
    .eq("customer_id", customerId)
    .order("sold_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Sale[];
}

export async function getCustomerPayments(
  customerId: string
): Promise<CustomerPayment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("paid_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerPayment[];
}

export interface RecordPaymentInput {
  shopId: string;
  customerId: string;
  amount: number;
  note?: string | null;
}

/** Qarz to'lovini qabul qilish (record_customer_payment RPC). Yangi balansni qaytaradi. */
export async function recordPayment(
  input: RecordPaymentInput
): Promise<{ balance: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("record_customer_payment", {
    p_shop_id: input.shopId,
    p_customer_id: input.customerId,
    p_amount: input.amount,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { balance: number };
}
