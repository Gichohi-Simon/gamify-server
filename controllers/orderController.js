import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import { sendResendEmails } from "../utils/resend.js";
import {
  adminNewOrderEmail,
  customerOrderDeliveredEmail,
  customerOrderPlacedEmail,
} from "../utils/orderEmailTemplates.js";

const prisma = new PrismaClient();

function calcPrices(orderItems) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0,
  );

  const shippingPrice = 0;
  const taxRate = 0.16;

  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}

function canAccessOrder(reqUser, orderUserId) {
  if (!reqUser) return false;
  if (reqUser.role === "ADMIN" || reqUser.role === "EMPLOYEE") return true;
  return reqUser.id === orderUserId;
}

function generateInvoiceToResponse(order, res) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="invoice-${order.invoiceNumber}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(22).text("Gamify General Supplies", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Invoice Number: ${order.invoiceNumber}`);
  doc.text(
    `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`,
  );
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

  doc.end();
}

export const createOrder = async (req, res) => {
  try {
    const { orderItems } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    for (const item of orderItems) {
      if (!item?.productId) {
        return res
          .status(400)
          .json({ message: "Each order item must have productId" });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res
          .status(400)
          .json({ message: "Quantity must be a positive integer" });
      }
    }

    const invoiceNumber = `INV-${uuidv4().slice(0, 8).toUpperCase()}`;

    const productIds = orderItems.map((item) => item.productId);

    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: { id: true, price: true, name: true, images: true },
    });

    const dbOrderItems = [];
    for (const item of orderItems) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (!dbProduct) {
        return res.status(404).json({
          message: `Product not found or inactive: ${item.productId}`,
        });
      }

      dbOrderItems.push({
        productId: dbProduct.id,
        quantity: Number(item.quantity),
        price: dbProduct.price,
      });
    }

    const { itemsPrice, shippingPrice, taxPrice, totalPrice } =
      calcPrices(dbOrderItems);

    const order = await prisma.order.create({
      data: {
        userId,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        invoiceNumber,
        orderItems: {
          create: dbOrderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
        user: { select: { id: true, username: true, email: true } },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true, isBanned: false },
      select: { email: true },
    });

    const adminEmails = admins.map((a) => a.email);

    try {
      await sendResendEmails({
        to: order.user.email,
        subject: `Order Confirmed - ${order.invoiceNumber}`,
        html: customerOrderPlacedEmail(order),
      });

      if (adminEmails.length > 0) {
        await sendResendEmails({
          to: adminEmails,
          subject: `New Order - ${order.invoiceNumber}`,
          html: adminNewOrderEmail(order, order.user),
        });
      }
    } catch (error) {
      console.error("Resend email failed:", error);
    }

    return res.status(201).json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create order" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get orders" });
  }
};

export const getSingleUserOrders = async (req, res) => {
  const userId = req.params.id;

  try {
    const singleUserOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
    });

    return res.status(200).json({ singleUserOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get user orders" });
  }
};

export const getCurrentUserOrders = async (req, res) => {
  const userId = req.user?.id;

  try {
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get your orders" });
  }
};

export const getSingleOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            deliveryAddress: true,
          },
        },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!canAccessOrder(req.user, order.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get order" });
  }
};

export const getTotalOrders = async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    return res.status(200).json({ totalOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get total orders" });
  }
};

export const getTotalSales = async (req, res) => {
  try {
    const result = await prisma.order.aggregate({
      _sum: { totalPrice: true },
    });

    const totalSales = Number(result._sum.totalPrice || 0);

    return res.status(200).json({ totalSales });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get total sales" });
  }
};

export const markOrderAsDelivered = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, username: true } },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.isDelivered) {
      return res.status(400).json({
        message: "Order is already deliverd",
      });
    }

    const delivered = await prisma.order.update({
      where: { id: orderId },
      data: { isDelivered: true, deliveredAt: new Date() },
      include: {
        user: { select: { email: true, username: true } },
      },
    });

    try {
      await sendResendEmails({
        to: delivered.user.email,
        subject: `Delivered ✅ - ${delivered.invoiceNumber || delivered.id}`,
        html: customerOrderDeliveredEmail(delivered),
      });
    } catch (emailErr) {
      console.error("Delivered email failed:", emailErr);
    }

    return res.status(200).json({ delivered });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to mark order as delivered" });
  }
};

export const markOrderAsPaid = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const paidOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true, paidAt: new Date() },
    });

    return res.status(200).json({ paidOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to mark order as paid" });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        orderItems: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!canAccessOrder(req.user, order.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return generateInvoiceToResponse(order, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to generate invoice" });
  }
};
