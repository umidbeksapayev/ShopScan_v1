import { create } from "zustand";

const KEY = "shopscan_active_shop";

interface ActiveShopState {
  /** Foydalanuvchi tanlagan faol do'kon (bir nechta do'kon a'zosi bo'lsa). */
  activeShopId: string | null;
  setActiveShopId: (id: string) => void;
}

export const useActiveShop = create<ActiveShopState>((set) => ({
  activeShopId:
    typeof window !== "undefined" ? localStorage.getItem(KEY) : null,
  setActiveShopId: (id) => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, id);
    set({ activeShopId: id });
  },
}));
