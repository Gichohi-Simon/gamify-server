import express from "express";
import {
  createProduct,
  deleteSingleProduct,
  getAllProducts,
  getFirstFourProducts,
  getPaginatedProducts,
  getSingleProduct,
  searchProducts,
  updateProduct,
  getProductsByIds,
} from "../controllers/productController.js";
import {
  authorizeAdmin,
  authenticate,
} from "../middlewares/authMiddlewares.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post(
  "/create-product",
  authenticate,
  authorizeAdmin,
  upload.single("image"),
  createProduct,
);
router.get("/all-products", getAllProducts);
router.get("/search", searchProducts);
router.get("/", getPaginatedProducts);
router.get("/getFirstFour", getFirstFourProducts);
router.get("/by-ids", getProductsByIds);
router.get("/:id", getSingleProduct);
router.delete("/:id", authenticate, authorizeAdmin, deleteSingleProduct);
router.patch(
  "/update-product/:id",
  authenticate,
  authorizeAdmin,
  updateProduct,
);

export default router;
