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

function gmailTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER!, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || `${SITE.name} <${process.env.GMAIL_USER}>`;
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

  const from = fromAddress();
  const ownerEmail = process.env.OWNER_EMAIL || process.env.GMAIL_USER!;
  const transporter = gmailTransport();

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

// ── Status update emails (sent to the customer when the owner changes status) ─
type StatusEmailOrder = {
  orderNumber: string;
  customerName: string;
  email: string;
  status: string;
  totalPaise: number;
};

// Only these statuses notify the customer. PENDING/PROCESSING are internal.
const STATUS_EMAIL: Record<
  string,
  { subject: string; heading: string; body: string }
> = {
  PAID: {
    subject: "Payment received",
    heading: "Payment received 💕",
    body: "We've confirmed your payment. Your order is now being prepared — we'll email you again as soon as it ships.",
  },
  SHIPPED: {
    subject: "Your order has shipped",
    heading: "Your order is on its way! 📦",
    body: "Great news — your order has been shipped and should reach you within 3–5 working days.",
  },
  DELIVERED: {
    subject: "Your order was delivered",
    heading: "Delivered! 🎁",
    body: "Your order has been delivered. We hope you love it! If anything isn't right, just reply to this email.",
  },
  CANCELLED: {
    subject: "Your order was cancelled",
    heading: "Order cancelled",
    body: "Your order has been cancelled. If this was unexpected or you have any questions, please reply and we'll help.",
  },
  REFUNDED: {
    subject: "Refund issued",
    heading: "Refund issued",
    body: "We've issued a refund for your order. It may take a few working days to reflect in your account.",
  },
};

/** Returns true if a given status sends a customer email. */
export function statusNotifiesCustomer(status: string): boolean {
  return status in STATUS_EMAIL;
}

export async function sendStatusUpdateEmail(order: StatusEmailOrder): Promise<void> {
  const copy = STATUS_EMAIL[order.status];
  if (!copy) return; // nothing to send for this status
  if (!emailConfigured()) {
    console.warn(
      "[email] Gmail not configured — skipping status email for",
      order.orderNumber,
    );
    return;
  }

  const html = shell(
    `Hi ${order.customerName.split(" ")[0]} — ${copy.heading}`,
    `<p>${copy.body}</p>
     <p style="font-size:14px;">Order <strong>${order.orderNumber}</strong> · Total ${formatPaise(
       order.totalPaise,
     )}</p>`,
  );

  try {
    await gmailTransport().sendMail({
      from: fromAddress(),
      to: order.email,
      subject: `${copy.subject} — ${order.orderNumber}`,
      html,
    });
  } catch (err) {
    console.error("[email] status email failed for", order.orderNumber, err);
  }
}
