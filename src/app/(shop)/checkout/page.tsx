import { CheckoutClient } from "@/components/checkout-client";
import { upiConfigured } from "@/lib/payments";

// Payment availability is read on the server (the UPI ID stays server-side);
// only a boolean is handed to the client.
export default function CheckoutPage() {
  return <CheckoutClient upiEnabled={upiConfigured()} />;
}
