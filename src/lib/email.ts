import "server-only";
import { Resend } from "resend";
import { SITE } from "@/config/site";
import { formatPaise } from "@/lib/money";

/**
 * Transactional email via Resend. Two emails fire when an order is paid:
 *   1. Confirmation to the customer.
 *   2. "New order!" alert to the shop owner (your mom) so she can ship it.
 *
 * If RESEND_API_KEY is missing we just log and no-op, so local dev still works.
 */

function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type OrderForEmail = {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  items: { name: string; quantity: number; pricePaise: number }[];
};

function itemsTable(order: OrderForEmail): string {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0e6e6;">${i.name} &times; ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0e6e6;text-align:right;">${formatPaise(
          i.pricePaise * i.quantity,
        )}</td>
      </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
    ${rows}
    <tr><td style="padding:8px 0;">Subtotal</td><td style="padding:8px 0;text-align:right;">${formatPaise(
      order.subtotalPaise,
    )}</td></tr>
    <tr><td style="padding:4px 0;">Shipping</td><td style="padding:4px 0;text-align:right;">${
      order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)
    }</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;">${formatPaise(
      order.totalPaise,
    )}</td></tr>
  </table>`;
}

function shippingBlock(order: OrderForEmail): string {
  return `${order.customerName}<br/>
    ${order.addressLine1}${order.addressLine2 ? "<br/>" + order.addressLine2 : ""}<br/>
    ${order.city}, ${order.state} — ${order.pincode}<br/>
    📞 ${order.phone}${order.notes ? `<br/><em>Note: ${order.notes}</em>` : ""}`;
}

function shell(title: string, body: string): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#3e2a2e;">
    <h1 style="font-size:22px;color:#c96b86;">${SITE.name}</h1>
    <h2 style="font-size:18px;">${title}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#9b8585;">${SITE.name} · ${SITE.email}</p>
  </div>`;
}

export async function sendOrderEmails(order: OrderForEmail): Promise<void> {
  if (!emailConfigured()) {
    console.warn("[email] RESEND_API_KEY missing — skipping emails for", order.orderNumber);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
  const ownerEmail = process.env.OWNER_EMAIL ?? SITE.email;

  // Customer confirmation
  const customerHtml = shell(
    `Thank you for your order, ${order.customerName.split(" ")[0]}! 💕`,
    `<p>We've received your order <strong>${order.orderNumber}</strong> and we're getting it ready to ship.</p>
     ${itemsTable(order)}
     <h3 style="font-size:15px;margin-top:20px;">Shipping to</h3>
     <p style="font-size:14px;">${shippingBlock(order)}</p>`,
  );

  // Owner alert
  const ownerHtml = shell(
    `🛍️ New order ${order.orderNumber}`,
    `<p>You've got a new paid order — time to pack and ship!</p>
     ${itemsTable(order)}
     <h3 style="font-size:15px;margin-top:20px;">Ship to</h3>
     <p style="font-size:14px;">${shippingBlock(order)}</p>
     <p style="font-size:14px;">Customer email: ${order.email}</p>`,
  );

  try {
    await Promise.all([
      resend.emails.send({
        from,
        to: order.email,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: customerHtml,
      }),
      resend.emails.send({
        from,
        to: ownerEmail,
        subject: `New order ${order.orderNumber} — ${formatPaise(order.totalPaise)}`,
        html: ownerHtml,
      }),
    ]);
  } catch (err) {
    // Never let an email failure break the payment flow.
    console.error("[email] send failed for", order.orderNumber, err);
  }
}
