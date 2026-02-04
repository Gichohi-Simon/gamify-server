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
  authorizeAdminOrEmployee,
} from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/create-order", authenticate, createOrder);

router.get("/allOrders", authenticate, authorizeAdminOrEmployee, getAllOrders);
router.get(
  "/total-orders",
  authenticate,
  authorizeAdminOrEmployee,
  getTotalOrders,
);
router.get(
  "/total-sales",
  authenticate,
  authorizeAdminOrEmployee,
  getTotalSales,
);

router.get("/get-current-user-orders", authenticate, getCurrentUserOrders);

router.get("/invoice/:orderId", authenticate, getInvoice);
router.get("/get-user-order-by-id/:orderId", authenticate, getSingleOrderById);

router.get(
  "/singleUser-orders/:id",
  authenticate,
  authorizeAdminOrEmployee,
  getSingleUserOrders,
);

router.patch(
  "/mark-as-delivered/:orderId",
  authenticate,
  authorizeAdminOrEmployee,
  markOrderAsDelivered,
);

router.patch(
  "/mark-as-paid/:orderId",
  authenticate,
  authorizeAdminOrEmployee,
  markOrderAsPaid,
);

export default router;
