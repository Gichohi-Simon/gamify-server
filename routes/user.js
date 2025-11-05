import express from "express";
import {
  userAccountDeletion,
  banUserFromPlatform,
  getAllUsers,
  getDeletedAccounts,
  getSingleUser,
  makeAdmin,
  removeAdmin,
  restoreBannedUserToPlatform,
} from "../controllers/userController.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/allUsers", authenticate, authorizeAdmin, getAllUsers);

router.get(
  "/getDeletedAccounts",
  authenticate,
  authorizeAdmin,
  getDeletedAccounts,
);
router.patch("/delete-my-account", authenticate, userAccountDeletion);
router.get("/single-user/:id", authenticate, authorizeAdmin, getSingleUser);
router.patch(
  "/ban-user-from-platform/:id",
  authenticate,
  authorizeAdmin,
  banUserFromPlatform,
);
router.patch(
  "/restore-banned-user-to-platform/:id",
  authenticate,
  authorizeAdmin,
  restoreBannedUserToPlatform,
);
router.patch("/makeAdmin/:id", authenticate, authorizeAdmin, makeAdmin);
router.patch("/removeAdmin/:id", authenticate, authorizeAdmin, removeAdmin);

export default router;
