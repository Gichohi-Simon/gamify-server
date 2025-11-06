import express from "express";
import {
  createAddress,
  deleteAddress,
  getLoggedInUserAddress,
  updateAddress,
} from "../controllers/addressController.js";
import { authenticate } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/create-address", authenticate, createAddress);
router.patch("/update-address", authenticate, updateAddress);
router.get("/get-logged-in-user-address", authenticate, getLoggedInUserAddress);
router.delete("/delete-address", authenticate, deleteAddress);

export default router;
