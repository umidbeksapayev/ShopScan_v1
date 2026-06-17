export type SaleType = "unit" | "weight";
export type SearchMethod = "barcode" | "visual" | "manual";

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  sale_type: SaleType;
  cost_price: number;
  selling_price: number;
  profit_per_unit: number;
  quantity: number;
  low_stock_alert: number;
  barcode: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  shop_id: string;
  product_id: string;
  sale_type: SaleType;
  quantity_sold: number;
  cost_price_snapshot: number;
  selling_price_snapshot: number;
  total_revenue: number;
  total_profit: number;
  search_method: SearchMethod;
  sold_at: string;
  product?: Pick<Product, "name" | "image_url" | "sale_type">;
}

/** Sotuvga biriktirilgan qaytarish qisqacha (tarix badge'i uchun). */
export interface SaleReturnSummary {
  id: string;
  total_refund: number;
}

/** Sotuv sarlavhasi (header): bitta sotuv = bitta yozuv, ichida sale_items. */
export interface Sale {
  id: string;
  shop_id: string;
  customer_id: string | null;
  total_revenue: number;
  total_profit: number;
  item_count: number;
  paid_amount: number;
  search_method: SearchMethod;
  sold_at: string;
  items?: SaleItem[];
  returns?: SaleReturnSummary[];
}

/** Qaytarish sarlavhasi (return/refund). */
export interface Return {
  id: string;
  shop_id: string;
  sale_id: string;
  total_refund: number;
  total_profit: number;
  reason: string | null;
  created_at: string;
  items?: ReturnItem[];
}

/** Qaytarilgan qator. */
export interface ReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  product_id: string;
  shop_id: string;
  sale_id: string;
  quantity: number;
  refund_amount: number;
  profit_amount: number;
  created_at: string;
}

/** Ta'minotchi. */
export interface Supplier {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
}

/** Kirim qatori. */
export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  shop_id: string;
  quantity: number;
  cost_price: number;
  created_at: string;
  product?: Pick<Product, "name" | "image_url" | "sale_type">;
}

/** Kirim sarlavhasi (mahsulot kirimi / stock-in). */
export interface Purchase {
  id: string;
  shop_id: string;
  supplier_id: string | null;
  total: number;
  note: string | null;
  created_at: string;
  supplier?: { name: string } | null;
  items?: PurchaseItem[];
}

/** Mijoz (qarz daftari). */
export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
}

/** Mijoz + joriy qarz balansi (get_customers_with_balance RPC). */
export interface CustomerWithBalance {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
  balance: number;
}

/** Mijozning qarz to'lovi (qaytarib berish). */
export interface CustomerPayment {
  id: string;
  shop_id: string;
  customer_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
}

export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export type MemberRole = "owner" | "cashier";

/** Kassirga yoqib/o'chiriladigan ruxsatlar (ega = hammasi). */
export type PermissionKey =
  | "manage_products"
  | "purchase"
  | "returns"
  | "manage_debt"
  | "view_reports"
  | "view_cost";

export type MemberPermissions = Partial<Record<PermissionKey, boolean>>;

/** Xodim ro'yxati qatori (list_shop_members RPC). */
export interface ShopMemberRow {
  user_id: string;
  email: string;
  role: MemberRole;
  permissions: MemberPermissions;
  created_at: string;
}

export interface DashboardStats {
  today_revenue: number;
  today_profit: number;
  today_sales_count: number;
  low_stock_count: number;
}

export interface ProductFormData {
  name: string;
  sale_type: SaleType;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_alert: number;
  barcode?: string;
  image_file?: File;
}
