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
  getRandomFourProducts,
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
  upload.array("images", 4),
  createProduct,
);
router.get("/all-products", getAllProducts);
router.get("/get-random-four-products", getRandomFourProducts);
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
  upload.array("images", 4),
  updateProduct,
);

export default router;
