import "server-only";
import nodemailer from "nodemailer";
import { SITE } from "@/config/site";
import { formatPaise } from "@/lib/money";

/**
 * Transactional email via the shop owner's Gmail (an "app password", not her
 * real password). Two emails fire per order:
 *   1. Confirmation to the customer.
 *   2. "New order!" alert to the owner so she can pack & ship it.
 *
 * If Gmail credentials are missing we just log and no-op, so local dev still
 * works. Set GMAIL_USER + GMAIL_APP_PASSWORD in .env (see README).
 */

function emailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
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
  paymentMethod: string;
  paymentRef: string;
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

/** Human-readable payment line for the customer's email. */
function customerPaymentLine(order: OrderForEmail): string {
  if (order.paymentMethod === "COD") {
    return `<p style="font-size:14px;"><strong>Payment:</strong> Cash on Delivery — please keep ${formatPaise(
      order.totalPaise,
    )} ready when your parcel arrives.</p>`;
  }
  return `<p style="font-size:14px;"><strong>Payment:</strong> UPI${
    order.paymentRef ? ` (ref ${order.paymentRef})` : ""
  } — we'll confirm it landed in our account and update your order shortly.</p>`;
}

/** Payment line for the owner alert. */
function ownerPaymentLine(order: OrderForEmail): string {
  if (order.paymentMethod === "COD") {
    return `<p style="font-size:14px;"><strong>Payment:</strong> Cash on Delivery — collect ${formatPaise(
      order.totalPaise,
    )} on delivery.</p>`;
  }
  return `<p style="font-size:14px;"><strong>Payment:</strong> UPI — customer reference <strong>${
    order.paymentRef || "—"
  }</strong>. Check your bank/UPI app for ${formatPaise(
    order.totalPaise,
  )}, then mark the order PAID in admin.</p>`;
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
    console.warn(
      "[email] GMAIL_USER/GMAIL_APP_PASSWORD missing — skipping emails for",
      order.orderNumber,
    );
    return;
  }

  const gmailUser = process.env.GMAIL_USER!;
  const from = process.env.EMAIL_FROM || `${SITE.name} <${gmailUser}>`;
  const ownerEmail = process.env.OWNER_EMAIL || gmailUser;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: process.env.GMAIL_APP_PASSWORD },
  });

  // Customer confirmation
  const customerHtml = shell(
    `Thank you for your order, ${order.customerName.split(" ")[0]}! 💕`,
    `<p>We've received your order <strong>${order.orderNumber}</strong> and we're getting it ready to ship.</p>
     ${itemsTable(order)}
     ${customerPaymentLine(order)}
     <h3 style="font-size:15px;margin-top:20px;">Shipping to</h3>
     <p style="font-size:14px;">${shippingBlock(order)}</p>`,
  );

  // Owner alert
  const ownerHtml = shell(
    `🛍️ New order ${order.orderNumber}`,
    `<p>You've got a new order — time to pack and ship!</p>
     ${itemsTable(order)}
     ${ownerPaymentLine(order)}
     <h3 style="font-size:15px;margin-top:20px;">Ship to</h3>
     <p style="font-size:14px;">${shippingBlock(order)}</p>
     <p style="font-size:14px;">Customer email: ${order.email}</p>`,
  );

  try {
    await Promise.all([
      transporter.sendMail({
        from,
        to: order.email,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: customerHtml,
      }),
      transporter.sendMail({
        from,
        to: ownerEmail,
        subject: `New order ${order.orderNumber} — ${formatPaise(order.totalPaise)}`,
        html: ownerHtml,
      }),
    ]);
  } catch (err) {
    // Never let an email failure break the order flow.
    console.error("[email] send failed for", order.orderNumber, err);
  }
}
