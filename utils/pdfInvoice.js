import PDFDocument from "pdfkit";
import { Buffer } from "buffer";

function buildInvoicePdf(doc, order) {
  doc.fontSize(22).text("Gamify General Supplies", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Invoice Number: ${order.invoiceNumber}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Customer ID: ${order.userId}`);
  doc.moveDown();

  doc.fontSize(14).text("Items:");
  doc.moveDown(0.5);

  order.orderItems.forEach((item) => {
    const line = `${item.product?.name || "Product"} x${item.quantity} - KES ${item.price} each`;
    doc.fontSize(12).text(line);
  });

  doc.moveDown();
  doc
    .fontSize(12)
    .text(`Items Total: KES ${Number(order.itemsPrice).toFixed(2)}`);
  doc.text(`Shipping: KES ${Number(order.shippingPrice).toFixed(2)}`);
  doc.text(`Tax: KES ${Number(order.taxPrice).toFixed(2)}`);
  doc.moveDown();
  doc.fontSize(14).text(`Total: KES ${Number(order.totalPrice).toFixed(2)}`);

  doc.moveDown(2);
  doc.fontSize(10).text("Thank you for your business!", { align: "center" });
}

// for browser
export function generateInvoiceToResponse(order, res) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="invoice-${order.invoiceNumber}.pdf"`,
  );
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  buildInvoicePdf(doc, order);

  doc.end();
}

// generate PDF as Buffer (for email attachment)
export function generateInvoicePdfBuffer(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    buildInvoicePdf(doc, order);

    doc.end();
  });
}
