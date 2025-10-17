import express from "express";
import {
  deleteAccount,
  deleteUser,
  // getActiveUsers,
  getAllUsers,
  getDeletedAccounts,
  getLoggedInUser,
  getSingleUser,
  makeAdmin,
  removeAdmin,
} from "../controllers/userController.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/allUsers", getAllUsers);
// router.get("/allUsers", authenticate, authorizeAdmin, getAllUsers);
router.get("/logged-in-user", authenticate, getLoggedInUser);
// router.get("/getActiveusers", authenticate,authorizeAdmin ,getActiveUsers);
router.get(
  "/getDeletedAccounts",
  authenticate,
  authorizeAdmin,
  getDeletedAccounts
);
router.patch("/delete-account", authenticate, deleteAccount);
router.get("/single-user/:id", authenticate, authorizeAdmin, getSingleUser);
router.patch("/deleteUser/:id", authenticate, authorizeAdmin, deleteUser);
router.patch("/makeAdmin/:id", authenticate, authorizeAdmin, makeAdmin);
router.patch("/removeAdmin/:id", authenticate, authorizeAdmin, removeAdmin);

export default router;
