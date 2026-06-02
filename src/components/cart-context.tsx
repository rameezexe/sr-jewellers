"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Client-side cart. Lives entirely in the browser (React state + localStorage)
 * until checkout, when it's POSTed to the server to create a real order. No
 * server-side cart/session needed.
 */

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  pricePaise: number;
  imageUrl: string;
  quantity: number;
  /** Available stock, so we never let the qty exceed what's in stock. */
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalPaise: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ss_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  // Load from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after initial hydration).
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, item.stock);
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, ...item, quantity: nextQty }
            : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.stock) }];
    });
    setOpen(true);
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotalPaise } = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.count += i.quantity;
        acc.subtotalPaise += i.quantity * i.pricePaise;
        return acc;
      },
      { count: 0, subtotalPaise: 0 },
    );
  }, [items]);

  const value: CartContextValue = {
    items,
    count,
    subtotalPaise,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    isOpen,
    setOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
