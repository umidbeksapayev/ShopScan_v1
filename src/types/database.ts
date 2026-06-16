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

export interface Sale {
  id: string;
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

export interface Shop {
  id: string;
  name: string;
  owner_id: string;
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
