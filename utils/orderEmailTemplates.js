function money(n) {
  return `KES ${Number(n).toFixed(2)}`;
}

function itemsTable(order) {
  const rows = order.orderItems
    .map((item) => {
      const name = item.product?.name || "Product";
      const qty = item.quantity;
      const unit = Number(item.price);
      const lineTotal = unit * qty;

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${money(unit)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${money(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Product</th>
          <th style="text-align:center;padding:8px;border-bottom:2px solid #ddd;">Qty</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Price</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function customerOrderPlacedEmail(order) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 8px;">Order placed successfully ✅</h2>
      <p style="margin:0 0 12px;">
        Thanks for your order! Your invoice number is <b>${order.invoiceNumber}</b>.
      </p>

      ${itemsTable(order)}

      <div style="margin-top:12px;">
        <p style="margin:4px 0;">Items: <b>${money(order.itemsPrice)}</b></p>
        <p style="margin:4px 0;">Shipping: <b>${money(order.shippingPrice)}</b></p>
        <p style="margin:4px 0;">Tax: <b>${money(order.taxPrice)}</b></p>
        <p style="margin:8px 0;font-size:16px;">Total: <b>${money(order.totalPrice)}</b></p>
      </div>

      <p style="margin-top:18px;">Gamify General Supplies</p>
    </div>
  `;
}

export function adminNewOrderEmail(order, customer) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 8px;">New order placed 🛒</h2>

      <p style="margin:0 0 6px;"><b>Invoice:</b> ${order.invoiceNumber}</p>
      <p style="margin:0 0 6px;"><b>Order ID:</b> ${order.id}</p>
      <p style="margin:0 0 12px;"><b>Customer:</b> ${customer.username} (${customer.email})</p>

      ${itemsTable(order)}

      <p style="margin-top:12px;">Total: <b>${money(order.totalPrice)}</b></p>
    </div>
  `;
}

export const customerOrderDeliveredEmail = (order) => {
  const name = order?.user?.username || "Customer";
  const invoice = order?.invoiceNumber || order?.id;

  const deliveredDate = order?.deliveredAt
    ? new Date(order.deliveredAt).toLocaleString()
    : new Date().toLocaleString();

  return `
    <div style="font-family: Arial, sans-serif; line-height:1.6;">
      <h2>Order Delivered ✅</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>${invoice}</strong> has been delivered.</p>

      <p><strong>Delivered on:</strong> ${deliveredDate}</p>

      <hr />
      <p>— Gamify General Supplies</p>
    </div>
  `;
};
