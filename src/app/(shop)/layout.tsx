import { CartProvider } from "@/components/cart-context";
import { ShopSettingsProvider } from "@/components/shop-settings-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { getShopSettings } from "@/lib/settings";

/**
 * Storefront chrome — header, footer and the slide-in cart. The admin area
 * lives outside this route group, so it doesn't get the shop header/cart.
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getShopSettings();

  return (
    <ShopSettingsProvider value={settings}>
      <CartProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </CartProvider>
    </ShopSettingsProvider>
  );
}
