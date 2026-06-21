import { create } from "zustand";
import type { Product, SearchMethod } from "@/types/database";

export interface CartItem {
  product: Product;
  quantity: number;
  method: SearchMethod; // qaysi usul bilan qo'shildi (FR-30)
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, method: SearchMethod) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalRevenue: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, quantity, method) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        // Mavjud bo'lsa miqdorni qo'shamiz (qoldiqdan oshmasin)
        const newQty = Math.min(existing.quantity + quantity, product.quantity);
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: newQty } : i
          ),
        };
      }
      return {
        items: [...state.items, { product, quantity: Math.min(quantity, product.quantity), method }],
      };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(0, Math.min(quantity, i.product.quantity)) }
          : i
      ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),

  clear: () => set({ items: [] }),

  totalRevenue: () =>
    // VAZN sotuvida narx × kasr miqdor suzuvchi-nuqta drift berishi mumkin
    // (0.1*0.2=0.30000000000000004) → tiyin aniqligida yaxlitlaymiz.
    Math.round(
      get().items.reduce((sum, i) => sum + i.product.selling_price * i.quantity, 0) * 100
    ) / 100,

  itemCount: () => get().items.length,
}));
