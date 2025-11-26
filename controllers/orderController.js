import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function calcPrices(orderItems) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0,
  );

  const shippingPrice = 0;
  const taxRate = 0.16;
  const taxPrice = (itemsPrice * taxRate).toFixed(2);
  const totalPrice = (
    itemsPrice +
    shippingPrice +
    parseFloat(taxPrice)
  ).toFixed(2);

  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}

function generateInvoice(order, res) {
  const doc = new PDFDocument();
  const filename = `invoice-${order.invoiceNumber}.pdf`;
  const filepath = path.join("/tmp", filename);

  doc.pipe(fs.createWriteStream(filepath));

  doc.text("Gamify General Supplies").fontSize(32).moveDown();
  doc
    .fontSize(12)
    .text(`Invoice Number: ${order.invoiceNumber}`)
    .text(`Date: ${new Date().toLocaleDateString()}`)
    .text(`Customer ID: ${order.userId}`)
    .moveDown();

  doc.text("Items:");
  order.orderItems.forEach((item) => {
    doc.text(`${item.product.name} x${item.quantity} - ${item.price} each`);
  });

  doc.moveDown();
  doc.text(`Tax: ${order.taxPrice}`);
  doc.text(`Total: ${order.totalPrice}`);
  doc.moveDown();
  doc.fontSize(10).text("Thank you for your business!", { align: "center" });

  doc.end();
  doc.pipe(res);
}

export const createOrder = async (req, res) => {
  try {
    const { orderItems } = req.body;
    const userId = req.user?.id;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    const invoiceNumber = `INV-${uuidv4().slice(0, 8).toUpperCase()}`;

    const productIds = orderItems.map((item) => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const dbOrderItems = [];
    for (const item of orderItems) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (!dbProduct) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      dbOrderItems.push({
        productId: dbProduct.id,
        quantity: item.quantity,
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
        taxPrice: Number(taxPrice),
        totalPrice: Number(totalPrice),
        orderItems: {
          create: dbOrderItems,
        },
        invoiceNumber,
      },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    });

    return res.status(201).json({ order });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSingleUserOrders = async (req, res) => {
  const userId = req.params.id;
  try {
    const singleUserOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    });
    res.status(200).json({ singleUserOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUserOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
      include: {
        // remove order items if need be.
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSingleOrderById = async (req, res) => {
  const orderId = await req.params.orderId;
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    });
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTotalOrders = async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    res.status(200).json({ totalOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTotalSales = async (req, res) => {
  try {
    const orders = await prisma.order.findMany();
    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0,
    );
    res.status(200).json({ totalSales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markOrderAsDelivered = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const delivered = await prisma.order.update({
      where: { id: orderId },
      data: { isDelivered: true, deliveredAt: new Date() },
    });
    res.status(201).json({ delivered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markOrderAsPaid = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const paidProduct = await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true, paidAt: new Date() },
    });
    res.status(201).json({ paidProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "order not found" });
    }

    generateInvoice(order, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
