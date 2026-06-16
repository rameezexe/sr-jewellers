"use client";

import { createContext, useContext } from "react";
import type { ShopSettings } from "@/lib/money";

/**
 * Makes the owner-editable shop settings (shipping rules) available to client
 * components — the cart drawer, cart page and checkout — which can't read the
 * database directly. Fed by the storefront layout (a server component).
 */
const ShopSettingsContext = createContext<ShopSettings | null>(null);

export function ShopSettingsProvider({
  value,
  children,
}: {
  value: ShopSettings;
  children: React.ReactNode;
}) {
  return (
    <ShopSettingsContext.Provider value={value}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings(): ShopSettings {
  const ctx = useContext(ShopSettingsContext);
  if (!ctx) {
    throw new Error("useShopSettings must be used within <ShopSettingsProvider>");
  }
  return ctx;
}
