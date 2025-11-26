import express from "express";
import {
  createOrder,
  getAllOrders,
  getCurrentUserOrders,
  getInvoice,
  getSingleUserOrders,
  getTotalOrders,
  getTotalSales,
  markOrderAsDelivered,
  markOrderAsPaid,
  getSingleOrderById,
} from "../controllers/orderController.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/create-order", authenticate, createOrder);
router.get("/allOrders", authenticate, authorizeAdmin, getAllOrders);
router.get("/total-orders", authenticate, authorizeAdmin, getTotalOrders);
router.get("/total-sales", authenticate, authorizeAdmin, getTotalSales);
router.get("/get-current-user-orders", authenticate, getCurrentUserOrders);
router.get("/invoice/:orderId", authenticate, getInvoice);
router.get("/get-user-order-by-id", authenticate, getSingleOrderById);
router.get(
  "/singleUser-orders/:id",
  authenticate,
  authorizeAdmin,
  getSingleUserOrders,
);
router.patch(
  "/mark-as-delivered/:orderId",
  authenticate,
  authorizeAdmin,
  markOrderAsDelivered,
);
router.patch(
  "/mark-as-paid/:orderId",
  authenticate,
  authorizeAdmin,
  markOrderAsPaid,
);

export default router;
